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
  getWeeklyScheduleEntries: vi.fn(),
  replaceWeeklyScheduleEntries: vi.fn(),
  listScheduleSeasons: vi.fn(),
  getAnnualPlans: vi.fn(),
  getAnnualPlanById: vi.fn(),
  createAnnualPlan: vi.fn(),
  updateAnnualPlan: vi.fn(),
  deleteAnnualPlan: vi.fn(),
  copyReferencePlanToClass: vi.fn(),
  getLessons: vi.fn(),
  getLessonById: vi.fn(),
  createLesson: vi.fn(),
  toggleLessonCompleted: vi.fn(),
  getAIResources: vi.fn(),
  getAIResourceById: vi.fn(),
  getAIResourceBySerial: vi.fn(),
  generateSerialNumber: vi.fn(),
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
  getAnnualPlanSectionById: vi.fn(),
  createAnnualPlanSection: vi.fn(),
  updateAnnualPlanSection: vi.fn(),
  deleteAnnualPlanSection: vi.fn(),
  getLearningSituations: vi.fn(),
  getLearningSituationsByUserId: vi.fn(),
  getPendingOperationalLearningSituationsByUserId: vi.fn(),
  getLearningSituationById: vi.fn(),
  createLearningSituation: vi.fn(),
  updateLearningSituation: vi.fn(),
  deleteLearningSituation: vi.fn(),
  toggleLearningSituationCompleted: vi.fn(),
  createTeachingNote: vi.fn(),
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
  BLOOM_ARABIC_VERBS,
  getAllRules,
  COMPETENCY_CATEGORIES,
  getLessonSessionContext,
  AI_ROLE_PRINCIPLE,
  ACTIVE_LEARNING_STRATEGIES,
  SIMPLE_QUESTION_PATTERNS,
  INTEGRATION_DOCUMENT_TYPES,
  INTEGRATION_RUBRIC_CRITERIA,
  BLOOM_LEVELS,
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

describe("situations ownership", () => {
  beforeEach(resetMocks);

  it("refuses reopening a situation outside the current teacher workspace", async () => {
    (db.getLearningSituationById as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.situations.toggleCompleted({ id: 404, isCompleted: false })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "الوضعية غير موجودة",
    });
    expect(db.toggleLearningSituationCompleted).not.toHaveBeenCalled();
  });

  it("refuses recording a session on a reference situation", async () => {
    (db.getLearningSituationById as any).mockResolvedValue({ id: 404, sectionId: 51, title: "وضعية مرجعية" });
    (db.getAnnualPlanSectionById as any).mockResolvedValue({ id: 51, annualPlanId: 7 });
    (db.getAnnualPlanById as any).mockResolvedValue({ id: 7, userId: 1, isReference: true });
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.situations.completeSession({ situationId: 404, sessionStatus: "completed" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "لا يمكن تعديل مقاطع المخطط المرجعي",
    });
    expect(db.toggleLearningSituationCompleted).not.toHaveBeenCalled();
  });
});

describe("weeklySchedule", () => {
  beforeEach(resetMocks);

  it("lists only the teacher's saved schedule seasons", async () => {
    (db.listScheduleSeasons as any).mockResolvedValue(["2025-2026", "2024-2025"]);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.weeklySchedule.listSeasons()).resolves.toEqual(["2025-2026", "2024-2025"]);
    expect(db.listScheduleSeasons).toHaveBeenCalledWith(1);
  });

  it("copies a previous schedule after keeping only the teacher's existing classes", async () => {
    (db.getClasses as any).mockResolvedValue([{ id: 7 }, { id: 8 }]);
    (db.getWeeklyScheduleEntries as any).mockResolvedValue([
      { classId: 7, dayOfWeek: "الأحد", periodIndex: 1, subject: "التاريخ", startTime: "08:00", endTime: "09:00", room: "12" },
      { classId: 99, dayOfWeek: "الاثنين", periodIndex: 2, subject: "الجغرافيا", startTime: "09:00", endTime: "09:55", room: null },
    ]);
    (db.replaceWeeklyScheduleEntries as any).mockResolvedValue({ count: 1 });
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.weeklySchedule.copyFromSeason({
      fromAcademicYear: "2025-2026",
      toAcademicYear: "2026-2027",
    })).resolves.toEqual({ count: 1 });

    expect(db.replaceWeeklyScheduleEntries).toHaveBeenCalledWith(1, "2026-2027", [{
      classId: 7,
      dayOfWeek: "الأحد",
      periodIndex: 1,
      subject: "التاريخ",
      startTime: "08:00",
      endTime: "09:00",
      room: "12",
    }]);
  });

  it("يحفظ مادة كل حصة ويرفض تكرار المادة نفسها للقسم في الأسبوع", async () => {
    (db.getClasses as any).mockResolvedValue([{ id: 7 }]);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.weeklySchedule.save({
      academicYear: "2026-2027",
      entries: [
        { classId: 7, dayOfWeek: "الأحد", periodIndex: 1, subject: "التاريخ", startTime: "08:00", endTime: "09:00" },
        { classId: 7, dayOfWeek: "الاثنين", periodIndex: 2, subject: "التاريخ", startTime: "09:00", endTime: "09:55" },
      ],
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "لكل قسم حصة أسبوعية واحدة فقط في كل مادة." });
    expect(db.replaceWeeklyScheduleEntries).not.toHaveBeenCalled();
  });

  it("يتحقق من إدراج التاريخ والجغرافيا والتربية المدنية لكل قسم في الموسم", async () => {
    (db.getClasses as any).mockResolvedValue([{ id: 7, academicYear: "2026-2027" }]);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.weeklySchedule.save({
      academicYear: "2026-2027",
      entries: [
        { classId: 7, dayOfWeek: "الأحد", periodIndex: 1, subject: "التاريخ", startTime: "08:00", endTime: "09:00" },
        { classId: 7, dayOfWeek: "الاثنين", periodIndex: 2, subject: "الجغرافيا", startTime: "09:00", endTime: "09:55" },
      ],
    })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "يجب إدراج حصة أسبوعية لكل مادة للقسم، والمادة الناقصة: التربية المدنية.",
    });
    expect(db.replaceWeeklyScheduleEntries).not.toHaveBeenCalled();
  });

  it("refuses copying a schedule into the same season", async () => {
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.weeklySchedule.copyFromSeason({
      fromAcademicYear: "2026-2027",
      toAcademicYear: "2026-2027",
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "لا يمكن النسخ من الموسم نفسه." });
    expect(db.getWeeklyScheduleEntries).not.toHaveBeenCalled();
  });
});

