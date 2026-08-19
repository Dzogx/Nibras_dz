import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mockDb = vi.hoisted(() => ({
  getClasses: vi.fn(),
  parseRakmnaExcelWorkbook: vi.fn(),
  saveStudentGradesRows: vi.fn(),
  deleteStudentGradesForClass: vi.fn(),
  getStudentGradesByClass: vi.fn(),
  getStudentGradesFilters: vi.fn(),
  getStudentGradesAnalytics: vi.fn(),
  upsertGradebookEntry: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./db")>();
  return { ...mod, ...mockDb };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(id = 1): AuthenticatedUser {
  return {
    id,
    openId: `user-${id}`,
    email: "teacher@example.com",
    name: "Teacher",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createCaller(userId = 1): TrpcContext & { caller: ReturnType<typeof appRouter.createCaller> } {
  const ctx: TrpcContext = {
    user: makeUser(userId),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
  return { ...ctx, caller: appRouter.createCaller(ctx) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.getClasses.mockImplementation(async (userId: number) =>
    userId === 1
      ? [{ id: 7, name: "1م1", gradeLevel: "السنة الأولى متوسط", academicYear: "2025-2026", userId: 1 }]
      : [],
  );
  mockDb.parseRakmnaExcelWorkbook.mockImplementation(async () => ({
    sheets: [
      {
        sheetName: "2200001",
        fogCode: "2200001",
        term: 3,
        academicYear: "2025-2026",
        fogLabel: "أولى متوسط    1",
        gradeLevel: "السنة الأولى متوسط",
        fogName: "1",
        subject: "التاريخ",
        rowErrors: [],
        students: [
          {
            matricule: "1234567890",
            fullName: "عبيدلي الهاشمي",
            birthDate: "2013-01-01",
            activityScore: 16,
            examQuizScore: 14,
            finalExamScore: 15,
          },
        ],
      },
    ],
    issues: [],
  }));
  mockDb.saveStudentGradesRows.mockImplementation(async () => undefined);
  mockDb.deleteStudentGradesForClass.mockImplementation(async () => undefined);
  mockDb.upsertGradebookEntry.mockImplementation(async () => undefined);
  mockDb.getStudentGradesByClass.mockImplementation(async () => []);
  mockDb.getStudentGradesFilters.mockImplementation(async () => []);
  mockDb.getStudentGradesAnalytics.mockImplementation(async () => null);
});

describe("studentResults router", () => {
  it("parseExcel يعود بمجموعة الورقات ويستخرج النقاط", async () => {
    const { caller } = createCaller();
    const result = await caller.studentResults.parseExcel({ fileContent: "UEsDBBQAAAAAAB" + "A".repeat(100) });
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].subject).toBe("التاريخ");
    expect(result.sheets[0].term).toBe(3);
    expect(result.sheets[0].students[0].fullName).toContain("عبيدلي");
    expect(result.sheets[0].students[0].activityScore).toBe(16);
    expect(result.sheets[0].students[0].examQuizScore).toBe(14);
    expect(result.sheets[0].students[0].finalExamScore).toBe(15);
    expect(mockDb.parseRakmnaExcelWorkbook).toHaveBeenCalledTimes(1);
  });

  it("parseExcel يرفض محتوى فارغ أو قصير", async () => {
    const { caller } = createCaller();
    await expect(caller.studentResults.parseExcel({ fileContent: "" })).rejects.toThrow();
    await expect(caller.studentResults.parseExcel({ fileContent: "x".repeat(90) })).rejects.toThrow();
  });

  it("parseExcel يحوّل أخطاء القراءة إلى BAD_REQUEST", async () => {
    const { caller } = createCaller();
    mockDb.parseRakmnaExcelWorkbook.mockRejectedValueOnce(new Error("corrupt file"));
    await expect(caller.studentResults.parseExcel({ fileContent: "x".repeat(150) })).rejects.toThrow();
  });

  it("saveImport يحفظ ويمنع الأقسام غير التابعة للأستاذ", async () => {
    const { caller } = createCaller();
    const mapping = {
      sheetFogCode: "2200001",
      classId: 7,
      subject: "التاريخ",
      term: 3,
      overrideExisting: false,
      students: [
        {
          matricule: "1234567890",
          fullName: "عبيدلي الهاشمي",
          activityScore: 16,
          examQuizScore: 14,
          finalExamScore: 15,
        },
      ],
    };
    const result = await caller.studentResults.saveImport({ mappings: [mapping] });
    expect(result.saved).toContain("2200001");
    expect(mockDb.saveStudentGradesRows).toHaveBeenCalledTimes(1);
    // نقاط الرقمنة تُصب أيضًا مباشرة في دفتر التنقيط (مصدر rakmna)
    expect(mockDb.upsertGradebookEntry).toHaveBeenCalledTimes(1);
    expect((mockDb.upsertGradebookEntry.mock.calls[0][1] as any).source).toBe("rakmna");
    const gradedRows = mockDb.saveStudentGradesRows.mock.calls[0][0] as any[];
    // المعادلة الرسمية: (نشاط + فرض + اختبار×3) / 5 = (16 + 14 + 15×3) / 5 = 15.0
    expect(gradedRows[0].computedAverage).toBeCloseTo(15.0, 1);
    expect(gradedRows[0].position).toBe(1);

    const outsider = createCaller(2);
    await expect(outsider.caller.studentResults.saveImport({ mappings: [mapping] })).rejects.toThrow();
    expect(mockDb.saveStudentGradesRows).toHaveBeenCalledTimes(1);
  });

  it("saveImport مع استبدال يحذف المجموعة القديمة أولاً", async () => {
    const { caller } = createCaller();
    await caller.studentResults.saveImport({
      mappings: [
        {
          sheetFogCode: "2200001",
          classId: 7,
          subject: "التاريخ",
          term: 3,
          overrideExisting: true,
          students: [
            { matricule: "1234567890", fullName: "تلميذ جديد", activityScore: 18, examQuizScore: 17, finalExamScore: 16 },
          ],
        },
      ],
    });
    expect(mockDb.deleteStudentGradesForClass).toHaveBeenCalledWith(1, 7, "التاريخ", 3);
    expect(mockDb.saveStudentGradesRows).toHaveBeenCalledTimes(1);
    // الانضباط/الأنشطة = نصف نقطة النشاطات = 9
    expect(mockDb.upsertGradebookEntry).toHaveBeenCalledTimes(1);
    expect((mockDb.upsertGradebookEntry.mock.calls[0][1] as any).attendanceScore).toBe(9);
  });

  it("list يرجع الترشيحات بدون قسم والفلاتر مع قسم ويحمي الملكية", async () => {
    const { caller } = createCaller();
    expect(Array.isArray(await caller.studentResults.list({}))).toBe(true);
    expect(Array.isArray(await caller.studentResults.list({ classId: 7 }))).toBe(true);
    const badCaller = createCaller(2);
    await expect(badCaller.caller.studentResults.list({ classId: 7 })).rejects.toThrow();
  });

  it("deleteGroup يحذف المجموعة للقسم المملوك فقط", async () => {
    const { caller } = createCaller();
    const result = await caller.studentResults.deleteGroup({ classId: 7, subject: "التاريخ", term: 3 });
    expect(result.success).toBe(true);
    expect(mockDb.deleteStudentGradesForClass).toHaveBeenCalledWith(1, 7, "التاريخ", 3);
  });

  it("analytics يرجع null عند عدم وجود بيانات", async () => {
    const { caller } = createCaller();
    const result = await caller.studentResults.analytics({ classId: 7 });
    expect(result).toBeNull();
  });
});
