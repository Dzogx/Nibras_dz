import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listSavedStrategies: vi.fn(),
  getSavedStrategyById: vi.fn(),
  saveStrategy: vi.fn(),
  updateSavedStrategy: vi.fn(),
  deleteSavedStrategy: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const user: AuthenticatedUser = {
  id: 1,
  openId: "sample-user",
  email: "sample@example.com",
  name: "أستاذ تجارب",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const otherUser: AuthenticatedUser = { ...user, id: 99 };

function makeCtx(u: AuthenticatedUser = user): TrpcContext {
  return {
    user: u,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const strategyPayload = {
  strategy: {
    kind: "learning",
    name: "الاستجواب المتدرج وفق هرم بلوم",
    rationale: "يقود الأستاذ أسئلة متدرجة من التذكر إلى التحليل",
    phases: [
      { stage: "التمهيد", minutes: 5, teacherRole: "يحفّز", studentRole: "يستجيب", tips: "" },
      { stage: "الاستجواب", minutes: 20, teacherRole: "يسأل", studentRole: "يجيب", tips: "" },
      { stage: "الخلاصة", minutes: 10, teacherRole: "يلخّص", studentRole: "يدوّن", tips: "" },
      { stage: "التقويم", minutes: 10, teacherRole: "يراجع", studentRole: "ينجّز", tips: "" },
      { stage: "الإغلاق", minutes: 10, teacherRole: "يقيّم", studentRole: "يتأمل", tips: "" },
    ],
    totalMinutes: 55,
    generalTips: ["استخدم الانتظار بعد السؤال"],
  },
  situationType: "learning" as const,
  subject: "التاريخ والجغرافيا",
  situationTitle: "الحرب الجزائرية: الانطلاقة",
};

describe("دفتر التجارب — savedStrategies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("يسرد الاستراتيجيات المحفوظة مع الفلترة حسب المادة ونوع الوضعية", async () => {
    const rows = [{ id: 5, userId: 1, name: "ت", subject: "التاريخ" }];
    vi.mocked(db.listSavedStrategies).mockResolvedValue(rows as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.savedStrategies.list({ subject: "التاريخ" } as any);
    expect(result).toEqual(rows);
    expect(db.listSavedStrategies).toHaveBeenCalledWith(1, { subject: "التاريخ", situationType: undefined, minRating: undefined, search: undefined });
  });

  it("يحفظ استراتيجية من المحرك ويعيدها بالمعرّف", async () => {
    vi.mocked(db.saveStrategy).mockResolvedValue({ id: 42 } as any);
    vi.mocked(db.getSavedStrategyById).mockResolvedValue({ id: 42, ...strategyPayload } as any);
    const caller = appRouter.createCaller(makeCtx());
    const saved = await caller.savedStrategies.save(strategyPayload as any);
    expect(saved.success).toBe(true);
    expect(saved.id).toBe(42);
    expect(db.saveStrategy).toHaveBeenCalled();
    const fetched = await caller.savedStrategies.getById({ id: 42 } as any);
    expect(fetched?.id).toBe(42);
    expect(db.getSavedStrategyById).toHaveBeenCalledWith(42, 1);
  });

  it("يحفظ استراتيجية عامة من تأليف الأستاذ", async () => {
    vi.mocked(db.saveStrategy).mockResolvedValue({ id: 7 } as any);
    const caller = appRouter.createCaller(makeCtx());
    const saved = await caller.savedStrategies.saveCustom({
      name: "العصف الذهني في التربية المدنية",
      situationType: "learning",
      subject: "التربية المدنية",
      rationale: "توليد أفكار جماعية",
    } as any);
    expect(saved.success).toBe(true);
    expect(db.saveStrategy).toHaveBeenCalled();
    const callArg = vi.mocked(db.saveStrategy).mock.calls[0]?.[1];
    expect((callArg as any).source).toBe("custom");
  });

  it("يحرس الملكية: لا يحقّق أستاذ في استراتيجية غيره", async () => {
    vi.mocked(db.getSavedStrategyById).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx(otherUser));
    await expect(caller.savedStrategies.getById({ id: 5 } as any)).rejects.toThrow(/غير موجودة/);
    expect(db.getSavedStrategyById).toHaveBeenCalledWith(5, 99);
  });

  it("يسجّل الاستخدام ويعدّده", async () => {
    vi.mocked(db.getSavedStrategyById).mockResolvedValue({ id: 5, useCount: 2 } as any);
    vi.mocked(db.updateSavedStrategy).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.savedStrategies.markUsed({ id: 5 } as any);
    expect(result.useCount).toBe(3);
    expect(db.updateSavedStrategy).toHaveBeenCalledWith(5, 1, expect.objectContaining({ useCount: 3, lastUsedAt: expect.any(Date) }));
  });

  it("يسجّل تقييمًا ويلحق ملاحظة التجربة بالملاحظات السابقة", async () => {
    vi.mocked(db.getSavedStrategyById).mockResolvedValue({ id: 5, experienceNotes: "تجربة أولى" } as any);
    vi.mocked(db.updateSavedStrategy).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await caller.savedStrategies.review({ id: 5, rating: 5, experienceNotes: "نجحت مع القسم 2" } as any);
    expect(db.updateSavedStrategy).toHaveBeenCalledWith(
      5,
      1,
      expect.objectContaining({
        rating: 5,
        experienceNotes: "تجربة أولى\n---\nنجحت مع القسم 2",
      })
    );
  });

  it("يلاحظ استراتيجية بعد التحقق من الملكية", async () => {
    vi.mocked(db.getSavedStrategyById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.deleteSavedStrategy).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.savedStrategies.delete({ id: 5 } as any);
    expect(result.success).toBe(true);
    expect(db.deleteSavedStrategy).toHaveBeenCalledWith(5, 1);
  });
});
