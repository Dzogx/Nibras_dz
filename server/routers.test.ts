import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getTeacherProfile: vi.fn(),
  createTeacherProfile: vi.fn(),
  updateTeacherProfile: vi.fn(),
  getAcademicYears: vi.fn(),
  getCurriculumDocuments: vi.fn(),
  getCurriculumDocumentById: vi.fn(),
  createCurriculumDocument: vi.fn(),
  getClasses: vi.fn(),
  getClassById: vi.fn(),
  createClass: vi.fn(),
  updateClass: vi.fn(),
  deleteClass: vi.fn(),
  getAnnualPlans: vi.fn(),
  getAnnualPlanById: vi.fn(),
  createAnnualPlan: vi.fn(),
  getLessons: vi.fn(),
  getLessonById: vi.fn(),
  createLesson: vi.fn(),
  toggleLessonCompleted: vi.fn(),
  getAIResources: vi.fn(),
  getAIResourceById: vi.fn(),
  createAIResource: vi.fn(),
  duplicateAIResource: vi.fn(),
  getInspectorReviews: vi.fn(),
  createInspectorReview: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getCurriculumForTopic: vi.fn(),
  getTeachingNotes: vi.fn(),
  updateCurriculumDocument: vi.fn(),
  getAnnualPlanSections: vi.fn(),
  getLearningSituations: vi.fn(),
  getLearningSituationsByUserId: vi.fn(),
  deleteCurriculumDocument: vi.fn(),
  updateLesson: vi.fn(),
  deleteLesson: vi.fn(),
  updateAIResource: vi.fn(),
  deleteAIResource: vi.fn(),
  updateTeachingNote: vi.fn(),
  deleteTeachingNote: vi.fn(),
  getInspectorReviewById: vi.fn(),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
// invokeLLM is mocked at the top of this file
import { invokeLLM } from "./_core/llm";
import {
  getAssessmentRule,
  getExamStructure,
  getBloomDistribution,
  buildAssessmentContext,
  getExamHeader,
  getAllRules,
  COMPETENCY_CATEGORIES,
} from "./rules/nationalRules";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(userOverrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test Teacher",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...userOverrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function resetMocks() {
  vi.clearAllMocks();
}

describe("profile", () => {
  beforeEach(resetMocks);

  it("get returns teacher profile", async () => {
    const profile = { id: 1, userId: 1, displayName: "Test Teacher", subject: "التاريخ والجغرافيا", academicYear: "2025-2026" };
    (db.getTeacherProfile as any).mockResolvedValue(profile);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.profile.get();
    expect(db.getTeacherProfile).toHaveBeenCalledWith(1);
    expect(result).toEqual(profile);
  });

  it("create creates a new profile if none exists", async () => {
    (db.getTeacherProfile as any).mockResolvedValueOnce(undefined).mockResolvedValue({ id: 1, userId: 1, displayName: "New Teacher" });
    (db.createTeacherProfile as any).mockResolvedValue({ id: 1 });

    const caller = appRouter.createCaller(createMockContext());
    await caller.profile.create({ displayName: "New Teacher", subject: "التاريخ والجغرافيا" });
    expect(db.createTeacherProfile).toHaveBeenCalled();
  });
});

