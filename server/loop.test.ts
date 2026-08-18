import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";

// Mock the db module
vi.mock("./db", () => ({
  getClasses: vi.fn(() => Promise.resolve([
    { id: 1, name: "1AM1", gradeLevel: "السنة الأولى متوسط", subject: "التاريخ والجغرافيا", academicYear: "2025-2026", teacherId: "user-1" },
  ])),
  getAnnualPlans: vi.fn(() => Promise.resolve([
    { id: 1, classId: 1, title: "الخطة السنوية", subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2025-2026", userId: "user-1" },
  ])),
  getAnnualPlanById: vi.fn(() => Promise.resolve({ id: 1, userId: "user-1", isReference: false })),
  getAnnualPlanSections: vi.fn(() => Promise.resolve([
    { id: 1, annualPlanId: 1, sectionNumber: 1, title: "المقطع الأول", isCompleted: false, sectionOrder: 1 },
    { id: 2, annualPlanId: 1, sectionNumber: 2, title: "المقطع الثاني", isCompleted: true, sectionOrder: 2 },
  ])),
  getAnnualPlanSectionById: vi.fn((id: number) => Promise.resolve({ id, annualPlanId: 1 })),
  getLearningSituations: vi.fn((sectionId: number) => {
    if (sectionId === 1) return Promise.resolve([
      { id: 1, sectionId: 1, situationNumber: 1, title: "الوضعية 1", isCompleted: true },
      { id: 2, sectionId: 1, situationNumber: 2, title: "الوضعية 2", isCompleted: false },
    ]);
    return Promise.resolve([
      { id: 3, sectionId: 2, situationNumber: 1, title: "وضعية المقطع 2", isCompleted: true },
    ]);
  }),
  getPendingOperationalLearningSituationsByUserId: vi.fn(() => Promise.resolve([])),
  getLearningSituationById: vi.fn((id: number) => Promise.resolve({ id, sectionId: 1, title: "وضعية اختبار", isCompleted: false })),
  getLessons: vi.fn(() => Promise.resolve([
    { id: 1, title: "درس 1", isCompleted: true, objectives: "فهم الثورة الجزائرية", gradeLevel: "السنة الأولى متوسط" },
    { id: 2, title: "درس 2", isCompleted: true, objectives: "تحليل الوثائق التاريخية", gradeLevel: "السنة الأولى متوسط" },
  ])),
  getAssessmentResults: vi.fn(() => Promise.resolve([
    { id: 1, classId: 1, title: "اختبار 1", totalStudents: 30, participatedStudents: 28, averageScore: 9.5, passedCount: 10, historyAverage: 8.5, geographyAverage: 10.5 },
    { id: 2, classId: 1, title: "اختبار 2", totalStudents: 30, participatedStudents: 30, averageScore: 12.0, passedCount: 20, historyAverage: 11.0, geographyAverage: 13.0 },
  ])),
  createAnnualPlanSection: vi.fn(() => Promise.resolve({ id: 3 })),
  createLearningSituation: vi.fn(() => Promise.resolve({ id: 4 })),
  createAssessmentResult: vi.fn(() => Promise.resolve({ id: 3 })),
  updateAnnualPlanSection: vi.fn(() => Promise.resolve({})),
  updateLearningSituation: vi.fn(() => Promise.resolve({})),
  deleteAnnualPlanSection: vi.fn(() => Promise.resolve({})),
  deleteLearningSituation: vi.fn(() => Promise.resolve({})),
  deleteAssessmentResult: vi.fn(() => Promise.resolve({})),
}));

const caller = appRouter.createCaller({
  user: { id: "user-1", name: "Test Teacher", email: "test@example.com", role: "user" },
  req: {} as any,
  res: {} as any,
});

describe("Full Pedagogical Loop", () => {
  it("should create a section in an annual plan", async () => {
    const result = await caller.sections.create({
      annualPlanId: 1,
      sectionNumber: 3,
      title: "المقطع الثالث",
      competencies: "تحليل الأحداث التاريخية",
      objectives: "فهم أسباب الثورة",
      resources: "الكتاب المدرسي",
    });
    expect(result).toBeDefined();
  });

  it("should list sections for an annual plan", async () => {
    const sections = await caller.sections.list({ annualPlanId: 1 });
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("المقطع الأول");
  });

  it("should get Teacher OS context with current section and next situation", async () => {
    const context = await caller.ai.getTeacherOSContext({ classId: 1 });
    expect(context.currentSection).toBeDefined();
    expect(context.nextSituation).toBeDefined();
    expect(context.sectionProgress).toEqual({ completed: 2, total: 3 });
    expect(context.currentSectionProgress).toEqual({ completed: 1, total: 2 });
    expect(context.completedLessons.length).toBe(2);
  });

  it("should analyze results and identify weak domains", async () => {
    const analysis = await caller.results.analyze({ classId: 1 });
    expect(analysis.totalAssessments).toBe(2);
    expect(analysis.avgHistory).toBeDefined();
    expect(analysis.avgGeography).toBeDefined();
  });

  it("should create a result entry", async () => {
    const result = await caller.results.create({
      classId: 1,
      title: "اختبار الفصل الثاني",
      totalStudents: 30,
      participatedStudents: 29,
      averageScore: 11.5,
      passedCount: 18,
      historyAverage: 10.5,
      geographyAverage: 12.5,
    });
    expect(result).toBeDefined();
  });
});
