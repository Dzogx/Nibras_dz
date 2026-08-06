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
}));

import * as db from "./db";

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
