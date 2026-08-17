import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock the db module
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getTeacherProfile: vi.fn(),
  createTeacherProfile: vi.fn(),
  getAcademicYears: vi.fn(),
  getCurriculumForTopic: vi.fn(),
  getCurriculumDocuments: vi.fn(),
  getClasses: vi.fn(),
  getClassById: vi.fn(),
  createClass: vi.fn(),
  getAnnualPlans: vi.fn(),
  getAnnualPlanById: vi.fn(),
  createAnnualPlan: vi.fn(),
  getAnnualPlanSections: vi.fn(),
  getAnnualPlanSectionById: vi.fn(),
  createAnnualPlanSection: vi.fn(),
  getLearningSituations: vi.fn(),
  getLearningSituationsByUserId: vi.fn(),
  createLearningSituation: vi.fn(),
  toggleLearningSituationCompleted: vi.fn(),
  getLessons: vi.fn(),
  getLessonById: vi.fn(),
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
  getAssessmentResults: vi.fn(),
  createAssessmentResult: vi.fn(),
  getTeachingNotes: vi.fn(),
  createTeachingNote: vi.fn(),
  getAIResources: vi.fn(),
  getAIResourceById: vi.fn(),
  createAIResource: vi.fn(),
  updateAIResource: vi.fn(),
  deleteAIResource: vi.fn(),
  duplicateAIResource: vi.fn(),
  getInspectorReviews: vi.fn(),
  createInspectorReview: vi.fn(),
  getInspectorReviewById: vi.fn(),
}));

import * as db from "./db";

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: { content: "موضوع الاختبار: الثورة الجزائرية\nالأسئلة:\n1. سؤال عن التاريخ (مرجع: 1 — وثيقة المنهاج)\n2. سؤال عن الجغرافيا (مرجع: 1 — وثيقة المنهاج)" }
    }]
  }),
}));

const mockContext = {
  user: { id: 1, openId: "test-user", name: "أستاذ تجريبي", role: "user" as const },
};