describe("academicYears", () => {
  beforeEach(resetMocks);

  it("list returns academic years", async () => {
    (db.getAcademicYears as any).mockResolvedValue([
      { id: 1, year: "2025-2026" },
      { id: 2, year: "2024-2025" },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.academicYears.list();
    expect(result).toHaveLength(2);
  });
});

describe("curriculum", () => {
  beforeEach(resetMocks);

  it("list returns curriculum documents", async () => {
    (db.getCurriculumDocuments as any).mockResolvedValue([
      { id: 1, title: "الوحدة الأولى", type: "unit", subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط" },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.curriculum.list({});
    expect(result).toHaveLength(1);
  });

  it("create adds a curriculum document", async () => {
    (db.createCurriculumDocument as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createMockContext());
    await caller.curriculum.create({
      title: "درس جديد",
      type: "lesson",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الأولى متوسط",
      content: "محتوى الدرس",
    });
    expect(db.createCurriculumDocument).toHaveBeenCalled();
  });
});

describe("classes", () => {
  beforeEach(resetMocks);

  it("list returns user classes", async () => {
    (db.getClasses as any).mockResolvedValue([
      { id: 1, name: "1 متوسط 1", gradeLevel: "السنة الأولى متوسط", userId: 1 },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.classes.list();
    expect(result).toHaveLength(1);
    expect(db.getClasses).toHaveBeenCalledWith(1);
  });

  it("create adds a new class", async () => {
    (db.createClass as any).mockResolvedValue({ id: 1 });
    const caller = appRouter.createCaller(createMockContext());
    await caller.classes.create({
      name: "2 متوسط 3",
      gradeLevel: "السنة الثانية متوسط",
      subject: "التاريخ والجغرافيا",
    });
    expect(db.createClass).toHaveBeenCalled();
  });

  it("delete removes a class", async () => {
    (db.deleteClass as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createMockContext());
    await caller.classes.delete({ id: 1 });
    expect(db.deleteClass).toHaveBeenCalledWith(1);
  });
});

describe("annualPlans", () => {
  beforeEach(resetMocks);

  it("list returns annual plans", async () => {
    (db.getAnnualPlans as any).mockResolvedValue([
      { id: 1, title: "الخطة السنوية", userId: 1 },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.annualPlans.list();
    expect(result).toHaveLength(1);
  });
});

describe("lessons", () => {
  beforeEach(resetMocks);

  it("list returns lessons", async () => {
    (db.getLessons as any).mockResolvedValue([
      { id: 1, title: "درس أول", userId: 1, isCompleted: false },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.lessons.list();
    expect(result).toHaveLength(1);
  });

  it("toggleCompleted toggles lesson status", async () => {
    (db.toggleLessonCompleted as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createMockContext());
    await caller.lessons.toggleCompleted({ id: 1, isCompleted: true });
    expect(db.toggleLessonCompleted).toHaveBeenCalledWith(1, true);
  });
});

describe("aiResources", () => {
  beforeEach(resetMocks);

  it("list returns AI resources", async () => {
    (db.getAIResources as any).mockResolvedValue([
      { id: 1, title: "خطة درس", type: "lessonPlan", userId: 1 },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.list();
    expect(result).toHaveLength(1);
  });

  it("duplicate creates a copy", async () => {
    (db.duplicateAIResource as any).mockResolvedValue({ id: 2 });
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.duplicate({ id: 1 });
    expect(db.duplicateAIResource).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ id: 2 });
  });
});

describe("inspector", () => {
  beforeEach(resetMocks);

  it("reviews returns list of reviews", async () => {
    (db.getInspectorReviews as any).mockResolvedValue([
      { id: 1, evaluation: "تقييم جيد", userId: 1 },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.inspector.reviews();
    expect(result).toHaveLength(1);
  });
});

describe("ai searchCurriculum", () => {
  beforeEach(resetMocks);

  it("searchCurriculum returns matching documents", async () => {
    (db.getCurriculumDocuments as any).mockResolvedValue([
      { id: 1, title: "الوحدة الأولى", content: "محتوى يتعلق بالبحث" },
    ]);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.searchCurriculum({ query: "بحث" });
    expect(db.getCurriculumDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ search: "بحث" })
    );
    expect(result).toHaveLength(1);
  });
});
// ─── National Rules Engine Tests ───────────────────────────────
describe("nationalRules", () => {
  it("getAssessmentRule returns correct rule for year 1 history+geography", () => {
    const rule = getAssessmentRule("السنة الأولى متوسط", "التاريخ والجغرافيا");
    expect(rule).toBeDefined();
    expect(rule!.totalPoints).toBe(20);
    expect(rule!.weights).toHaveLength(2);
    expect(rule!.weights[0].points).toBe(10);
    expect(rule!.weights[1].points).toBe(10);
    expect(rule!.duration).toBe("ساعة ونصف");
    expect(rule!.examType).toBe("combined");
  });

  it("getAssessmentRule returns correct rule for year 4 (BEM)", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التاريخ والجغرافيا");
    expect(rule).toBeDefined();
    expect(rule!.weights[0].points).toBe(13);
    expect(rule!.weights[1].points).toBe(7);
  });

  it("getAssessmentRule returns civic education rule (any level)", () => {
    const rule = getAssessmentRule("السنة الثالثة متوسط", "التربية المدنية");
    expect(rule).toBeDefined();
    expect(rule!.weights[0].points).toBe(20);
    expect(rule!.duration).toBe("ساعة واحدة");
    expect(rule!.examType).toBe("independent");
  });

  it("getExamStructure returns correct structure", () => {
    const structure = getExamStructure("السنة الأولى متوسط", "التاريخ والجغرافيا");
    expect(structure).toBeDefined();
    expect(structure!.part1.subject).toBe("التاريخ");
    expect(structure!.part1.points).toBe(10);
    expect(structure!.part2.subject).toBe("الجغرافيا");
    expect(structure!.part2.points).toBe(10);
    expect(structure!.totalPoints).toBe(20);
    expect(structure!.duration).toBe("ساعة ونصف");
  });

  it("getBloomDistribution distributes questions across bloom levels", () => {
    const dist = getBloomDistribution(8);
    expect(dist.length).toBeGreaterThan(0);
    const total = dist.reduce((sum: number, d: { count: number }) => sum + d.count, 0);
    expect(total).toBe(8);
  });

  it("buildAssessmentContext generates proper context string", () => {
    const context = buildAssessmentContext({
      gradeLevel: "السنة الأولى متوسط",
      subject: "التاريخ والجغرافيا",
      completedLessons: [
        { title: "الثورة الجزائرية", unitTitle: "الوحدة الأولى", lessonNumber: 1, objectives: "فهم أسباب الثورة" },
      ],
      autoImport: true,
    });
    expect(context).toContain("قواعد التقويم الوطنية");
    expect(context).toContain("التاريخ: 10 نقطة");
    expect(context).toContain("الجغرافيا: 10 نقطة");
    expect(context).toContain("الثورة الجزائرية");
    expect(context).toContain("عدد الدروس المنجزة: 1");
  });

  it("getExamHeader generates proper header", () => {
    const header = getExamHeader("السنة الرابعة متوسط", "التاريخ والجغرافيا");
    expect(header).toContain("الجمهورية الجزائرية الديمقراطية الشعبية");
    expect(header).toContain("السنة الرابعة متوسط");
    expect(header).toContain("13 نقطة");
    expect(header).toContain("7 نقطة");
  });
});

// ─── Teacher OS Integration Tests ──────────────────────────────
describe("ai.getTeacherOSContext", () => {
  beforeEach(resetMocks);

  it("returns completed lessons from Teacher OS", async () => {
    // Mock returns only completed lessons (the db helper already filters by isCompleted)
    const mockLessons = [
      { id: 1, title: "درس أول", isCompleted: true, unitTitle: "وحدة 1", lessonNumber: 1, objectives: "هدف 1", date: new Date() },
      { id: 2, title: "درس ثاني", isCompleted: true, unitTitle: "وحدة 1", lessonNumber: 2, objectives: "هدف 2", date: new Date() },
    ];
    (db.getLessons as any).mockResolvedValue(mockLessons);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getTeacherOSContext({
      classId: 1,
      gradeLevel: "السنة الأولى متوسط",
      subject: "التاريخ والجغرافيا",
    });

    expect(result.completedLessons).toHaveLength(2);
    expect(result.totalCompleted).toBe(2);
    expect(db.getLessons).toHaveBeenCalledWith(1, { classId: 1, isCompleted: true });
  });

  it("returns empty when no completed lessons", async () => {
    (db.getLessons as any).mockResolvedValue([]);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getTeacherOSContext({});

    expect(result.completedLessons).toHaveLength(0);
    expect(result.totalCompleted).toBe(0);
  });

  it("maps an annual plan to the class via classId and reports section progress", async () => {
    // The annual plans are linked to classes through classId; without this link
    // getTeacherOSContext returns empty progress (the bug reported Aug 12).
    (db.getLessons as any).mockResolvedValue([]);
    (db.getAnnualPlans as any).mockResolvedValue([
      { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2022/2023" },
    ]);
    (db.getAnnualPlanSections as any).mockResolvedValue([
      { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: false },
      { id: 2, sectionNumber: 2, title: "التاريخ الوطني", isCompleted: true },
    ]);
    (db.getLearningSituations as any)
      .mockResolvedValueOnce([
        { id: 101, situationNumber: 1, title: "وضعية 1", isCompleted: true },
        { id: 102, situationNumber: 2, title: "وضعية 2", isCompleted: false },
      ])
      .mockResolvedValueOnce([
        { id: 201, situationNumber: 1, title: "وضعية 3", isCompleted: true },
      ]);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getTeacherOSContext({ classId: 1 });

    // getAnnualPlans is invoked twice inside getTeacherOSContext (progress + completed list)
    expect(db.getAnnualPlans).toHaveBeenCalledTimes(2);
    expect(db.getAnnualPlans).toHaveBeenCalledWith(1);
    expect(result.currentSection).toBeTruthy();
    expect(result.currentSection.title).toBe("الوثائق التاريخية");
    expect(result.nextSituation.title).toBe("وضعية 2");
    expect(result.sectionProgress).toEqual({ completed: 2, total: 2 });
  });
});

// ─── generateAssessment with Curriculum RAG Tests ──────────────
describe("ai.generateAssessment with curriculum citations", () => {
  beforeEach(resetMocks);

  const mockCurriculumDocs = [
    {
      id: 1,
      title: "وثيقة المنهاج - الوحدة الأولى",
      content: "محتوى يتعلق بالثورة الجزائرية وأسبابها",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      type: "document",
      sourceReference: "البرنامج الرسمي",
      unitNumber: 1,
      lessonNumber: 2,
    },
  ];

  beforeEach(() => {
    (db.getCurriculumForTopic as any).mockResolvedValue(mockCurriculumDocs);
    (db.createAIResource as any).mockResolvedValue({ id: 1 });
    (db.getLessons as any).mockResolvedValue([]);
    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: "سؤال 1 [مرجع: 1 — وثيقة المنهاج - الوحدة الأولى — الوحدة 1 — الدرس 2]" } }],
    });
  });

  it("retrieves curriculum documents and passes them to the LLM prompt", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await caller.ai.generateAssessment({
      title: "اختبار",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "quiz",
      topic: "الثورة الجزائرية",
    });

    // Verify getCurriculumForTopic was called
    expect(db.getCurriculumForTopic).toHaveBeenCalledWith(
      "الثورة الجزائرية",
      "السنة الرابعة متوسط",
      "التاريخ والجغرافيا",
    );

    // Verify LLM was called with curriculum context in the prompt
    expect(invokeLLM).toHaveBeenCalled();
    const prompt = (invokeLLM as any).mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("وثيقة المنهاج - الوحدة الأولى");
    expect(prompt).toContain("الاستشهاد");
  });

  it("returns curriculumCitations in the response", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.generateAssessment({
      title: "اختبار",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "quiz",
      topic: "الثورة الجزائرية",
    });

    expect(result.curriculumCitations).toHaveLength(1);
    expect(result.curriculumCitations[0].docId).toBe(1);
    expect(result.curriculumCitations[0].title).toBe("وثيقة المنهاج - الوحدة الأولى");
    expect(result.curriculumCitations[0].referenceNumber).toBe(1);
  });

  it("handles empty curriculum results gracefully", async () => {
    (db.getCurriculumForTopic as any).mockResolvedValue([]);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.generateAssessment({
      title: "اختبار",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "quiz",
      topic: "موضوع غير موجود",
    });

    expect(result.curriculumCitations).toHaveLength(0);
    expect(result.curriculumDocsCount).toBe(0);

    const prompt = (invokeLLM as any).mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("لا توجد وثائق منهاج مطابقة");
  });
});

// ─── Teaching Templates Tests ───────────────────────────────────
describe("ai.generateLesson with teaching template", () => {
  beforeEach(() => {
    resetMocks();
    (db.getCurriculumForTopic as any).mockResolvedValue([]);
    (db.getLessonById as any).mockResolvedValue({ id: 81, tags: ["وضعية تعلمية"] });
    (db.updateLesson as any).mockResolvedValue({ id: 81 });
    (db.createAIResource as any).mockResolvedValue({ id: 501 });
    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: "مذكرة مبنية وفق الوضعية التعليمية." } }],
    });
  });

  it("passes the selected template to the lesson prompt and preserves it on the lesson and resource", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.generateLesson({
      lessonId: 81,
      classId: 7,
      title: "التعرف على موقع الجزائر وأهميته",
      subject: "الجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      duration: "ساعة واحدة",
      contentType: "lessonPlan",
      teachingTemplateKey: "problem_solving",
    });

    const prompt = (invokeLLM as any).mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("الوضعية-المشكلة وحل المشكلة");
    expect(prompt).toContain("صياغة الفرضيات");
    expect(prompt).toContain("لا تغيّرها ولا تخترع مضامين منهاجية");
    expect(db.updateLesson).toHaveBeenCalledWith(81, {
      tags: ["وضعية تعلمية", "قالب تدريس: الوضعية-المشكلة وحل المشكلة"],
    });
    expect(db.createAIResource).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        teachingTemplate: expect.objectContaining({ key: "problem_solving" }),
      }),
      tags: expect.arrayContaining(["قالب تدريس: الوضعية-المشكلة وحل المشكلة"]),
    }));
    expect(result.teachingTemplate?.key).toBe("problem_solving");
  });

  it("returns a controlled Arabic error instead of crashing when the AI response has no choices", async () => {
    (invokeLLM as any).mockResolvedValue({
      error: { message: "المزود لم يُرجع استجابة صالحة" },
    });

    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.ai.generateLesson({
      lessonId: 81,
      classId: 7,
      title: "التعرف على موقع الجزائر وأهميته",
      subject: "الجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      duration: "ساعة واحدة",
      contentType: "lessonPlan",
      teachingTemplateKey: "guided_inquiry",
    })).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: expect.stringContaining("لم تُرجع محتوى صالحاً"),
    });

    expect(db.createAIResource).not.toHaveBeenCalled();
    expect(db.updateLesson).not.toHaveBeenCalled();
  });
});

// ─── getCompetencyCategories Tests ─────────────────────────────
describe("ai.getCompetencyCategories", () => {
  it("returns competency categories", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getCompetencyCategories();
    expect(result).toHaveLength(COMPETENCY_CATEGORIES.length);
    expect(result[0].name).toBe("اكتساب المعارف");
  });
});

// ─── getAssessmentRules Tests ──────────────────────────────────
describe("ai.getAssessmentRules", () => {
  it("returns specific rule when gradeLevel and subject provided", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getAssessmentRules({
      gradeLevel: "السنة الأولى متوسط",
      subject: "التاريخ والجغرافيا",
    });
    expect(result).toHaveLength(1);
    expect((result[0] as any).totalPoints).toBe(20);
  });

  it("returns all rules when no filters", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getAssessmentRules({});
    expect(result.length).toBeGreaterThan(0);
  });
});
