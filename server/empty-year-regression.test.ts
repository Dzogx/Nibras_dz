/**
 * اختبار انحدار: متى مرّرت الواجهة سنة دراسية فارغة ("" أو undefined) لأي
 * استعلام حساس، يجب ألا يرمي الخادم خطأ تحقق «too_small» يكسر الصفحة —
 * بل يشتق السنة من الموسم المفعّل في النظام ويعيد النتيجة.
 */
import { describe, it, beforeEach, expect, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getWeeklyScheduleEntries: vi.fn(),
  getAnnualPlans: vi.fn(),
  getClasses: vi.fn(),
  getUpcomingCompensatorySessions: vi.fn(),
  getActiveAcademicYear: vi.fn(),
  getLessons: vi.fn(),
  getAnnualPlanSections: vi.fn(),
  getSituationById: vi.fn(),
  getSituationCompetencyContext: vi.fn(),
  getCompetencyProgress: vi.fn(),
  getWeeklyReadinessSummary: vi.fn(),
  getUserProfile: vi.fn(),
  getCompletedLessons: vi.fn(),
  getUpcomingSituations: vi.fn(),
  getMonthlySummary: vi.fn(),
  getScheduledCompensatorySessions: vi.fn(),
  updateSituationsStatusBatch: vi.fn(),
  listPendingSituations: vi.fn(),
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

function makeCtx(u: AuthenticatedUser = user): TrpcContext {
  return {
    user: u,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("انحدار السنة الفارغة — الاستعلامات لا تنهار", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getActiveAcademicYear).mockResolvedValue("2026-2027");
  });

  it("weeklySchedule.get بسنة فارغة يشتق السنة المفعّلة ولا يرمي خطأ تحقق", async () => {
    vi.mocked(db.getWeeklyScheduleEntries).mockResolvedValue([{ id: 1, academicYear: "2026-2027" }] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.weeklySchedule.get({ academicYear: "" });
    expect(result).toHaveLength(1);
    expect(db.getWeeklyScheduleEntries).toHaveBeenCalledWith(1, "2026-2027");
  });

  it("weeklySchedule.get بلا input يشتق السنة المفعّلة", async () => {
    vi.mocked(db.getWeeklyScheduleEntries).mockResolvedValue([] as any);
    const caller = appRouter.createCaller(makeCtx());
    await caller.weeklySchedule.get();
    expect(db.getWeeklyScheduleEntries).toHaveBeenCalledWith(1, "2026-2027");
  });

  it("seasonReadiness.get بسنة فارغة يشتق السنة ويعيد الجاهزية", async () => {
    vi.mocked(db.getClasses).mockResolvedValue([{ id: 5, name: "3م1", academicYear: "2026-2027" }] as any);
    vi.mocked(db.getAnnualPlans).mockResolvedValue([] as any);
    vi.mocked(db.getWeeklyScheduleEntries).mockResolvedValue([{ id: 1, academicYear: "2026-2027", classId: 5 }] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.seasonReadiness.get({ academicYear: "" });
    expect(result).toEqual(
      expect.objectContaining({
        academicYear: "2026-2027",
        totalClasses: 1,
        incompleteClasses: 1,
      })
    );
    expect(db.getAnnualPlans).toHaveBeenCalledWith(1, { academicYear: "2026-2027" });
    expect(db.getWeeklyScheduleEntries).toHaveBeenCalledWith(1, "2026-2027");
  });

  it("compensatorySessions.list بسنة فارغة يشتق السنة المفعّلة", async () => {
    vi.mocked(db.getScheduledCompensatorySessions).mockResolvedValue([] as any);
    const caller = appRouter.createCaller(makeCtx());
    await caller.compensatorySessions.list({ academicYear: "" });
    // الدالة الداخلية تستقبل معلم المستخدم والسنة المشتقة فقط
    expect(db.getUpcomingCompensatorySessions).toHaveBeenCalledWith(1, "2026-2027");
  });

  it("ai.getTeacherOSContext بلا input لا يرمي خطأ تحقق ويستمر بسنة مشتقة", async () => {
    vi.mocked(db.getLessons).mockResolvedValue([] as any);
    vi.mocked(db.getAnnualPlans).mockResolvedValue([] as any);
    vi.mocked(db.getAnnualPlanSections).mockResolvedValue([] as any);
    const caller = appRouter.createCaller(makeCtx());
    // لا يرمي: الاستعلام مقبول بلا input على الإطلاق
    await expect(caller.ai.getTeacherOSContext()).resolves.not.toThrow();
  });

  it("ai.getTeacherOSContext بسنة فارغة يشتق السنة المفعّلة للمخططات", async () => {
    vi.mocked(db.getLessons).mockResolvedValue([] as any);
    vi.mocked(db.getAnnualPlans).mockResolvedValue([{ id: 9, classId: 5, academicYear: "2026-2027" }] as any);
    vi.mocked(db.getAnnualPlanSections).mockResolvedValue([] as any);
    const caller = appRouter.createCaller(makeCtx());
    await caller.ai.getTeacherOSContext({ classId: 5, academicYear: "" });
    expect(db.getAnnualPlans).toHaveBeenCalledWith(1, { academicYear: "2026-2027" });
  });

  it("بدون موسم مفعّل لا تنهار الاستعلامات: تعيد نتائج فارغة بدل خطأ", async () => {
    vi.mocked(db.getActiveAcademicYear).mockResolvedValue(undefined);
    vi.mocked(db.getWeeklyScheduleEntries).mockResolvedValue([] as any);
    vi.mocked(db.getAnnualPlans).mockResolvedValue([] as any);
    vi.mocked(db.getClasses).mockResolvedValue([] as any);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.weeklySchedule.get({ academicYear: "" })).resolves.toEqual([]);
    const readiness = await caller.seasonReadiness.get({ academicYear: "" });
    expect(readiness).toEqual(expect.objectContaining({ academicYear: "", totalClasses: 0, items: [] }));
  });
});
