import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getActiveAcademicYear: vi.fn(),
  getTermCompetencyReport: vi.fn(),
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

const mockModel = {
  id: 1,
  userId: "1",
  gradeLevel: "السنة الأولى متوسط",
  subject: "التاريخ والجغرافيا",
  globalCompetency: "يفهم تفاعلات الإنسان مع بيئته في الزمان والمكان",
  sourceDocTitle: "مخطط السنة الأولى",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRows = [
  {
    sectionNumber: 1,
    sectionTitle: "تطور العالم في ظل الثنائية القطبية",
    termCompetency: "تحليل أسباب ونتائج الثنائية القطبية",
    competencyAction: "تنصيب كفاءات جديدة",
    criteria: [],
    knowledgeResources: [],
    situationsTotal: 4,
    situationsCompleted: 3,
    situationsPartial: 1,
    situationsPostponed: 0,
    situationsCancelled: 0,
    masteryPct: 100,
    operational: true,
  },
  {
    sectionNumber: 2,
    sectionTitle: "الجزائر أثناء الاحتلال",
    termCompetency: "شرح طبيعة الاحتلال الاستيطاني",
    competencyAction: "تنصيب كفاءات جديدة",
    criteria: [],
    knowledgeResources: [],
    situationsTotal: 5,
    situationsCompleted: 2,
    situationsPartial: 0,
    situationsPostponed: 2,
    situationsCancelled: 1,
    masteryPct: 40,
    operational: true,
  },
  {
    sectionNumber: 4,
    sectionTitle: "الموارد الطبيعية في الجزائر",
    termCompetency: "تحليل توزيع الموارد الطبيعية",
    competencyAction: "إنماء كفاءات قائمة",
    criteria: [],
    knowledgeResources: [],
    situationsTotal: 3,
    situationsCompleted: 1,
    situationsPartial: 1,
    situationsPostponed: 0,
    situationsCancelled: 0,
    masteryPct: 67,
    operational: false,
  },
];

describe("كشف التقدم الفصلي للكفاءات — competencyModel.termReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("يرجع حصيلة فصيلة صحيحة مع تجميع الفصول الثلاثة", async () => {
    vi.mocked(db.getActiveAcademicYear).mockResolvedValue("2026/2027");
    vi.mocked(db.getTermCompetencyReport).mockResolvedValue({ model: mockModel, report: mockRows });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.competencyModel.termReport({
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الأولى متوسط",
    });

    expect(result.model).toBe(mockModel);
    expect(result.academicYear).toBe("2026/2027");
    expect(result.report.length).toBe(3);

    const t1 = result.terms.find(t => t.label === "الفصل الأول");
    const t2 = result.terms.find(t => t.label === "الفصل الثاني");
    expect(t1!.rows.length).toBe(2);
    expect(t1!.total).toBe(9);
    expect(t1!.done).toBe(6); // مقطع1: 3 منجز + 1 جزئي = 4؛ مقطع2: 2 منجز + 0 جزئي = 2
    expect(t1!.pct).toBe(67);
    expect(t2!.rows.length).toBe(1);
    expect(t2!.total).toBe(3);
    expect(t2!.done).toBe(2); // 1 منجز + 1 جزئي
    expect(t2!.pct).toBe(67);
    expect(result.terms.find(t => t.label === "الفصل الثالث")!.rows.length).toBe(0);

    expect(result.overallTotal).toBe(12);
    expect(result.overallDone).toBe(8);
    expect(result.overallPct).toBe(67);
    expect(db.getTermCompetencyReport).toHaveBeenCalledWith(1, "التاريخ والجغرافيا", "السنة الأولى متوسط", "2026/2027");
  });

  it("يعالج عدم وجود سنة مفعّلة بصفحة فارغة آمنة", async () => {
    vi.mocked(db.getActiveAcademicYear).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.competencyModel.termReport({ subject: "التاريخ", gradeLevel: "السنة الأولى متوسط" });
    expect(result.model).toBeNull();
    expect(result.terms.length).toBe(0);
    expect(result.overallPct).toBe(0);
    expect(db.getTermCompetencyReport).not.toHaveBeenCalled();
  });

  it("يعالج عدم وجود نموذج كفاءات للمستوى/المادة", async () => {
    vi.mocked(db.getActiveAcademicYear).mockResolvedValue("2026/2027");
    vi.mocked(db.getTermCompetencyReport).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.competencyModel.termReport({ subject: "التربية المدنية", gradeLevel: "السنة الرابعة متوسط" });
    expect(result.model).toBeNull();
    expect(result.academicYear).toBe("2026/2027");
  });

  it("يتطلب تسجيل الدخول", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as unknown as TrpcContext);
    await expect(
      caller.competencyModel.termReport({ subject: "التاريخ", gradeLevel: "السنة الأولى متوسط" }),
    ).rejects.toThrow();
  });
});