describe("seasonReadiness", () => {
  beforeEach(resetMocks);

  it("يرى القسم جاهزاً عندما تكتمل مواده الثلاث وجدوله ومخططاته الصفية", async () => {
    (db.getClasses as any).mockResolvedValue([{ id: 7, name: "2 متوسط أ", gradeLevel: "السنة الثانية متوسط", academicYear: "2026-2027" }]);
    (db.getAnnualPlans as any).mockResolvedValue([
      { classId: 7, isReference: false, subject: "التاريخ والجغرافيا" },
      { classId: 7, isReference: false, subject: "الجغرافيا" },
      { classId: 7, isReference: false, subject: "التربية المدنية" },
    ]);
    (db.getWeeklyScheduleEntries as any).mockResolvedValue([
      { classId: 7, subject: "التاريخ" },
      { classId: 7, subject: "الجغرافيا" },
      { classId: 7, subject: "التربية المدنية" },
    ]);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.seasonReadiness.get({ academicYear: "2026-2027" })).resolves.toMatchObject({
      totalClasses: 1,
      readyClasses: 1,
      incompleteClasses: 0,
      items: [{ classId: 7, isReady: true, missingScheduleSubjects: [], missingPlanSubjects: [] }],
    });
  });

  it("يبين مواد الجدول والمخططات الناقصة للقسم قبل بداية الموسم", async () => {
    (db.getClasses as any).mockResolvedValue([{ id: 7, name: "2 متوسط أ", academicYear: "2026-2027" }]);
    (db.getAnnualPlans as any).mockResolvedValue([{ classId: 7, isReference: false, subject: "التاريخ والجغرافيا" }]);
    (db.getWeeklyScheduleEntries as any).mockResolvedValue([{ classId: 7, subject: "التاريخ" }]);
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.seasonReadiness.get({ academicYear: "2026-2027" })).resolves.toMatchObject({
      readyClasses: 0,
      incompleteClasses: 1,
      items: [{
        classId: 7,
        isReady: false,
        missingScheduleSubjects: ["الجغرافيا", "التربية المدنية"],
        missingPlanSubjects: ["الجغرافيا", "التربية المدنية"],
      }],
    });
  });
});

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

  it("copies a reference plan only into a class owned by the teacher", async () => {
    (db.getClassById as any).mockResolvedValue({ id: 7, userId: 1, name: "1م1" });
    (db.copyReferencePlanToClass as any).mockResolvedValue({ id: 42, classId: 7, isReference: false });
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.annualPlans.copyReferenceToClass({
      referencePlanId: 12,
      classId: 7,
      academicYear: "2026/2027",
    });

    expect(result).toMatchObject({ id: 42, classId: 7, isReference: false });
    expect(db.copyReferencePlanToClass).toHaveBeenCalledWith(12, 1, 7, "2026/2027");
  });

  it("does not copy a reference plan into another teacher's class", async () => {
    (db.getClassById as any).mockResolvedValue({ id: 8, userId: 99, name: "قسم آخر" });
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.annualPlans.copyReferenceToClass({
      referencePlanId: 12,
      classId: 8,
      academicYear: "2026/2027",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.copyReferencePlanToClass).not.toHaveBeenCalled();
  });

  it("refuses adding a section to a reference plan", async () => {
    (db.getAnnualPlanById as any).mockResolvedValue({ id: 12, userId: 1, isReference: true });
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.sections.create({
      annualPlanId: 12,
      sectionNumber: 4,
      title: "مقطع جديد",
    })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "لا يمكن إضافة مقطع إلى المخطط المرجعي",
    });
    expect(db.createAnnualPlanSection).not.toHaveBeenCalled();
  });

  it("refuses deleting a reference plan section", async () => {
    (db.getAnnualPlanSectionById as any).mockResolvedValue({ id: 51, annualPlanId: 12 });
    (db.getAnnualPlanById as any).mockResolvedValue({ id: 12, userId: 1, isReference: true });
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.sections.delete({ id: 51 })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "لا يمكن تعديل مقاطع المخطط المرجعي",
    });
    expect(db.deleteAnnualPlanSection).not.toHaveBeenCalled();
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

  it("getLessonSessionContext includes the pedagogical chain, 15 session elements and classroom constraints", () => {
    const ctx = getLessonSessionContext();
    expect(ctx).toContain("سلسلة البناء التربوي الملزمة");
    expect(ctx).toContain("←");
    expect(ctx).toContain("يجب أن تحتوي المذكرة على هذه العناصر الخمسة عشر");
    for (let i = 1; i <= 15; i++) expect(ctx).toContain(`${i}. `);
    expect(ctx).toContain("قيود الواقع الصفي");
    expect(ctx).toContain("عارض");
    expect(ctx).toContain("بديل");
    expect(AI_ROLE_PRINCIPLE).toContain("مسودة");
  });
  it("approved active-learning strategies count is 12", () => {
    expect(ACTIVE_LEARNING_STRATEGIES).toHaveLength(12);
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
    const result = await caller.ai.getTeacherOSContext({ classId: 1, academicYear: "2022/2023" });

    // getAnnualPlans is invoked three times inside getTeacherOSContext: section progress,
    // calendar-pace estimate, and the completed-situations list
    expect(db.getAnnualPlans).toHaveBeenCalledTimes(3);
    expect(db.getAnnualPlans).toHaveBeenCalledWith(1, { academicYear: "2022/2023" });
    expect(result.currentSection).toBeTruthy();
    expect(result.currentSection.title).toBe("الوثائق التاريخية");
    expect(result.nextSituation.title).toBe("وضعية 2");
    expect(result.sectionProgress).toEqual({ completed: 2, total: 3 });
    expect(result.currentSectionProgress).toEqual({ completed: 1, total: 2 });
  });

  it("keeps the latest open session status and note in the daily teacher context", async () => {
    (db.getLessons as any).mockResolvedValue([]);
    (db.getAnnualPlans as any).mockResolvedValue([
      { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2026/2027" },
    ]);
    (db.getAnnualPlanSections as any).mockResolvedValue([
      { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: false },
    ]);
    (db.getLearningSituations as any).mockResolvedValue([
      {
        id: 101,
        situationNumber: 1,
        title: "قراءة الوثيقة التاريخية",
        isCompleted: false,
        sessionStatus: "postponed",
        completionNotes: "تأجلت الحصة بسبب نشاط المؤسسة.",
      },
    ]);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getTeacherOSContext({ classId: 1, academicYear: "2026/2027" });

    expect(result.nextSituation).toMatchObject({
      id: 101,
      sessionStatus: "postponed",
      completionNotes: "تأجلت الحصة بسبب نشاط المؤسسة.",
    });
  });

  it("orders completed official situations by completion date for the remediation activity", async () => {
    (db.getLessons as any).mockResolvedValue([]);
    (db.getAnnualPlans as any).mockResolvedValue([
      { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2026/2027" },
    ]);
    (db.getAnnualPlanSections as any).mockResolvedValue([
      { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: true },
    ]);
    (db.getLearningSituations as any).mockResolvedValue([
      { id: 101, situationNumber: 1, title: "العنوان الرسمي الأقدم", isCompleted: true, completedDate: new Date("2026-10-10T10:00:00Z") },
      { id: 102, situationNumber: 2, title: "العنوان الرسمي الأحدث", isCompleted: true, completedDate: new Date("2026-10-17T10:00:00Z") },
    ]);

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.getTeacherOSContext({ classId: 1 });

    expect(result.completedSituations.map((situation) => situation.title)).toEqual([
      "العنوان الرسمي الأحدث",
      "العنوان الرسمي الأقدم",
    ]);
    expect(result.completedSituations[0]).toMatchObject({
      id: 102,
      completedDate: "2026-10-17T10:00:00.000Z",
    });
  });

  it("marks an empty progress as not_started instead of on_track when the calendar expects progress", async () => {
    // Regression: previously, 0% completion while weeks had elapsed since the term start
    // (2026-10-05) was classified as "on_track" — misleading for the teacher.
    const afterTermStart = new Date("2026-12-07T10:00:00Z");
    vi.setSystemTime(afterTermStart);
    try {
      (db.getLessons as any).mockResolvedValue([]);
      (db.getAnnualPlans as any).mockResolvedValue([
        { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2022/2023" },
      ]);
      (db.getAnnualPlanSections as any).mockResolvedValue([
        { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: false },
      ]);
      (db.getLearningSituations as any).mockResolvedValue([
        { id: 101, situationNumber: 1, title: "وضعية 1", isCompleted: false },
        { id: 102, situationNumber: 2, title: "وضعية 2", isCompleted: false },
      ]);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.ai.getTeacherOSContext({ classId: 1 });

      expect(result.annualProgressPercent).toBe(0);
      if (result.schedulePace) {
        // Weeks have elapsed after term start (2026-10-05) → must not claim steady progress
        expect(result.schedulePace.expectedPercent).toBeGreaterThan(0);
        expect(result.schedulePace.status).toBe("not_started");
        expect(result.schedulePace.note).toContain("منجزة");
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("classifies zero progress as on_track only before the term starts", async () => {
    const beforeTermStart = new Date("2026-09-20T10:00:00Z");
    vi.setSystemTime(beforeTermStart);
    try {
      (db.getLessons as any).mockResolvedValue([]);
      (db.getAnnualPlans as any).mockResolvedValue([
        { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2026/2027" },
      ]);
      (db.getAnnualPlanSections as any).mockResolvedValue([
        { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: false },
      ]);
      (db.getLearningSituations as any).mockResolvedValue([
        { id: 101, situationNumber: 1, title: "وضعية 1", isCompleted: false },
      ]);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.ai.getTeacherOSContext({ classId: 1 });

      // Before the term start (2026-10-05), no expected progress → steady (0% == 0%)
      if (result.schedulePace) {
        expect(result.schedulePace.expectedPercent).toBe(0);
        expect(result.schedulePace.status).toBe("on_track");
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("derives the pace calendar from the plan's academic year instead of a fixed season", async () => {
    // Regression: a 2027/2028 plan must not be marked as late in December 2026
    // merely because a previous season's October date was hard-coded.
    vi.setSystemTime(new Date("2026-12-07T10:00:00Z"));
    try {
      (db.getLessons as any).mockResolvedValue([]);
      (db.getAnnualPlans as any).mockResolvedValue([
        { id: 90001, classId: 1, subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", academicYear: "2027/2028" },
      ]);
      (db.getAnnualPlanSections as any).mockResolvedValue([
        { id: 1, sectionNumber: 1, title: "الوثائق التاريخية", isCompleted: false },
      ]);
      (db.getLearningSituations as any).mockResolvedValue([
        { id: 101, situationNumber: 1, title: "وضعية 1", isCompleted: false },
      ]);

      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.ai.getTeacherOSContext({ classId: 1 });

      expect(result.schedulePace).toMatchObject({
        expectedPercent: 0,
        status: "on_track",
      });
    } finally {
      vi.useRealTimers();
    }
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

  it("uses one selected official situation as the canonical assessment title and topic", async () => {
    (db.getLearningSituationsByUserId as any).mockResolvedValue([{
      id: 61,
      userId: 1,
      sectionId: 7,
      title: "الثورة التحريرية الجزائرية: أسبابها ومراحلها",
      objectives: "تمييز أسباب الثورة ومراحلها الأساسية.",
      situationNumber: 2,
    }]);
    (db.getAnnualPlanSectionById as any).mockResolvedValue({
      id: 7,
      title: "التاريخ الوطني",
      competencies: "تحليل التحولات التاريخية الوطنية",
    });

    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.generateAssessment({
      title: "عنوان حر مؤقت",
      topic: "موضوع حر مؤقت",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "exam",
      situationIds: [61],
    });

    const officialTitle = "الثورة التحريرية الجزائرية: أسبابها ومراحلها";
    expect(result.title).toBe(officialTitle);
    expect(result.topic).toBe(officialTitle);
    expect(db.getCurriculumForTopic).toHaveBeenLastCalledWith(
      officialTitle,
      "السنة الرابعة متوسط",
      "التاريخ والجغرافيا",
    );
    expect(invokeLLM).toHaveBeenLastCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([expect.objectContaining({ content: expect.stringContaining(officialTitle) })]),
    }));
    expect(db.createAIResource).toHaveBeenLastCalledWith(expect.objectContaining({
      title: officialTitle,
      metadata: expect.objectContaining({
        situationIds: [61],
        officialSituationTitles: [officialTitle],
        titleSource: "official_situation",
      }),
    }));
  });

  it("returns a controlled Arabic error instead of crashing when the AI response has no choices", async () => {
    (invokeLLM as any).mockResolvedValue({
      error: { message: "المزود لم يُرجع استجابة صالحة" },
    });

    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.ai.generateAssessment({
      title: "اختبار",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "quiz",
      topic: "الثورة الجزائرية",
    })).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: expect.stringContaining("لم تُرجع محتوى صالحاً"),
    });

    expect(db.createAIResource).not.toHaveBeenCalled();
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

// ─── Teacher-edited official situation titles ───────────────────
describe("ai.generateAssessment with teacher-edited situation titles", () => {
  beforeEach(() => {
    resetMocks();
    (db.getCurriculumForTopic as any).mockResolvedValue([]);
    (db.createAIResource as any).mockResolvedValue({ id: 2 });
    (db.getLessons as any).mockResolvedValue([]);
    (db.getLearningSituationsByUserId as any).mockResolvedValue([{
      id: 62,
      userId: 1,
      sectionId: 8,
      title: "الوضعية الرسمية",
      objectives: "هدف رسمي",
      situationNumber: 1,
    }]);
    (db.getAnnualPlanSectionById as any).mockResolvedValue({ id: 8, title: "مقطع رسمي" });
    (invokeLLM as any).mockResolvedValue({
      choices: [{ message: { content: "تقويم محرر." } }],
    });
  });

  it("preserves a teacher-edited assessment title when explicitly requested", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.ai.generateAssessment({
      title: "اختبار تحصيلي من إعداد الأستاذ",
      topic: "صياغة موضوعية يحددها الأستاذ",
      subject: "التاريخ والجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      assessmentType: "quiz",
      situationIds: [62],
      preferOfficialSituationTitle: false,
    });

    expect(result.title).toBe("اختبار تحصيلي من إعداد الأستاذ");
    expect(result.topic).toBe("صياغة موضوعية يحددها الأستاذ");
    expect(db.createAIResource).toHaveBeenLastCalledWith(expect.objectContaining({
      title: "اختبار تحصيلي من إعداد الأستاذ",
      metadata: expect.objectContaining({ titleSource: "teacher_edit" }),
    }));
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

  it("treats an annual plan as an official methodological reference in the lesson prompt", async () => {
    (db.getCurriculumForTopic as any).mockResolvedValue([{
      id: 901,
      title: "المخطط السنوي الرسمي للجغرافيا — السنة الثانية متوسط",
      type: "annualPlan",
      gradeLevel: "السنة الثانية متوسط",
      subject: "الجغرافيا",
      content: "الكفاءة الختامية والوضعيات والتدرج الزمني الرسمي.",
      sourceReference: "المخطط السنوي الرسمي 2022",
    }]);

    const caller = appRouter.createCaller(createMockContext());
    await caller.ai.generateLesson({
      lessonId: 81,
      classId: 7,
      title: "التعرف على مختلف مظاهر السطح",
      subject: "الجغرافيا",
      gradeLevel: "السنة الثانية متوسط",
      duration: "ساعة واحدة",
      contentType: "differentiation",
    });

    const prompt = (invokeLLM as any).mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("المخططات السنوية الرسمية والوثائق المنهجية المرتبطة");
    expect(prompt).toContain("المخطط السنوي الرسمي مرجع منهجي ملزم");
    expect(prompt).not.toContain("لم يتم العثور على وثائق منهاج رسمية مطابقة");
  });

  it("uses the linked official situation title instead of an editable draft title", async () => {
    (db.getLearningSituationsByUserId as any).mockResolvedValue([{
      id: 90061,
      userId: 1,
      sectionId: 70001,
      title: "الموقع الجغرافي للجزائر وأهميته الاستراتيجية",
      objectives: "تحديد الموقع الجغرافي واستنتاج أهميته.",
      situationNumber: 1,
    }]);

    const caller = appRouter.createCaller(createMockContext());
    await caller.ai.generateLesson({
      situationId: 90061,
      title: "عنوان يدوّي قابل للتعديل",
      unitTitle: "عنوان آخر غير معتمد",
      subject: "الجغرافيا",
      gradeLevel: "السنة الرابعة متوسط",
      contentType: "lessonPlan",
    });

    const prompt = (invokeLLM as any).mock.calls[0][0].messages[0].content;
    expect(prompt).toContain("الموقع الجغرافي للجزائر وأهميته الاستراتيجية");
    expect(prompt).not.toContain("عنوان يدوّي قابل للتعديل");
    expect(db.getCurriculumForTopic).toHaveBeenCalledWith(
      expect.stringContaining("الموقع الجغرافي للجزائر وأهميته الاستراتيجية"),
      "السنة الرابعة متوسط",
      "الجغرافيا"
    );
    expect(db.createAIResource).toHaveBeenCalledWith(expect.objectContaining({
      title: "الموقع الجغرافي للجزائر وأهميته الاستراتيجية",
      metadata: expect.objectContaining({
        situationId: 90061,
        officialSituationTitle: "الموقع الجغرافي للجزائر وأهميته الاستراتيجية",
        officialSituationObjectives: "تحديد الموقع الجغرافي واستنتاج أهميته.",
      }),
    }));
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

// ─── Official 2018 Exam Guide Structure Tests (بنية الاختبار من دليل 2018) ───
describe("Official exam question structure (دليل بناء الاختبارات 2018)", () => {
  it("4AM History has official structure: part1 9pts with 3-4 situations, part2 4pts integration", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التاريخ والجغرافيا");
    expect(rule).toBeDefined();
    expect(rule!.totalPoints).toBe(20);
    expect(rule!.weights.find(w => w.subject === "التاريخ")?.points).toBe(13);
    expect(rule!.weights.find(w => w.subject === "الجغرافيا")?.points).toBe(7);

    const bp = rule!.questionBlueprints!.find(b => b.subject === "التاريخ");
    expect(bp).toBeDefined();
    expect(bp!.part1Points + bp!.part2Points).toBe(13);
    expect(bp!.part1MinQuestions).toBeGreaterThanOrEqual(3);
    expect(bp!.part1MaxQuestions).toBeLessThanOrEqual(4);
    expect(bp!.part2IntegrationQuestion).toBe(1);
  });

  it("4AM Geography has official structure: part1 4pts with 2-3 situations, part2 3pts integration", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التاريخ والجغرافيا");
    const bp = rule!.questionBlueprints!.find(b => b.subject === "الجغرافيا");
    expect(bp).toBeDefined();
    expect(bp!.part1Points + bp!.part2Points).toBe(7);
    expect(bp!.part1MinQuestions).toBeGreaterThanOrEqual(2);
    expect(bp!.part1MaxQuestions).toBeLessThanOrEqual(3);
    expect(bp!.part2IntegrationQuestion).toBe(1);
  });

  it("1AM/2AM/3AM combined exams: each subject 10pts with simple + integration parts, and official rubric criteria present", () => {
    for (const level of ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط"]) {
      const rule = getAssessmentRule(level, "التاريخ والجغرافيا");
      expect(rule).toBeDefined();
      expect(rule!.totalPoints).toBe(20);
      expect(rule!.weights).toHaveLength(2);
      expect(rule!.weights.every(w => w.points === 10)).toBe(true);
      expect(rule!.questionBlueprints?.length).toBe(2);
      for (const bp of rule!.questionBlueprints!) {
        expect(bp.part1Points + bp.part2Points).toBe(10);
        expect(bp.part1MinQuestions).toBeGreaterThan(0);
        expect(bp.part1MaxQuestions).toBeGreaterThanOrEqual(bp.part1MinQuestions);
        expect(bp.part2IntegrationQuestion).toBe(1);
      }
      expect(rule!.rubricCriteria).toContain("الإتقان");
      expect(rule!.rubricCriteria).toContain("التمايز");
      expect(rule!.rubricCriteria).toContain("اللغة");
    }
  });

  it("Civic Education independent exam: 20pts, 1 hour, with question blueprint", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التربية المدنية");
    expect(rule).toBeDefined();
    expect(rule!.examType).toBe("independent");
    expect(rule!.totalPoints).toBe(20);
    expect(rule!.duration).toContain("ساعة واحدة");
    expect(rule!.questionBlueprints).toBeDefined();
    const bp = rule!.questionBlueprints![0];
    expect(bp.part1Points + bp.part2Points).toBe(20);
    expect(bp.part2IntegrationQuestion).toBe(1);
  });

  it("Bloom distribution for BEM guarantees higher-order thinking (لا تقتصر على الحفظ)", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التاريخ والجغرافيا");
    const dist = getBloomDistribution(rule!.maxQuestions, rule);
    const total = dist.reduce((s, d) => s + d.count, 0);
    expect(total).toBe(rule!.maxQuestions);
    const hasHigherOrder = dist.some(d => ["analyze", "evaluate", "create"].includes(d.bloomId));
    expect(hasHigherOrder).toBe(true);
  });

  it("buildAssessmentContext includes official 2018 sections (structure, Bloom, rubric, conditions)", () => {
    const ctx = buildAssessmentContext({
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التاريخ والجغرافيا",
      completedLessons: [{ title: "درس تجريبي" }],
      completedSituations: [{ title: "وضعية تجريبية" }],
    });
    expect(ctx).toContain("=== بنية الاختبار الرسمية (دليل بناء الاختبارات 2018) ===");
    expect(ctx).toContain("3 إلى 4 وضعيات بسيطة");
    expect(ctx).toContain("2 إلى 3 وضعيات بسيطة");
    expect(ctx).toContain("وضعية إدماج واحدة");
    expect(ctx).toContain("=== تدرج مستويات التفكير (Bloom) — إلزامي ===");
    expect(ctx).toContain("لا تقتصر الأسئلة على الحفظ والاسترجاع");
    expect(ctx).toContain("=== معايير شبكة التقويم الرسمية (وضعية الإدماج) ===");
    expect(ctx).toContain("الإتقان");
    expect(ctx).toContain("=== شروط صياغة الأسئلة (دليل 2018) ===");
  });
});

  it("Civic Education official structure from 2018 guide: part1 12pts with 2-3 simple situations, part2 8pts composite assessment situation", () => {
    const rule = getAssessmentRule("السنة الرابعة متوسط", "التربية المدنية") ?? getAssessmentRule("any", "التربية المدنية");
    expect(rule).toBeDefined();
    const bp = rule!.questionBlueprints![0];
    expect(bp.part1Points).toBe(12);
    expect(bp.part1MinQuestions).toBe(2);
    expect(bp.part1MaxQuestions).toBe(3);
    expect(bp.part2Points).toBe(8);
    expect(bp.part2IntegrationQuestion).toBe(1);
  });

describe("Bloom Arabic verbs table (جدول تصنيف الأفعال لمادة الاجتماعيات)", () => {
  it("has all six Bloom levels with verbs", () => {
    expect(BLOOM_ARABIC_VERBS.remember.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.understand.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.apply.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.analyze.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.create.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.evaluate.verbs.length).toBeGreaterThan(10);
    expect(BLOOM_ARABIC_VERBS.remember.verbs).toContain("عرّف");
    expect(BLOOM_ARABIC_VERBS.analyze.verbs).toContain("حلّل");
    expect(BLOOM_ARABIC_VERBS.evaluate.verbs).toContain("برّر");
    expect(BLOOM_ARABIC_VERBS.create.verbs).toContain("ابتكر");
  });

  it("buildAssessmentContext injects approved verbs with question counts into the prompt", () => {
    const ctx = buildAssessmentContext({
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التاريخ والجغرافيا",
      completedLessons: [{ title: "درس تجريبي" }],
      completedSituations: [{ title: "وضعية تجريبية" }],
    });
    expect(ctx).toContain("استعمل أفعال هذا المستوى عند الصياغة");
    expect(ctx).toContain("جدول تصنيف الأفعال لمادة الاجتماعيات");
    expect(ctx).toContain("[1 سؤال مطلوب]");
    expect(ctx).toContain("المعرفة (الاستدكار أو تمييز المعلومات)");
    expect(ctx).toContain("التحليل");
  });
});
describe("أنماط الوضعيات البسيطة والسندات الرسمية (من تحليل مكتبة التقويمات)", () => {
  it("أنماط الوضعيات البسيطة موجودة للمواد الثلاث", () => {
    expect(SIMPLE_QUESTION_PATTERNS["التاريخ"]).toHaveLength(4);
    expect(SIMPLE_QUESTION_PATTERNS["الجغرافيا"]).toHaveLength(3);
    expect(SIMPLE_QUESTION_PATTERNS["التربية المدنية"]).toHaveLength(3);
  });

  it("كل نمط له معرّف فريد ووصف ونمط علامة ومستوى بلوم صالح", () => {
    for (const [subject, patterns] of Object.entries(SIMPLE_QUESTION_PATTERNS)) {
      const ids = new Set<string>();
      for (const p of patterns) {
        expect(p.patternId).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.description.length).toBeGreaterThan(10);
        expect(p.scoringPattern).toBeTruthy();
        expect(BLOOM_LEVELS.some(b => b.id === p.bloomLevelId)).toBe(true);
        ids.add(p.patternId);
      }
      expect(ids.size).toBe(patterns.length); // لا تكرار في المعرّفات
    }
  });

  it("أنماط التاريخ تبدأ بالأسهل (معرفة) وتنتهي بالأصعب (تحليل)", () => {
    const history = SIMPLE_QUESTION_PATTERNS["التاريخ"];
    expect(history[0].bloomLevelId).toBe("remember");
    expect(history[history.length - 1].bloomLevelId).toBe("analyze");
  });

  it("أنواع سندات الإدماج محددة للمواد الثلاث", () => {
    for (const subject of ["التاريخ", "الجغرافيا", "التربية المدنية"]) {
      expect(INTEGRATION_DOCUMENT_TYPES[subject].length).toBeGreaterThanOrEqual(2);
    }
    expect(INTEGRATION_DOCUMENT_TYPES["التربية المدنية"].some(s => s.includes("دستور"))).toBe(true);
  });

  it("شبكة تقييم وضعية الإدماج الرسمية تحتوي المعايير الأربعة", () => {
    for (const subject of ["التاريخ", "الجغرافيا", "التربية المدنية"]) {
      const crits = INTEGRATION_RUBRIC_CRITERIA[subject];
      expect(crits).toHaveLength(4);
      const names = crits.map(c => c.name);
      expect(names.some(n => n.includes("الملاءمة"))).toBe(true);
      expect(names.some(n => n.includes("أدوات المادة"))).toBe(true);
      expect(names.some(n => n.includes("المنهجية") || n.includes("الاتساق"))).toBe(true);
      expect(names.some(n => n.includes("الإتقان"))).toBe(true);
    }
  });

  it("قواعد السندات تُدرج لكل مادة فرعية داخل المادة المركبة (التاريخ والجغرافيا)", () => {
    const ctx = buildAssessmentContext({
      gradeLevel: "السنة الأولى متوسط",
      subject: "التاريخ والجغرافيا",
      completedLessons: [{ title: "درس تجريبي" }],
    });
    // صيغ السندات يجب أن تظهر للمادتين الفرعيتين
    expect(ctx).toContain("وثيقة تاريخية مكتوبة");
    expect(ctx).toContain("جدول إحصائي");
    expect(ctx).toContain("خريطة أو صورة جوية");
    // قاعدة العدد للمستويات 1–3AM: سند واحد كحد أقصى
    expect(ctx).toContain("سند واحد كحد أقصى");
    expect(ctx).not.toContain("2–3 سندات");
  });
  it("وضعية الإدماج في 4AM تحمل تعليمة وسندات وعدد سندات 2–3", () => {
    const ctx = buildAssessmentContext({
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التاريخ والجغرافيا",
      completedLessons: [{ title: "درس تجريبي" }],
    });
    expect(ctx).toContain("وضعية إدماج واحدة لمعالجة إشكالية مركبة في سياقها");
    expect(ctx).toContain("تواريخ وأحداث معلمية");
    expect(ctx).toContain("2–3 سندات");
  });
  it("الأنماط والسندات تُدرج في سياق التوليد", () => {
    const ctx = buildAssessmentContext({
      gradeLevel: "السنة الرابعة متوسط",
      subject: "التربية المدنية",
      completedLessons: [{ title: "درس تجريبي" }],
      completedSituations: [{ title: "وضعية تجريبية" }],
    });
    expect(ctx).toContain("أنماط الوضعيات البسيطة الرسمية");
    expect(ctx).toContain("سندات من هذه الأنواع");
    expect(ctx).toContain("الملاءمة مع الوضعية");
    expect(ctx).toContain("الإتقان والتمييز");
  });
});

describe("profile auto-create on first sign-in", () => {
  beforeEach(resetMocks);
  it("profile.get creates a profile automatically when none exists", async () => {
    (db.getTeacherProfile as any).mockResolvedValueOnce(undefined).mockResolvedValue({ id: 7, userId: 1, displayName: "Test Teacher", subject: "التاريخ والجغرافيا والتربية المدنية" });
    (db.createTeacherProfile as any).mockResolvedValue({ id: 7 });
    const caller = appRouter.createCaller(createMockContext({ name: "Test Teacher" }));
    const profile = await caller.profile.get();
    expect(db.getTeacherProfile).toHaveBeenCalledWith(1);
    expect(db.createTeacherProfile).toHaveBeenCalled();
    expect(profile).toBeTruthy();
    expect(profile.userId).toBe(1);
    expect(profile.displayName).toBe("Test Teacher");
    expect(profile.subject).toBeTruthy();
  });
});

// ─── QR & Serial Tests (هوية بصرية وتحقق عام) ────────────────
describe("aiResources.getBySerial / getAnswer", () => {
  beforeEach(resetMocks);

  const baseResource = {
    id: 10,
    serialNumber: "NIBRAS-2026-00010",
    title: "امتحان فصلي — التاريخ والجغرافيا",
    type: "exam",
    content: "النموذج الإجاباتي السري",
    examEndsAt: null,
    createdAt: new Date("2026-08-01T10:00:00Z"),
  };

  it("getBySerial returns found=true with metadata", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue(baseResource);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getBySerial({ serialNumber: "NIBRAS-2026-00010" });
    expect(result.found).toBe(true);
    expect(result.title).toBe(baseResource.title);
  });

  it("getBySerial returns found=false for unknown serial", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getBySerial({ serialNumber: "NIBRAS-2026-99999" });
    expect(result.found).toBe(false);
  });

  it("getBySerial reports answerVisible when exam ends are past", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue({ ...baseResource, examEndsAt: Date.now() - 3600_000 });
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getBySerial({ serialNumber: baseResource.serialNumber });
    expect(result.answerVisible).toBe(true);
    expect(result.answerRevealAt).toBeGreaterThan(0);
  });

  it("getAnswer returns locked before exam ends", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue({ ...baseResource, examEndsAt: Date.now() + 3600_000 });
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getAnswer({ serialNumber: baseResource.serialNumber });
    expect(result.status).toBe("locked");
  });

  it("getAnswer returns revealed with content after exam ends", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue({ ...baseResource, examEndsAt: Date.now() - 3600_000 });
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getAnswer({ serialNumber: baseResource.serialNumber });
    expect(result.status).toBe("revealed");
    expect((result as any).content).toBe(baseResource.content);
  });

  it("getAnswer returns locked when no exam end time is set", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue({ ...baseResource, examEndsAt: null });
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getAnswer({ serialNumber: baseResource.serialNumber });
    expect(result.status).toBe("locked");
    expect(result.revealAt).toBeNull();
  });

  it("getAnswer returns not_found for unknown serial", async () => {
    (db.getAIResourceBySerial as any).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.aiResources.getAnswer({ serialNumber: "NIBRAS-2026-99999" });
    expect(result.status).toBe("not_found");
  });
});

describe("generateSerialNumber", () => {
  it("builds NIBRAS-YYYY-XXXXX format", async () => {
    const original = db.generateSerialNumber;
    (db.generateSerialNumber as any) = await vi.importActual("./db").then(m => (m as any).generateSerialNumber);
    try {
      expect((db.generateSerialNumber as any)(7, 2026)).toBe("NIBRAS-2026-00007");
      expect((db.generateSerialNumber as any)(123456, 2027)).toBe("NIBRAS-2027-123456");
    } finally {
      db.generateSerialNumber = original;
    }
  });
});