describe("Full Pedagogical Loop E2E", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ينهي الحصة ويسجل ملاحظة الأستاذ في الإجراء نفسه", async () => {
    const caller = appRouter.createCaller(mockContext as any);
    vi.mocked(db.getLearningSituationsByUserId).mockResolvedValue([{
      id: 17,
      title: "التحولات السياسية في الجزائر",
      sectionId: 4,
      isCompleted: false,
    }] as any);
    vi.mocked(db.toggleLearningSituationCompleted).mockResolvedValue(undefined);
    vi.mocked(db.createTeachingNote).mockResolvedValue({ id: 8 } as any);

    const result = await caller.situations.completeSession({
      situationId: 17,
      note: "احتاج التلاميذ إلى دعم إضافي في ترتيب الأحداث زمنياً.",
    });

    expect(result).toEqual({ success: true, noteSaved: true });
    expect(db.toggleLearningSituationCompleted).toHaveBeenCalledWith(17, true);
    expect(db.createTeachingNote).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      title: "ملاحظة حصة: التحولات السياسية في الجزائر",
      content: "احتاج التلاميذ إلى دعم إضافي في ترتيب الأحداث زمنياً.",
    }));
  });

  it("should create a class, plan, section, situation, lesson, and generate assessment", async () => {
    const caller = appRouter.createCaller(mockContext as any);

    // Step 1: Create a class
    vi.mocked(db.createClass).mockResolvedValue({ id: 1 } as any);
    const createdClass = await caller.classes.create({
      name: "الفصل 1أ",
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التاريخ والجغرافيا",
      academicYear: "2024/2025",
    });
    expect(createdClass?.id).toBe(1);

    // Step 2: Create an annual plan
    vi.mocked(db.createAnnualPlan).mockResolvedValue({ id: 1 } as any);
    const createdPlan = await caller.annualPlans.create({
      classId: 1,
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      academicYear: "2024/2025",
      title: "المخطط السنوي",
    });
    expect(createdPlan?.id).toBe(1);

    // Step 3: Create a section
    vi.mocked(db.createAnnualPlanSection).mockResolvedValue({ id: 1 } as any);
    const createdSection = await caller.sections.create({
      annualPlanId: 1,
      sectionNumber: 1,
      title: "المقطع الأول: الثورة الجزائرية",
      duration: "3 أسابيع",
      competencies: "فهم الأحداث التاريخية",
      objectives: "تحليل أسباب الثورة",
    });
    expect(createdSection?.id).toBe(1);

    // Step 4: Create a situation
    vi.mocked(db.createLearningSituation).mockResolvedValue({ id: 1 } as any);
    const createdSituation = await caller.situations.create({
      sectionId: 1,
      situationNumber: 1,
      title: "وضعية إدماجية: تحليل أسباب اندلاع الثورة",
      objectives: "تحليل العوامل الداخلية والخارجية",
      content: "وضعية تعليمية حول الثورة الجزائرية",
    });
    expect(createdSituation?.id).toBe(1);

    // Step 5: Mark situation as completed
    vi.mocked(db.toggleLearningSituationCompleted).mockResolvedValue(undefined);
    await caller.situations.toggleCompleted({ id: 1, isCompleted: true });

    // Step 6: Create a lesson from the situation
    vi.mocked(db.getClassById).mockResolvedValue({
      id: 1,
      name: "الفصل 1أ",
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التاريخ والجغرافيا",
    } as any);
    vi.mocked(db.getAnnualPlanSectionById).mockResolvedValue({
      id: 1,
      title: "المقطع الأول: الثورة الجزائرية",
    } as any);
    vi.mocked(db.getLearningSituationsByUserId).mockResolvedValue([{
      id: 1,
      sectionId: 1,
      situationNumber: 1,
      title: "وضعية إدماجية: تحليل أسباب اندلاع الثورة",
      objectives: "تحليل العوامل الداخلية والخارجية",
      content: "وضعية تعليمية حول الثورة الجزائرية",
      isCompleted: true,
    }] as any);
    vi.mocked(db.createLesson).mockResolvedValue({ id: 1 } as any);

    const createdLesson = await caller.sections.createLessonFromSituation({
      situationId: 1,
      classId: 1,
    });
    expect(createdLesson?.id).toBe(1);

    // Step 7: Generate assessment with situation linked
    vi.mocked(db.getCurriculumForTopic).mockResolvedValue([{
      id: 1,
      title: "وثيقة المنهاج",
      content: "الثورة الجزائرية...",
      sourceReference: "المنهاج الرسمي",
    }] as any);
    vi.mocked(db.createAIResource).mockResolvedValue({ id: 1 } as any);

    const assessment = await caller.ai.generateAssessment({
      title: "اختبار الفصل الأول",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "exam",
      topic: "الثورة الجزائرية",
      situationIds: [1],
      useNationalRules: true,
    });
    expect(assessment).toBeTruthy();
    // Check that the 13+7 rule was applied for 4AM
    if (assessment && "pointDistribution" in assessment) {
      const dist = assessment.pointDistribution as any[];
      const history = dist.find(d => d.label?.includes("التاريخ"));
      const geo = dist.find(d => d.label?.includes("الجغرافيا"));
      if (history && geo) {
        expect(history.points).toBe(13);
        expect(geo.points).toBe(7);
      }
    }
  });

  it("should create results and analyze", async () => {
    const caller = appRouter.createCaller(mockContext as any);

    // Create results
    vi.mocked(db.createAssessmentResult).mockResolvedValue({ id: 1 } as any);
    const result = await caller.results.create({
      classId: 1,
      title: "نتائج اختبار الفصل الأول",
      totalStudents: 30,
      participatedStudents: 28,
      averageScore: 12.5,
      historyAverage: 7.5,
      geographyAverage: 5.0,
      domainScores: {
        "الموارد": 8.5,
        "المنهجية": 3.2,
        "التحليل": 2.8,
      },
    });
    expect(result?.id).toBe(1);

    // Analyze
    vi.mocked(db.getAssessmentResults).mockResolvedValue([{
      id: 1,
      classId: 1,
      title: "نتائج اختبار الفصل الأول",
      totalStudents: 30,
      participatedStudents: 28,
      averageScore: 12.5,
      historyAverage: 7.5,
      geographyAverage: 5.0,
      domainScores: {
        "الموارد": 8.5,
        "المنهجية": 3.2,
        "التحليل": 2.8,
      },
    }] as any);

    const analysis = await caller.results.analyze({ classId: 1 });
    expect(analysis).toBeTruthy();

    // Weak domains must carry readable labels with averages, not raw numbers
    vi.mocked(db.getAssessmentResults).mockResolvedValue([
      {
        id: 2,
        classId: 1,
        title: "نتائج اختبار الفصل الثاني",
        totalStudents: 30,
        participatedStudents: 28,
        averageScore: 11,
        historyAverage: 12,
        geographyAverage: 12,
        weakAreas: "الوضعية الثانية نوع تحليل",
        domainScores: {
          "2": 5.0,
          "4": 6.5,
          "الموارد": 14,
        },
      },
      {
        id: 1,
        classId: 1,
        title: "نتائج اختبار الفصل الأول",
        totalStudents: 30,
        participatedStudents: 28,
        averageScore: 12.5,
        historyAverage: 7.5,
        geographyAverage: 5.0,
        weakAreas: "",
        domainScores: {
          "2": 7.0,
          "المنهجية": 3.2,
        },
      },
    ] as any);

    const analysis2 = await caller.results.analyze({ classId: 1 });
    // Numeric key "2" → readable label with aggregated average (5+7)/2 = 6
    expect(analysis2.weakDomains).toContain("المحور 2");
    const axis2 = analysis2.weakDomainDetails.find(d => d.label === "المحور 2");
    expect(axis2?.avg).toBeCloseTo(6, 1);
    // Textual weak areas flow into remediation suggestions
    expect(analysis2.suggestions.some(s => s.includes("الوضعية الثانية نوع تحليل"))).toBe(true);
    expect(analysis2.suggestions.some(s => s.includes("بناءً على ملاحظاتك"))).toBe(true);
    // "الموارد" 14 > 10 must not appear in weak domains
    expect(analysis2.weakDomains).not.toContain("الموارد");
  });
});
