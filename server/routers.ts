import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  upsertUser, getUserByOpenId,
  getTeacherProfile, createTeacherProfile, updateTeacherProfile,
  getAcademicYears, getActiveAcademicYear, activateAcademicYear,
  getCurriculumDocuments, getCurriculumDocumentById, createCurriculumDocument, updateCurriculumDocument, deleteCurriculumDocument, getCurriculumForTopic,
  getClasses, getClassById, createClass, updateClass, deleteClass, parseImportExcelWorkbook,
  parseRakmnaExcelWorkbook, computeTermAverage, termAverageEvaluation,
  getStudentGradesByClass, getStudentGradesFilters, saveStudentGradesRows, deleteStudentGradesForClass, deleteStudentGrade,
  recomputeClassGradesEvaluation, getStudentGradesAnalytics, exportBackupExcel, listGeneratedAssessments,
  getGradebookByClass, getGradebookFilters, upsertGradebookEntry,
  sumContinuousScore, deleteGradebookForClass, deleteGradebookEntry,
  monthlySummary,
  getWeeklyScheduleEntries, replaceWeeklyScheduleEntries, listScheduleSeasons,
  createCompensatorySession, getCompensatorySessionsBySituation, getUpcomingCompensatorySessions, updateCompensatorySessionStatus,
  getAnnualPlans, getAnnualPlanById, createAnnualPlan, updateAnnualPlan, deleteAnnualPlan, copyReferencePlanToClass,
  getLessons, getLessonById, createLesson, updateLesson, deleteLesson, toggleLessonCompleted,
  getTeachingNotes, createTeachingNote, updateTeachingNote, deleteTeachingNote,
  getAIResources, getAIResourceById,
  getAIResourceBySerial, createAIResource, updateAIResource, deleteAIResource, duplicateAIResource,
  getInspectorReviews, createInspectorReview, getInspectorReviewById,
  getAnnualPlanSections, getAnnualPlanSectionById, createAnnualPlanSection, updateAnnualPlanSection, deleteAnnualPlanSection,
  getLearningSituations, getLearningSituationsByUserId, getPendingOperationalLearningSituationsByUserId, getLearningSituationById, createLearningSituation, updateLearningSituation, deleteLearningSituation, toggleLearningSituationCompleted,
  getAssessmentResults, createAssessmentResult, updateAssessmentResult, deleteAssessmentResult,
} from "./db";
import {
  getAssessmentRule,
  getAllRules,
  getExamStructure,
  getBloomDistribution,
  buildAssessmentContext,
  getExamHeader,
  COMPETENCY_CATEGORIES,
  getLessonSessionContext,
  AI_ROLE_PRINCIPLE,
  ARABIC_QA_RULES,
} from "./rules/nationalRules";
import { getTeachingTemplate, TEACHING_TEMPLATES } from "../shared/teachingTemplates";
import { buildSeasonReadiness, buildWeeklyReadiness } from "../shared/seasonReadiness";
import { buildAssessmentLatexDocument } from "./latex/assessmentTemplate";
import { buildLessonPlanLatexDocument } from "./latex/lessonPlanTemplate";
import { compileLatexToPdf, LatexCompilationError } from "./latex/compileLatex";

/**
 * تنظيف رموز LaTeX التي قد يُدسّها النموذج داخل المحتوى العربي (تظهر حرفياً
 * في المعاينة والطباعة داخل مخرجات Markdown). نحوّلها إلى رموز Unicode مقروءة
 * بدلاً من حذفها حفاظاً على المعنى (اتجاه/تسلسل بين العبارتين).
 */
function sanitizeLatexSymbols(text: string): string {
  return text
    .replace(/\$\\leftarrow\$|\\leftarrow/g, "\u2190")
    .replace(/\$\\rightarrow\$|\\rightarrow/g, "\u2192")
    .replace(/\$\\Rightarrow\$|\\Rightarrow/g, "\u21D2")
    .replace(/\$\\Leftarrow\$|\\Leftarrow/g, "\u21D0")
    .replace(/\$\\cdot\$|\\cdot/g, "\u00B7");
}

function getLLMTextContent(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;

  const choices = (response as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") return undefined;

  const message = (firstChoice as { message?: unknown }).message;
  if (!message || typeof message !== "object") return undefined;

  const content = (message as { content?: unknown }).content;
  if (typeof content === "string" && content.trim().length > 0) return sanitizeLatexSymbols(content);
  if (Array.isArray(content)) {
    const textParts = content
      .filter(part => part && typeof part === "object" && (part as { type?: string }).type === "text")
      .map(part => (part as { text?: string }).text)
      .filter(t => typeof t === "string")
      .join("");
    if (textParts.trim().length > 0) return sanitizeLatexSymbols(textParts);
  }
  return undefined;
}

/**
 * تتحقق من أن المقطع تابع لخطة تشغيلية يملكها الأستاذ. تبقى المخططات المرجعية
 * قابلة للقراءة والنسخ فقط، ولا يجوز تعديل بنيتها عبر إجراءات المقاطع التابعة.
 */
async function requireEditableSection(sectionId: number, userId: number) {
  const section = await getAnnualPlanSectionById(sectionId);
  if (!section) {
    throw new TRPCError({ code: "NOT_FOUND", message: "المقطع غير موجود" });
  }

  const plan = await getAnnualPlanById(section.annualPlanId);
  if (!plan || plan.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "المقطع غير موجود" });
  }
  if (plan.isReference) {
    throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن تعديل مقاطع المخطط المرجعي" });
  }

  return section;
}

/**
 * تتحقق من أن الوضعية تابعة لخطة تشغيلية يملكها الأستاذ. لا يُسجَّل الإنجاز
 * أو التأجيل أو أي تعديل آخر على البيانات المرجعية الأصلية.
 */
async function requireEditableSituation(situationId: number, userId: number) {
  const situation = await getLearningSituationById(situationId);
  if (!situation) {
    throw new TRPCError({ code: "NOT_FOUND", message: "الوضعية غير موجودة" });
  }

  await requireEditableSection(situation.sectionId, userId);
  return situation;
}

/**
 * يحمي ربط الموعد البديل بالقسم الصحيح؛ فلا يكفي أن يكون القسم والوضعية تابعين
 * للأستاذ نفسه، بل يجب أن تنتمي الوضعية فعلاً إلى خطة ذلك القسم.
 */
async function requireSituationForClass(situationId: number, classId: number, userId: number) {
  const situation = await requireEditableSituation(situationId, userId);
  const section = await getAnnualPlanSectionById(situation.sectionId);
  const plan = section ? await getAnnualPlanById(section.annualPlanId) : undefined;
  if (!plan || plan.classId !== classId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه الوضعية لا تتبع للقسم المحدد." });
  }
  return situation;
}

const WEEK_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;
type WeekDay = (typeof WEEK_DAYS)[number];

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromLocalDateString(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function getNextOccurrence(dayOfWeek: WeekDay, from = new Date()): Date {
  const target = new Date(from);
  target.setHours(12, 0, 0, 0);
  const dayOffset = (WEEK_DAYS.indexOf(dayOfWeek) - target.getDay() + 7) % 7;
  // لا يُعاد حجز الحصة التي سجلت نتيجتها للتو؛ ننتقل إلى ظهورها التالي في الجدول.
  target.setDate(target.getDate() + (dayOffset === 0 ? 7 : dayOffset));
  return target;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Teacher Profile ───────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let profile = await getTeacherProfile(ctx.user.id);
      if (!profile) {
        // إنشاء الملف الشخصي تلقائياً عند أول دخول حتى لا تظهر الحقول فارغة
        const userName = (ctx.user as any)?.name || "";
        await createTeacherProfile({
          userId: ctx.user.id,
          displayName: userName || undefined,
          subject: "التاريخ والجغرافيا والتربية المدنية",
        } as any);
        profile = await getTeacherProfile(ctx.user.id);
      }
      return profile || {
        id: 0,
        userId: ctx.user.id,
        displayName: "",
        subject: "",
        academicYear: "",
        school: "",
        province: "",
      } as any;
    }),
    create: protectedProcedure.input(z.object({
      displayName: z.string().optional(),
      subject: z.string().optional(),
      academicYear: z.string().optional(),
      school: z.string().optional(),
      province: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const existing = await getTeacherProfile(ctx.user.id);
      if (existing) {
        await updateTeacherProfile(ctx.user.id, input as any);
        return await getTeacherProfile(ctx.user.id);
      }
      await createTeacherProfile({ userId: ctx.user.id, ...input } as any);
      return await getTeacherProfile(ctx.user.id);
    }),
    update: protectedProcedure.input(z.object({
      displayName: z.string().optional(),
      subject: z.string().optional(),
      academicYear: z.string().optional(),
      school: z.string().optional(),
      province: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await updateTeacherProfile(ctx.user.id, input as any);
      return await getTeacherProfile(ctx.user.id);
    }),
  }),

  // ─── Academic Years ────────────────────────────────────────
  academicYears: router({
    list: protectedProcedure.query(async () => {
      return await getAcademicYears();
    }),
    activate: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
    })).mutation(async ({ ctx, input }) => {
      return await activateAcademicYear(ctx.user.id, input.academicYear);
    }),
  }),

  // ─── Curriculum Documents ──────────────────────────────────
  curriculum: router({
    list: protectedProcedure.input(z.object({
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      type: z.string().optional(),
      search: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return await getCurriculumDocuments(input || {});
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getCurriculumDocumentById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      type: z.string(),
      subject: z.string(),
      gradeLevel: z.string(),
      content: z.string().min(1),
      academicYear: z.string().optional(),
      unitNumber: z.number().optional(),
      lessonNumber: z.number().optional(),
      tags: z.any().optional(),
      sourceReference: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await createCurriculumDocument(input as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      type: z.string().optional(),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      content: z.string().optional(),
      academicYear: z.string().optional(),
      unitNumber: z.number().optional(),
      lessonNumber: z.number().optional(),
      tags: z.any().optional(),
      sourceReference: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCurriculumDocument(id, data as any);
      return await getCurriculumDocumentById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCurriculumDocument(input.id);
      return { success: true };
    }),
  }),

  // ─── Classes ────────────────────────────────────────────────
  classes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getClasses(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getClassById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      gradeLevel: z.string(),
      section: z.string().optional(),
      subject: z.string().optional(),
      academicYear: z.string().optional(),
      studentCount: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createClass({ userId: ctx.user.id, ...input } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      gradeLevel: z.string().optional(),
      section: z.string().optional(),
      subject: z.string().optional(),
      academicYear: z.string().optional(),
      studentCount: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClass(id, data as any);
      return await getClassById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteClass(input.id);
      return { success: true };
    }),
  }),

  // ─── Weekly Schedule ─────────────────────────────────────────
  weeklySchedule: router({
    get: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
    })).query(async ({ ctx, input }) => {
      return await getWeeklyScheduleEntries(ctx.user.id, input.academicYear);
    }),
    save: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
      entries: z.array(z.object({
        classId: z.number().int().positive(),
        dayOfWeek: z.enum(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]),
        periodIndex: z.number().int().min(1).max(7),
        subject: z.enum(["التاريخ", "الجغرافيا", "التربية المدنية"]),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
        room: z.string().max(64).optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const teacherClasses = await getClasses(ctx.user.id);
      const ownedClassIds = new Set(teacherClasses.map(item => item.id));
      const seasonClassIds = teacherClasses
        .filter((item) => !item.academicYear || item.academicYear === input.academicYear)
        .map((item) => item.id);
      const occupiedSlots = new Set<string>();
      const classSubjectSlots = new Set<string>();

      for (const entry of input.entries) {
        if (!ownedClassIds.has(entry.classId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك إضافة قسم لا يتبع لمساحتك." });
        }
        if (entry.endTime <= entry.startTime) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن تكون نهاية الحصة بعد بدايتها." });
        }
        const slotKey = `${entry.dayOfWeek}-${entry.periodIndex}`;
        if (occupiedSlots.has(slotKey)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تسجيل حصتين في الفترة نفسها." });
        }
        occupiedSlots.add(slotKey);
        const classSubjectKey = `${entry.classId}-${entry.subject}`;
        if (classSubjectSlots.has(classSubjectKey)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لكل قسم حصة أسبوعية واحدة فقط في كل مادة." });
        }
        classSubjectSlots.add(classSubjectKey);
      }

      for (const classId of seasonClassIds) {
        const missingSubjects = ["التاريخ", "الجغرافيا", "التربية المدنية"].filter(
          (subject) => !classSubjectSlots.has(`${classId}-${subject}`),
        );
        if (missingSubjects.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `يجب إدراج حصة أسبوعية لكل مادة للقسم، والمادة الناقصة: ${missingSubjects.join("، ")}.`,
          });
        }
      }

      return await replaceWeeklyScheduleEntries(ctx.user.id, input.academicYear, input.entries);
    }),
    listSeasons: protectedProcedure.query(async ({ ctx }) => {
      return await listScheduleSeasons(ctx.user.id);
    }),
    parseExcel: protectedProcedure.input(z.object({
      fileContent: z.string().min(100).max(2_000_000),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileContent, "base64");
      try {
        return parseImportExcelWorkbook(buffer);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "تعذر قراءة الملف. تأكد أنه ملف Excel (.xlsx) سليم." });
      }
    }),
    saveImportedData: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
      newClasses: z.array(z.object({
        name: z.string().min(1).max(128),
        gradeLevel: z.enum(["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"]),
        studentCount: z.number().int().min(0).max(200).optional(),
      })).default([]),
      entries: z.array(z.object({
        className: z.string().min(1).max(128),
        dayOfWeek: z.enum(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]),
        periodIndex: z.number().int().min(1).max(7),
        subject: z.enum(["التاريخ", "الجغرافيا", "التربية المدنية"]),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })).min(1),
    })).mutation(async ({ ctx, input }) => {
      const teacherClasses = await getClasses(ctx.user.id);
      const existingByName = new Map(teacherClasses.map((item) => [item.name, item]));
      const resolvedClassIds = new Map<string, number>();
      const nowYear = input.academicYear;
      for (const newClass of input.newClasses) {
        const match = existingByName.get(newClass.name);
        const classId = match?.id ?? (await createClass({
          userId: ctx.user.id,
          name: newClass.name,
          gradeLevel: newClass.gradeLevel,
          academicYear: nowYear,
          studentCount: newClass.studentCount ?? 0,
          subject: "التاريخ والجغرافيا والتربية المدنية",
        }))?.id;
        if (!classId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `تعذر إنشاء القسم «${newClass.name}».` });
        }
        resolvedClassIds.set(newClass.name, classId);
      }
      const entries = input.entries.map((entry) => {
        const classId = resolvedClassIds.get(entry.className);
        if (!classId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `القسم «${entry.className}» غير موجود في مساحتك ولا في ملف الاستيراد.` });
        }
        return { classId, dayOfWeek: entry.dayOfWeek, periodIndex: entry.periodIndex, subject: entry.subject, startTime: entry.startTime, endTime: entry.endTime };
      });
      return await replaceWeeklyScheduleEntries(ctx.user.id, nowYear, entries);
    }),
    copyFromSeason: protectedProcedure.input(z.object({
      fromAcademicYear: z.string().min(4).max(16),
      toAcademicYear: z.string().min(4).max(16),
    })).mutation(async ({ ctx, input }) => {
      if (input.fromAcademicYear === input.toAcademicYear) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن النسخ من الموسم نفسه." });
      }

      const sourceEntries = await getWeeklyScheduleEntries(ctx.user.id, input.fromAcademicYear);
      if (sourceEntries.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد جدول محفوظ لهذا الموسم." });
      }

      const ownedClassIds = new Set((await getClasses(ctx.user.id)).map((item) => item.id));
      const validEntries = sourceEntries
        .filter((entry) => ownedClassIds.has(entry.classId))
        .map(({ classId, dayOfWeek, periodIndex, subject, startTime, endTime, room }) => ({
          classId,
          dayOfWeek,
          periodIndex,
          subject,
          startTime,
          endTime,
          room: room || undefined,
        }));

      return await replaceWeeklyScheduleEntries(ctx.user.id, input.toAcademicYear, validEntries);
    }),
  }),
  // ─── Student Grades (نتائج التلاميذ من وثيقة حجز النقاط) ────
  studentResults: router({
    parseExcel: protectedProcedure.input(z.object({
      fileContent: z.string().min(100).max(5_000_000),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileContent, "base64");
      try {
        return parseRakmnaExcelWorkbook(buffer);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "تعذر قراءة الملف. تأكد أنه ملف Excel (.xlsx) سليم (وثيقة حجز نقاط من منصة الرقمنة)." });
      }
    }),
    saveImport: protectedProcedure.input(z.object({
      mappings: z.array(z.object({
        sheetFogCode: z.string().min(1).max(32),
        classId: z.number().int().positive(),
        subject: z.string().min(2).max(64),
        term: z.number().int().min(1).max(4),
        overrideExisting: z.boolean().default(false),
        students: z.array(z.object({
          matricule: z.string().min(10).max(32),
          fullName: z.string().min(2).max(256),
          birthDate: z.string().max(16).nullable().optional(),
          activityScore: z.number().min(0).max(20).nullable(),
          examQuizScore: z.number().min(0).max(20).nullable(),
          finalExamScore: z.number().min(0).max(20).nullable(),
        })).min(1).max(100),
      })).min(1).max(30),
    })).mutation(async ({ ctx, input }) => {
      const teacherClasses = await getClasses(ctx.user.id);
      const ownedClassIds = new Set(teacherClasses.map((item) => item.id));
      for (const mapping of input.mappings) {
        if (!ownedClassIds.has(mapping.classId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك الحفظ في قسم لا يتبع لمساحتك." });
        }
      }
      const accepted: string[] = [];
      for (const mapping of input.mappings) {
        if (mapping.overrideExisting) {
          await deleteStudentGradesForClass(ctx.user.id, mapping.classId, mapping.subject, mapping.term);
        }
      const rows = mapping.students as { matricule: string; fullName: string; birthDate?: string | null; activityScore: number | null; examQuizScore: number | null; finalExamScore: number | null }[];
      const graded = rows.map((student: { matricule: string; fullName: string; birthDate?: string | null; activityScore: number | null; examQuizScore: number | null; finalExamScore: number | null }, index: number) => ({
          userId: ctx.user.id,
          classId: mapping.classId,
          subject: mapping.subject,
          term: mapping.term,
          fogCode: mapping.sheetFogCode,
          matricule: student.matricule,
          fullName: student.fullName,
          birthDate: student.birthDate,
          activityScore: student.activityScore,
          examQuizScore: student.examQuizScore,
          finalExamScore: student.finalExamScore,
          computedAverage: computeTermAverage(student.activityScore, student.examQuizScore, student.finalExamScore),
          officialEvaluation: null as string | null,
          position: index + 1,
        }));
        await saveStudentGradesRows(graded);
        // صب نفس نقاط الرقمنة مباشرة في دفتر التنقيط (انضباط/مواظبة = نصف معدل النشاطات، أنشطة = نصف معدل النشاطات تقريبًا وفق الوثيقة)
        for (const student of rows) {
          const activitySplit = student.activityScore != null ? student.activityScore / 2 : null;
          await upsertGradebookEntry(ctx.user.id, {
            userId: ctx.user.id,
            classId: mapping.classId,
            term: mapping.term,
            subject: mapping.subject,
            studentName: student.fullName,
            studentMatricule: student.matricule,
            attendanceScore: activitySplit,
            activityScore: activitySplit,
            continuousScore: student.activityScore,
            quizScore: student.examQuizScore,
            assessmentScore: student.finalExamScore,
            assessmentResultId: null,
            source: "rakmna",
            notes: "نُقلت من وثيقة حجز النقاط الرسمية",
          });
        }
        accepted.push(mapping.sheetFogCode);
      }
      return { saved: accepted };
    }),
    list: protectedProcedure.input(z.object({
      classId: z.number().int().positive().optional(),
    })).query(async ({ ctx, input }) => {
      if (input.classId) {
        const classes = await getClasses(ctx.user.id);
        const owned = classes.find((item) => item.id === input.classId);
        if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
        return await getStudentGradesByClass(ctx.user.id, input.classId);
      }
      return await getStudentGradesFilters(ctx.user.id);
    }),
    deleteGroup: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      subject: z.string().min(2).max(64),
      term: z.number().int().min(1).max(4),
    })).mutation(async ({ ctx, input }) => {
      await deleteStudentGradesForClass(ctx.user.id, input.classId, input.subject, input.term);
      return { success: true };
    }),
    deleteStudent: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await deleteStudentGrade(input.id, ctx.user.id);
      return { success: true };
    }),
    computeEvaluation: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
    })).mutation(async ({ ctx, input }) => {
      const classes = await getClasses(ctx.user.id);
      const owned = classes.find((item) => item.id === input.classId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      await recomputeClassGradesEvaluation(ctx.user.id, input.classId);
      return { success: true };
    }),
    analytics: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      subject: z.string().optional(),
      term: z.number().int().min(1).max(4).optional(),
    })).query(async ({ ctx, input }) => {
      const classes = await getClasses(ctx.user.id);
      const owned = classes.find((item) => item.id === input.classId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      return await getStudentGradesAnalytics(ctx.user.id, input.classId, input.subject ?? null, input.term ?? null);
    }),
    /** نسخة Excel احتياطية من نقاط القسم (صيغة متوافقة مع الاستيراد لإعادة الاستيراد عند الحاجة). */
    exportBackup: protectedProcedure.input(z.object({
      classId: z.number().int().positive().optional(),
    })).query(async ({ ctx, input }) => {
      if (input.classId) {
        const classes = await getClasses(ctx.user.id);
        const owned = classes.find((item) => item.id === input.classId);
        if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      }
      return await exportBackupExcel(ctx.user.id, input.classId ?? null);
    }),
    /**
     * التقويمات التحصيلية المولّدة من استوديو التقييم والمرشّحة للقسم.
     * التقويم التحصيلي وثيقة موحّدة لكل المستوى؛ لذا تُعرض كل تقويمات
     * (exam/quiz) لنفس المادة والمستوى حتى لو لم تُربط بالقسم نفسه.
     */
    linkedAssessments: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      subject: z.string().min(2).max(128),
      term: z.number().int().min(1).max(4).optional(),
    })).query(async ({ ctx, input }) => {
      const classes = await getClasses(ctx.user.id);
      const owned = classes.find((item) => item.id === input.classId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      return await listGeneratedAssessments(ctx.user.id, input.classId, input.subject, input.term ?? 0);
    }),
  }),

  // ─── Gradebook (دفتر التنقيط) ────────────────────────────────
  gradebook: router({
    list: protectedProcedure.input(z.object({
      classId: z.number().int().positive().optional(),
      term: z.number().int().min(1).max(4).optional(),
      subject: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      if (input.classId) {
        const classes = await getClasses(ctx.user.id);
        const owned = classes.find((item) => item.id === input.classId);
        if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
        if (input.term == null || !input.subject) {
          return await getGradebookFilters(ctx.user.id);
        }
        return await getGradebookByClass(ctx.user.id, input.classId, input.term, input.subject);
      }
      return await getGradebookFilters(ctx.user.id);
    }),
    /** إدخال/تحديث شبكة إدخالات كاملة: لكل تلميذ معيار أو أكثر. */
    saveEntries: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      term: z.number().int().min(1).max(4),
      subject: z.string().min(2).max(100),
      source: z.enum(["manual", "rakmna", "assessment"]).default("manual"),
      entries: z.array(z.object({
        studentName: z.string().min(2).max(255),
        studentMatricule: z.string().max(64).nullable().optional(),
        attendanceScore: z.number().min(0).max(10).nullable(),
        activityScore: z.number().min(0).max(10).nullable(),
        continuousScore: z.number().min(0).max(20).nullable(),
        quizScore: z.number().min(0).max(20).nullable(),
        assessmentScore: z.number().min(0).max(20).nullable(),
        assessmentResultId: z.number().int().positive().nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })).min(1).max(120),
    })).mutation(async ({ ctx, input }) => {
      const classes = await getClasses(ctx.user.id);
      const owned = classes.find((item) => item.id === input.classId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      let saved = 0;
      for (const entry of input.entries) {
        const continuous = sumContinuousScore(entry.attendanceScore, entry.activityScore, entry.continuousScore);
        await upsertGradebookEntry(ctx.user.id, {
          userId: ctx.user.id,
          classId: input.classId,
          term: input.term,
          subject: input.subject,
          studentName: entry.studentName,
          studentMatricule: entry.studentMatricule ?? null,
          attendanceScore: entry.attendanceScore,
          activityScore: entry.activityScore,
          continuousScore: continuous,
          quizScore: entry.quizScore,
          assessmentScore: entry.assessmentScore,
          assessmentResultId: entry.assessmentResultId ?? null,
          source: input.source,
          notes: entry.notes ?? null,
        });
        saved += 1;
      }
      return { saved };
    }),
    deleteGroup: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      subject: z.string().min(2).max(100),
      term: z.number().int().min(1).max(4),
    })).mutation(async ({ ctx, input }) => {
      await deleteGradebookForClass(ctx.user.id, input.classId, input.subject, input.term);
      return { success: true };
    }),
        deleteEntry: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await deleteGradebookEntry(input.id, ctx.user.id);
      return { success: true };
    }),
    /** الاستيفائي الشهري: ملخص تقويم التلاميذ خلال شهر معيّن (للتعبئة في دفتر الأستاذ). */
    monthlySummary: protectedProcedure.input(z.object({
      classId: z.number().int().positive(),
      term: z.number().int().min(1).max(4),
      subject: z.string().min(2).max(100),
      monthKey: z.string().regex(/^\d{4}-\d{2}$/),
    })).query(async ({ ctx, input }) => {
      const classes = await getClasses(ctx.user.id);
      const owned = classes.find((item) => item.id === input.classId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "القسم لا يتبع لمساحتك." });
      return await monthlySummary(ctx.user.id, input.classId, input.term, input.subject, input.monthKey);
    }),
  }),
  // ─── Season Readiness ───────────────────────────────────────
  seasonReadiness: router({
    get: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
    })).query(async ({ ctx, input }) => {
      const [teacherClasses, plans, scheduleEntries] = await Promise.all([
        getClasses(ctx.user.id),
        getAnnualPlans(ctx.user.id, { academicYear: input.academicYear }),
        getWeeklyScheduleEntries(ctx.user.id, input.academicYear),
      ]);
      return buildSeasonReadiness(teacherClasses, plans, scheduleEntries, input.academicYear);
    }),
  }),

  // ─── Compensatory Sessions ───────────────────────────────────
  compensatorySessions: router({
    suggest: protectedProcedure.input(z.object({
      situationId: z.number().int().positive(),
      academicYear: z.string().min(4).max(16),
      subject: z.enum(["التاريخ", "الجغرافيا", "التربية المدنية"]),
      classId: z.number().int().positive(),
      sourceStatus: z.enum(["postponed", "cancelled"]),
    })).query(async ({ ctx, input }) => {
      const classItem = await getClassById(input.classId);
      if (!classItem || classItem.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      }
      if (classItem.academicYear && classItem.academicYear !== input.academicYear) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "القسم لا يتبع للموسم الدراسي المختار." });
      }

      const situation = await requireSituationForClass(input.situationId, input.classId, ctx.user.id);
      if (situation.sessionStatus !== input.sourceStatus) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن اقتراح موعد بديل إلا لحصة مؤجلة أو ملغاة بالحالة نفسها." });
      }

      const [scheduleEntries, bookedSessions] = await Promise.all([
        getWeeklyScheduleEntries(ctx.user.id, input.academicYear),
        getUpcomingCompensatorySessions(ctx.user.id, input.academicYear),
      ]);
      const matchingSlots = scheduleEntries.filter((entry) => (
        entry.classId === input.classId && entry.subject === input.subject
      ));
      if (matchingSlots.length === 0) return [];

      const occupiedSlots = new Set(bookedSessions.map((session) => `${session.scheduledDate}-${session.periodIndex}`));
      const suggestions: Array<{
        scheduledDate: string;
        dayOfWeek: WeekDay;
        periodIndex: number;
        startTime: string;
        endTime: string;
      }> = [];

      for (const slot of matchingSlots) {
        const firstDate = getNextOccurrence(slot.dayOfWeek as WeekDay);
        for (let week = 0; week < 3; week += 1) {
          const candidate = new Date(firstDate);
          candidate.setDate(candidate.getDate() + (week * 7));
          const scheduledDate = toLocalDateString(candidate);
          if (occupiedSlots.has(`${scheduledDate}-${slot.periodIndex}`)) continue;
          suggestions.push({
            scheduledDate,
            dayOfWeek: slot.dayOfWeek as WeekDay,
            periodIndex: slot.periodIndex,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }

      return suggestions
        .sort((first, second) => first.scheduledDate.localeCompare(second.scheduledDate) || first.periodIndex - second.periodIndex)
        .slice(0, 3);
    }),
    book: protectedProcedure.input(z.object({
      situationId: z.number().int().positive(),
      classId: z.number().int().positive(),
      academicYear: z.string().min(4).max(16),
      subject: z.enum(["التاريخ", "الجغرافيا", "التربية المدنية"]),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ هي YYYY-MM-DD"),
      dayOfWeek: z.enum(WEEK_DAYS),
      periodIndex: z.number().int().min(1).max(7),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
      sourceStatus: z.enum(["postponed", "cancelled"]),
    })).mutation(async ({ ctx, input }) => {
      const classItem = await getClassById(input.classId);
      if (!classItem || classItem.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      }
      if (classItem.academicYear && classItem.academicYear !== input.academicYear) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "القسم لا يتبع للموسم الدراسي المختار." });
      }

      const situation = await requireSituationForClass(input.situationId, input.classId, ctx.user.id);
      if (situation.sessionStatus !== input.sourceStatus) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن حجز موعد بديل إلا لوضعية مؤجلة أو ملغاة بالحالة نفسها." });
      }
      if (input.endTime <= input.startTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن تكون نهاية الحصة بعد بدايتها." });
      }
      const date = dateFromLocalDateString(input.scheduledDate);
      if (Number.isNaN(date.valueOf()) || WEEK_DAYS[date.getDay()] !== input.dayOfWeek) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "تاريخ الموعد لا يطابق يوم الأسبوع المحدد." });
      }

      const [scheduleEntries, existingForSituation, upcomingSessions] = await Promise.all([
        getWeeklyScheduleEntries(ctx.user.id, input.academicYear),
        getCompensatorySessionsBySituation(ctx.user.id, input.situationId),
        getUpcomingCompensatorySessions(ctx.user.id, input.academicYear),
      ]);
      const isMatchingSlot = scheduleEntries.some((entry) => (
        entry.classId === input.classId
        && entry.subject === input.subject
        && entry.dayOfWeek === input.dayOfWeek
        && entry.periodIndex === input.periodIndex
        && entry.startTime === input.startTime
        && entry.endTime === input.endTime
      ));
      if (!isMatchingSlot) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "اختر موعداً من حصص القسم المسجلة في جدول خدمتك." });
      }
      if (existingForSituation.some((session) => session.status === "scheduled")) {
        throw new TRPCError({ code: "CONFLICT", message: "يوجد موعد بديل محجوز بالفعل لهذه الوضعية." });
      }
      if (upcomingSessions.some((session) => session.scheduledDate === input.scheduledDate && session.periodIndex === input.periodIndex)) {
        throw new TRPCError({ code: "CONFLICT", message: "هذا الموعد محجوز بالفعل لحصة تعويضية أخرى." });
      }

      const created = await createCompensatorySession({
        ...input,
        userId: ctx.user.id,
        status: "scheduled",
      });
      return { success: true, id: created?.id } as const;
    }),
    list: protectedProcedure.input(z.object({
      academicYear: z.string().min(4).max(16),
    })).query(async ({ ctx, input }) => {
      return await getUpcomingCompensatorySessions(ctx.user.id, input.academicYear);
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await updateCompensatorySessionStatus(input.id, ctx.user.id, "cancelled");
      return { success: true } as const;
    }),
  }),

  // ─── Annual Plans ──────────────────────────────────────────
  annualPlans: router({
    list: protectedProcedure.input(z.object({
      academicYear: z.string().optional(),
      subject: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return await getAnnualPlans(ctx.user.id, input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const plan = await getAnnualPlanById(input.id);
      if (!plan || (plan.userId !== ctx.user.id && !plan.isReference)) throw new TRPCError({ code: "NOT_FOUND", message: "الخطة غير موجودة" });
      return plan;
    }),
    create: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      subject: z.string().min(1),
      gradeLevel: z.string().min(1),
      academicYear: z.string().min(1),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createAnnualPlan({ userId: ctx.user.id, ...input, isReference: false } as any);
    }),
    copyReferenceToClass: protectedProcedure.input(z.object({
      referencePlanId: z.number(),
      classId: z.number(),
      academicYear: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const classItem = await getClassById(input.classId);
      if (!classItem || classItem.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "القسم غير موجود" });
      const copied = await copyReferencePlanToClass(input.referencePlanId, ctx.user.id, input.classId, input.academicYear);
      if (!copied) throw new TRPCError({ code: "NOT_FOUND", message: "المخطط المرجعي غير موجود" });
      return copied;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      classId: z.number().optional(),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      academicYear: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const plan = await getAnnualPlanById(id);
      if (!plan || plan.userId !== ctx.user.id || plan.isReference) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن تعديل المخطط المرجعي" });
      await updateAnnualPlan(id, data as any);
      return await getAnnualPlanById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const plan = await getAnnualPlanById(input.id);
      if (!plan || plan.userId !== ctx.user.id || plan.isReference) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن حذف المخطط المرجعي" });
      await deleteAnnualPlan(input.id);
      return { success: true };
    }),
  }),

  // ─── Lessons ────────────────────────────────────────────────
  lessons: router({
    list: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      isCompleted: z.boolean().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return await getLessons(ctx.user.id, input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getLessonById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      title: z.string().min(1),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      unitTitle: z.string().optional(),
      unitNumber: z.number().optional(),
      lessonNumber: z.number().optional(),
      content: z.string().optional(),
      plan: z.string().optional(),
      objectives: z.string().optional(),
      duration: z.string().optional(),
      date: z.string().optional(),
      isCompleted: z.boolean().optional(),
      tags: z.any().optional(),
      curriculumReferences: z.any().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const data = { ...input };
      if (data.date) data.date = new Date(data.date) as any;
      return await createLesson({ userId: ctx.user.id, ...data } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      classId: z.number().optional(),
      title: z.string().optional(),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      unitTitle: z.string().optional(),
      unitNumber: z.number().optional(),
      lessonNumber: z.number().optional(),
      content: z.string().optional(),
      plan: z.string().optional(),
      objectives: z.string().optional(),
      duration: z.string().optional(),
      date: z.string().optional(),
      isCompleted: z.boolean().optional(),
      tags: z.any().optional(),
      curriculumReferences: z.any().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.date) data.date = new Date(data.date) as any;
      await updateLesson(id, data as any);
      return await getLessonById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteLesson(input.id);
      return { success: true };
    }),
    toggleCompleted: protectedProcedure.input(z.object({ id: z.number(), isCompleted: z.boolean() })).mutation(async ({ input }) => {
      await toggleLessonCompleted(input.id, input.isCompleted);
      return { success: true };
    }),
  }),

  // ─── Teaching Notes ─────────────────────────────────────────
  teachingNotes: router({
    list: protectedProcedure.input(z.object({ lessonId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return await getTeachingNotes(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      lessonId: z.number().optional(),
      title: z.string().optional(),
      content: z.string().min(1),
      noteType: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createTeachingNote({ userId: ctx.user.id, ...input } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      lessonId: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      noteType: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTeachingNote(id, data as any);
      return { id };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteTeachingNote(input.id);
      return { success: true };
    }),
  }),

  // ─── AI Resources (Content Library) ────────────────────────
  aiResources: router({
    list: protectedProcedure.input(z.object({
      type: z.string().optional(),
      lessonId: z.number().optional(),
      classId: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return await getAIResources(ctx.user.id, input);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getAIResourceById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      lessonId: z.number().optional(),
      classId: z.number().optional(),
      type: z.string(),
      title: z.string().min(1),
      content: z.string().min(1),
      metadata: z.any().optional(),
      tags: z.any().optional(),
      sourceDocumentIds: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createAIResource({ userId: ctx.user.id, ...input } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      lessonId: z.number().optional(),
      classId: z.number().optional(),
      type: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      metadata: z.any().optional(),
      tags: z.any().optional(),
      sourceDocumentIds: z.any().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAIResource(id, data as any);
      return await getAIResourceById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteAIResource(input.id);
      return { success: true };
    }),

    // ─── التحقق العام من صحة الوثيقة (عبر رمز QR) ─────────────
    getBySerial: publicProcedure.input(z.object({ serialNumber: z.string() })).query(async ({ input }) => {
      const resource = await getAIResourceBySerial(input.serialNumber.trim());
      if (!resource) return { found: false } as const;
      const now = Date.now();
      const answerVisible = resource.examEndsAt !== null && resource.examEndsAt !== undefined && now >= (resource.examEndsAt as number);
      return {
        found: true,
        title: resource.title,
        type: resource.type,
        createdAt: resource.createdAt.getTime(),
        answerRevealAt: resource.examEndsAt ?? null,
        answerVisible,
      };
    }),

    // ─── كشف نموذج الإجابات (يُفعَّل فقط بعد نهاية الاختبار) ──
    getAnswer: publicProcedure.input(z.object({ serialNumber: z.string() })).query(async ({ input }) => {
      const resource = await getAIResourceBySerial(input.serialNumber.trim());
      if (!resource) return { status: "not_found" as const };
      const revealAt = resource.examEndsAt;
      if (revealAt === null || revealAt === undefined || Date.now() < revealAt) {
        return { status: "locked" as const, revealAt };
      }
      return { status: "revealed" as const, content: resource.content, title: resource.title, revealAt };
    }),
    duplicate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return await duplicateAIResource(input.id, ctx.user.id);
    }),
  }),

  // ─── Arabic TTS (Gemini free tier) ─────────────────────────
  tts: router({
    generate: protectedProcedure.input(z.object({
      text: z.string().min(1),
      voice: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Keep the mutation lightweight for long lesson content: trim to a safe
      // cap so TTS quota (RPM/minute limits) is respected.
      const trimmed = input.text.slice(0, 6000);
      const { generateTtsAudio } = await import("./_core/tts");
      return await generateTtsAudio({ text: trimmed, voice: input.voice });
    }),
  }),

  // ─── Inspector Reviews ─────────────────────────────────────
  inspector: router({
    reviews: protectedProcedure.query(async ({ ctx }) => {
      return await getInspectorReviews(ctx.user.id);
    }),
    reviewById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getInspectorReviewById(input.id);
    }),
    reviewLesson: protectedProcedure.input(z.object({
      lessonId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const lesson = await getLessonById(input.lessonId);
      if (!lesson) throw new Error("الدرس غير موجود");

      // Get relevant curriculum documents for context
      const curriculumDocs = await getCurriculumDocuments({
        gradeLevel: lesson.gradeLevel || undefined,
        type: "lesson",
      });
      const curriculumContext = curriculumDocs.length > 0
        ? curriculumDocs.slice(0, 3).map(d => `${d.title}: ${d.content.substring(0, 500)}`).join("\n\n")
        : "لا توجد وثائق منهج متاحة. يجب على المعلم أن يستند إلى المنهج الرسمي الجزائري للدراسات الاجتماعية (التاريخ والجغرافيا والتربية المدنية) في التعليم المتوسط.";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `أنت مفتش تربوي متخصص في التعليم المتوسط الجزائري، تخصص الدراسات الاجتماعية (التاريخ والجغرافيا والتربية المدنية).
قَيِّم الدرس المقدم لك وفق المعايير التالية:

1. **التوافق مع المنهج الرسمي الجزائري**: هل المحتوى يتوافق مع المنهج الرسمي؟ هل يستند إلى وثائق المنهج المرجعية؟
2. **وضوح أهداف التعلم**: هل الأهداف محددة وقابلة للقياس؟ إذا كانت الأهداف غائبة أو غير واضحة، أشر إلى ذلك كخطأ جوهري.
3. **جودة التقييم وأسئلة التقييم**: هل الأسئلة متنوعة ومناسبة؟ هل تتوافق مع المدة الزمنية؟
4. **تطبيق تصنيف بلوم (Bloom's Taxonomy)**: هل يشمل مستويات مختلفة (تذكر، فهم، تطبيق، تحليل، تقييم، إبداع)؟ إذا كان كله على مستوى واحد فقط، أشر إلى ذلك.
5. **دمج التعلم النشط**: هل يتضمن أنشطة تفاعلية تشجع مشاركة الطلاب؟ إذا كان كلها شرح مباشر بدون نشاط، أشر إلى ذلك.
6. **استراتيجيات التمييز والتمايز**: هل يأخذ بعين الاعتبار الفروق الفردية بين التلاميذ؟
7. **توزيع الزمن**: هل المدة الزمنية واقعية للمحتوى المقدم؟
8. **التقويم التكويني**: هل يتضمن وسائل لتقويم فهم التلاميذ أثناء الحصة؟
9. **اكتمال عناصر الحصة اليومية الخمسة عشر**: (بيانات الحصة، الكفاءة المستهدفة حرفياً من المنهاج، أهداف قابلة للقياس، المكتسبات القبلية، الوسائل مع بديل الغياب، استراتيجية تعلم نشط، سير الحصة بالزمن، دور الأستاذ، دور المتعلم، النشاط الرئيسي، منتج التلميذ، تقويم تكويني، النشاط الختامي، الواجب المنزلي، علاج للمتعثرين وإثراء للمتفوقين). خصم نقاط واضحة عن كل عنصر غائب.
10. **الواقعية الصفية**: التصميم يجب أن يناسب أقساماً كبيرة من 40 إلى 45 تلميذاً ولا يفترض عارضاً ضوئياً أو إنترنتاً أو طباعة كثيرة.
11. **ارتباط الكفاءة بالوضعية**: الكفاءة المستهدفة يجب أن تكون من وثائق المنهاج كما هي دون صياغة ذاتية.

كشف الأخطاء التربوية الحقيقية:
- إذا لم توجد أهداف تعليمية محددة → خطأ جوهري
- إذا لم يوجد نشاط تفاعلي → خطأ جوهري
- إذا كانت جميع الأسئلة على مستوى التذكر فقط → نقص جوهري
- إذا لم يوجد تقويم داخلي → نقص
- إذا كان المحتوى غير مرتبط بالمنهج → خطأ جوهري

أجب بتنسيق JSON بهذا الشكل:
{"overallScore": 0-100, "criteria": {"curriculumAlignment": {"score": 0-20, "findings": ""}, "learningObjectives": {"score": 0-20, "findings": ""}, "assessmentQuality": {"score": 0-20, "findings": ""}, "bloomsTaxonomy": {"score": 0-20, "findings": ""}, "activeLearning": {"score": 0-20, "findings": ""}}, "criticalErrors": ["خطأ 1", "خطأ 2"], "recommendations": ["توصية 1", "توصية 2"]}`
          },
          {
            role: "user",
            content: `درس لتقييمه:
العنوان: ${lesson.title}
المادة: ${lesson.subject || "غير محددة"}
المستوى: ${lesson.gradeLevel || "غير محدد"}
المحتوى: ${lesson.content || "لا يوجد محتوى محدد"}
الخطة: ${lesson.plan || "لا توجد خطة محددة"}
الأهداف: ${lesson.objectives || "لا توجد أهداف محددة"}

وثائق المنهج المرجعية المتاحة:
${curriculumContext}`
          }
        ],
      });

      const evaluation = getLLMTextContent(response) ?? "تعذر إتمام التقييم.";

      // Parse structured criteria from evaluation
      const parseCriterion = (evaluation: string, keyword: string): string => {
        const lines = evaluation.split("\n");
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            return line.replace(/^[#*\d.\- ]+/g, "").trim().substring(0, 200);
          }
        }
        return "يتم التقييم";
      };

      const review = await createInspectorReview({
        userId: ctx.user.id,
        resourceId: lesson.id,
        resourceType: "lesson",
        evaluation,
        criteria: {
          curriculumAlignment: parseCriterion(evaluation, "المنهج"),
          learningObjectives: parseCriterion(evaluation, "الهدف"),
          assessmentQuality: parseCriterion(evaluation, "التقييم"),
          bloomsTaxonomy: parseCriterion(evaluation, "بلوم"),
          activeLearning: parseCriterion(evaluation, "التعلم النشط"),
        },
        overallScore: null,
        recommendations: evaluation,
      });

      return review;
    }),
    reviewAssessment: protectedProcedure.input(z.object({
      resourceId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const resource = await getAIResourceById(input.resourceId);
      if (!resource) throw new Error("المورد غير موجود");

      // Get relevant curriculum context
      const metadata = (resource.metadata || {}) as any;
      const curriculumDocs = await getCurriculumDocuments({
        gradeLevel: metadata.gradeLevel || undefined,
        subject: metadata.subject || undefined,
      });
      const curriculumContext = curriculumDocs.length > 0
        ? curriculumDocs.slice(0, 3).map(d => `${d.title}: ${d.content.substring(0, 500)}`).join("\n\n")
        : "لا توجد وثائق منهج متاحة.";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `أنت مفتش تربوي متخصص في التعليم المتوسط الجزائري، تخصص الدراسات الاجتماعية.
قَيِّم التقييم (اختبار/امتحان) المقدم لك وفق المعايير التالية:
1. **التوافق مع المنهج الرسمي الجزائري**: هل يتوافق مع أهداف المنهج والمحتوى المقرر؟
2. **وضوح أهداف التعلم**: هل يقيس أهداف التعلم المحددة؟
3. **جودة الأسئلة وصعوبتها**: هل الأسئلة واضحة ومناسبة للمستوى؟ هل تتضمن مستويات صعوبة متنوعة؟
4. **تطبيق تصنيف بلوم (Bloom's Taxonomy)**: هل يتضمن مستويات مختلفة (تذكر، فهم، تطبيق، تحليل، تقييم، إبداع)؟
5. **عدالة التقييم**: هل التقييم عادل وشامل؟ هل يقيس ما تم تدريسه فعلاً؟
6. **تطبيق قواعد التقويم الوطنية**: هل توزيع النقاط متوافق مع القواعد الرسمية (10+10 أو 13+7)؟ هل المدة مناسبة؟
7. **ربط الأسئلة بالكفاءات**: هل كل سؤال مرتبط بكفاءة محددة يقيسها؟
8. **التزام بنية الاختبار الرسمية (دليل 2018)**: الجزء الأول وضعيات بسيطة مستقلة بلا سياق سردي متدرجة من الأسهل إلى الأصعب، والجزء الثاني وضعية إدماج واحدة بمعايير الملاءمة وأدوات المادة والمنهجية والإتقان والتمييز، مع شبكة تقويم لكل جزء وسندات (نصوص، جداول، خرائط، مواد دستورية) لوضعية الإدماج.
كشف الأخطاء التربوية الحقيقية:
- إذا كان توزيع النقاط لا يتوافق مع القواعد الوطنية → خطأ جوهري
- إذا كانت الأسئلة كلها على مستوى التذكر → نقص جوهري
- إذا لم يكن هناك ربط بالكفاءات → نقص
- إذا كانت المدة غير مناسبة → ملاحظة
- إذا كان هناك سؤال لا يقيس أي هدف → خطأ
- إذا كانت الوضعيات البسيطة تحمل سياقاً سردياً أو لم تتدرج من الأسهل للأصعب → ملاحظة بنيوية
- إذا خلت وضعية الإدماج من تعليمة واضحة أو سندات → خطأ بنيوي
- إذا لم يتضمن مفتاح التصحيح شبكة تقويم لوضعية الإدماج (الملاءمة، أدوات المادة، المنهجية، الإتقان والتمييز) → نقص جوهري في المفتاح

أجب بتنسيق JSON بهذا الشكل:
{"overallScore": 0-100, "criteria": {"curriculumAlignment": {"score": 0-20, "findings": ""}, "learningObjectives": {"score": 0-20, "findings": ""}, "assessmentQuality": {"score": 0-20, "findings": ""}, "bloomsTaxonomy": {"score": 0-20, "findings": ""}, "activeLearning": {"score": 0-20, "findings": ""}}, "criticalErrors": ["خطأ 1", "خطأ 2"], "recommendations": ["توصية 1", "توصية 2"]}`
          },
          {
            role: "user",
            content: `تقييم للمراجعة:
العنوان: ${resource.title}
النوع: ${resource.type}
المحتوى: ${resource.content}

وثائق المنهج المرجعية المتاحة:
${curriculumContext}`
          }
        ],
      });

      const evaluation = getLLMTextContent(response) ?? "تعذر إتمام التقييم.";

      const parseCriterion = (evaluation: string, keyword: string): string => {
        const lines = evaluation.split("\n");
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword.toLowerCase())) {
            return line.replace(/^[#*\d.\- ]+/g, "").trim().substring(0, 200);
          }
        }
        return "يتم التقييم";
      };

      return await createInspectorReview({
        userId: ctx.user.id,
        resourceId: resource.id,
        resourceType: "assessment",
        evaluation,
        criteria: {
          curriculumAlignment: parseCriterion(evaluation, "المنهج"),
          learningObjectives: parseCriterion(evaluation, "الهدف"),
          assessmentQuality: parseCriterion(evaluation, "السؤال"),
          bloomsTaxonomy: parseCriterion(evaluation, "بلوم"),
          activeLearning: parseCriterion(evaluation, "التعلم"),
        },
        overallScore: null,
        recommendations: evaluation,
      });
    }),
  }),

  // ─── AI Generation ─────────────────────────────────────────
  ai: router({
    generateLesson: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      lessonId: z.number().optional(),
      situationId: z.number().optional(),
      title: z.string().min(1),
      subject: z.string(),
      gradeLevel: z.string(),
      unitTitle: z.string().optional(),
      unitNumber: z.number().optional(),
      lessonNumber: z.number().optional(),
      duration: z.string().optional(),
      contentType: z.enum(["lessonPlan", "activity", "homework", "classQuestions", "differentiation", "integrativeSituation"]),
      curriculumDocs: z.any().optional(),
      // Differentiation options
      enableDifferentiation: z.boolean().optional(),
      studentLevel: z.enum(["advanced", "average", "needs_support", "mixed"]).optional(),
      learningStyle: z.enum(["visual", "auditory", "kinesthetic", "mixed"]).optional(),
      bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
      activityType: z.enum(["group_work", "individual", "pair_work", "whole_class", "mixed"]).optional(),
      difficultyLevel: z.enum(["easy", "medium", "hard", "progressive"]).optional(),
      supportStrategy: z.enum(["scaffolding", "extension", "simplification", "enrichment", "none"]).optional(),
      teachingTemplateKey: z.enum(TEACHING_TEMPLATES.map(template => template.key) as [string, ...string[]]).optional(),
      llmModel: z.string().optional(),
      preferOfficialSituationTitle: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      // عند الانطلاق من وضعية في المخطط السنوي، تكون تسميتها الرسمية هي المرجع
      // ولا نعتمد النص الحر إلا في التوليد غير المرتبط بوضعية.
      let officialSituationTitle: string | undefined;
      let officialSituationObjectives: string | undefined;
      if (input.situationId) {
        try {
          const userSituations = await getLearningSituationsByUserId(ctx.user.id);
          const officialSituation = userSituations.find(situation => situation.id === input.situationId);
          if (officialSituation) {
            officialSituationTitle = officialSituation.title;
            officialSituationObjectives = officialSituation.objectives || undefined;
          }
        } catch {
          // يبقى النص الذي أدخله الأستاذ بديلاً آمناً إذا تعذر الوصول إلى السجل.
        }
      }
      const useOfficialSituationTitle = input.preferOfficialSituationTitle !== false;
      const canonicalTitle = useOfficialSituationTitle && officialSituationTitle ? officialSituationTitle : input.title;
      const canonicalSituationTitle = officialSituationTitle || input.unitTitle;

      // Build differentiation context
      const diffContext: string[] = [];
      if (input.enableDifferentiation) {
        if (input.studentLevel) {
          const levelLabels: Record<string, string> = {
            advanced: "متقدمين (أقوياء)",
            average: "متوسطين (عاديون)",
            needs_support: "يحتاجون دعماً إضافياً (ضعفاء)",
            mixed: "مختلطة المستويات",
          };
          diffContext.push(`- مستوى التلاميذ: ${levelLabels[input.studentLevel]}`);
        }
        if (input.learningStyle) {
          const styleLabels: Record<string, string> = {
            visual: "بصري",
            auditory: "سمعي",
            kinesthetic: "حركي",
            mixed: "متنوع",
          };
          diffContext.push(`- نمط التعلم المفضل: ${styleLabels[input.learningStyle]}`);
        }
        if (input.bloomLevel) {
          const bloomLabels: Record<string, string> = {
            remember: "تذكر (تصنيف بلوم)",
            understand: "فهم (تصنيف بلوم)",
            apply: "تطبيق (تصنيف بلوم)",
            analyze: "تحليل (تصنيف بلوم)",
            evaluate: "تقييم (تصنيف بلوم)",
            create: "إبداع (تصنيف بلوم)",
          };
          diffContext.push(`- مستوى تصنيف بلوم المستهدف: ${bloomLabels[input.bloomLevel]}`);
        }
        if (input.activityType) {
          const actLabels: Record<string, string> = {
            group_work: "عمل جماعي",
            individual: "عمل فردي",
            pair_work: "عمل ثنائي",
            whole_class: "عمل فوج كامل",
            mixed: "متنوع",
          };
          diffContext.push(`- نوع النشاط: ${actLabels[input.activityType]}`);
        }
        if (input.difficultyLevel) {
          const diffLabels: Record<string, string> = {
            easy: "سهل",
            medium: "متوسط",
            hard: "صعب",
            progressive: "تصاعدي (من السهل إلى الصعب)",
          };
          diffContext.push(`- مستوى الصعوبة: ${diffLabels[input.difficultyLevel]}`);
        }
        if (input.supportStrategy && input.supportStrategy !== "none") {
          const supLabels: Record<string, string> = {
            scaffolding: "سقالة تعليمية (دعم تدريجي)",
            extension: "توسيع وتعميق",
            simplification: "تبسيط وتبديل",
            enrichment: "إثراء",
          };
          diffContext.push(`- استراتيجية الدعم: ${supLabels[input.supportStrategy]}`);
        }
      }

      const diffBlock = diffContext.length > 0
        ? `

خيارات التفريد (تفريد التعليم):
${diffContext.join("\n")}

التزم بالخيارات أعلاه عند التوليد. إذا كان المستوى "مختلط" أو "متنوع"، قدّم تدرجاً في الصعوبة يناسب جميع المستويات.`
        : "";

      const teachingTemplate = input.contentType === "lessonPlan"
        ? getTeachingTemplate(input.teachingTemplateKey)
        : undefined;
      const templateBlock = teachingTemplate
        ? `

إطار الحصة التربوي المختار من الأستاذ: ${teachingTemplate.label}
الغرض من القالب: ${teachingTemplate.description}
مراحل التنفيذ المطلوبة بالترتيب:
${teachingTemplate.stages.map((stage, index) => `${index + 1}. ${stage}`).join("\n")}
ضابط القالب: ${teachingTemplate.promptGuidance}

استخدم هذه المراحل كبنية عملية للمذكرة، لا كعناوين شكلية فقط. يبقى عنوان الوضعية وكفاءتها ووثائق المنهاج المرجع الملزم؛ لا تغيّرها ولا تخترع مضامين منهاجية.`
        : "";

      // RAG: Retrieve relevant curriculum documents
      let curriculumContext = "";
      let curriculumCitations: Array<{ id: number; title: string; type: string; source: string }> = [];
      try {
        const docs = await getCurriculumForTopic(
          `${canonicalTitle} ${canonicalSituationTitle || ""} ${input.subject}`,
          input.gradeLevel,
          input.subject
        );
        if (docs.length > 0) {
          curriculumCitations = docs.map(d => ({
            id: d.id,
            title: d.title,
            type: d.type,
            source: d.sourceReference || "المنهاج الرسمي",
          }));
          const hasAnnualPlanReference = docs.some(d => d.type === "annualPlan");
          const referenceLabel = hasAnnualPlanReference
            ? "المخططات السنوية الرسمية والوثائق المنهجية المرتبطة"
            : "الوثائق المنهجية الرسمية المرتبطة";
          const docExcerpts = docs.map((d, i) =>
            `[${i + 1}] ${d.title} (${d.type} - ${d.gradeLevel}):
${d.content.substring(0, 300)}`
          ).join("\n\n");
          curriculumContext = `

${referenceLabel} (استخدمها كأساس للمحتوى):
${docExcerpts}

المخطط السنوي الرسمي مرجع منهجي ملزم يحدد الكفاءات والوضعيات والتدرج الزمني. لا تكتب أي تنبيه عن غياب المرجع الرسمي ما دام حاضرًا ضمن هذه المراجع.

استشهد بهذه الوثائق عند التوليد بالصيغة: [مرجع: ${docs.length > 0 ? docs[0].id : 0} — ${docs.length > 0 ? docs[0].title : "غير متوفر"}]`;
        } else {
          curriculumContext = "\n\nتنبيه: لم يتم العثور على وثائق منهاج رسمية مطابقة. صرّح بذلك صراحةً ولا تخترع معلومات منهاجية.";
        }
      } catch (e) {
        curriculumContext = "\n\nتنبيه: تعذر الوصول إلى قاعدة المنهاج.";
      }

      const prompts: Record<string, string> = {
        lessonPlan: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ خطة درس مفصلة ومبنية على المنهج الرسمي الجزائري.
بيانات الحصة:
- عنوان الدرس (الوضعية التعليمية): ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${canonicalSituationTitle ? `- الوضعية التعليمية: ${canonicalSituationTitle}` : ""}
${input.unitNumber ? `- رقم الوضعية في المقطع: ${input.unitNumber}` : ""}
${input.lessonNumber ? `- رقم الدرس: ${input.lessonNumber}` : ""}
${input.duration ? `- المدة: ${input.duration}` : ""}
${diffBlock}
${templateBlock}

${getLessonSessionContext()}

${AI_ROLE_PRINCIPLE}

استند دائماً إلى المنهاج الرسمي الجزائري ولا تخترع معلومة منهاجية.${curriculumContext}

كل مخرج مسودة قابلة للتعديل: الكفاءة والكفاءات والمقاطع من وثائق المنهاج فقط، وبقية الصياغة يراجعها الأستاذ قبل الاعتماد.${ARABIC_QA_RULES}`,

        activity: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ نشاط تعلم نشط.
- الموضوع: ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
- المدة: ${input.duration || "حصة واحدة"}
${diffBlock}

صمم نشاطاً تفاعلياً يحدد بوضوح العناصر التسعة: هدف واضح، تعليمة مباشرة، زمن محدد، تنظيم العمل، أدوار داخل المجموعة، منتج ملموس، معيار نجاح معلوم، طريقة عرض أو تصحيح سريع، وبديل قليل الوسائل. اختر استراتيجية واحدة من القائمة المعتمدة: فرز البطاقات، فكر ثم زاوج ثم شارك، الخريطة الصامتة، الخط الزمني، حقيبة الأدلة، محطات التعلم، الجيسكو، معرض مصغر، تحدي الأخطاء، تدريس الأقران، مناظرة مضبوطة، قضية مدنية. صمم لأقسام كبيرة من 40 إلى 45 تلميذاً ولا تفترض عارضاً أو إنترنتاً أو طباعة كثيرة.${curriculumContext}`,

        homework: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ واجباً منزلياً مناسباً.
- الموضوع: ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

أعِدّ تمارين متنوعة تشمل: أسئلة مباشرة، تحليل، وتطبيق عملي.${curriculumContext}`,

        classQuestions: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مجموعة أسئلة صفية.
- الموضوع: ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

قدم أسئلة متنوعة تشمل مستويات تصنيف بلوم المختلفة: تذكر، فهم، تطبيق، تحليل، تقييم، إبداع.${curriculumContext}`,

        differentiation: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ استراتيجيات تمييز.
- الموضوع: ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

قدم استراتيجيات تمايز لتناسب: الطلاب المتقدمين، الطلاب العاديين، الطلاب الذين يحتاجون دعماً إضافياً.${curriculumContext}`,

        integrativeSituation: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ وضعية إدماجية أصلية قابلة للتحرير والطباعة، مرتبطة بما دُرّس فعلياً ولا تضف محتوى خارج المرجع الرسمي.
- الوضعية التعليمية المرجعية: ${canonicalTitle}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
- المدة المقترحة: ${input.duration || "حصة واحدة"}

${AI_ROLE_PRINCIPLE}

ابنِ الوضعية في الأقسام التالية فقط: عنوان واضح، سياق قصير واقعي مناسب للمتعلمين، سند أو معطيات قابلة للاستعمال داخل القسم دون افتراض إنترنت أو طباعة كثيرة، تعليمة إدماجية واحدة دقيقة، مؤشرات إنجاز أو عناصر منتظرَة، ومعايير تقويم موجزة. اجعل المهمة تدعو إلى توظيف موارد الوضعية لا نسخها، وراعِ التدرج والوضوح والواقعية في قسم كبير. لا تكتب الكفاءة المستهدفة في وثيقة التلميذ، ولا تخترع معطيات منهاجية غير موجودة في المراجع.${ARABIC_QA_RULES}
${curriculumContext}`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: prompts[input.contentType] },
          { role: "user", content: "أنشئ المحتوى المطلوب بالتفصيل." },
        ],
        ...(input.llmModel ? { model: input.llmModel } : {}),
      });

      const content = getLLMTextContent(response);
      if (!content) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "تعذر توليد المحتوى لأن خدمة الذكاء الاصطناعي لم تُرجع محتوى صالحاً. حاول مجدداً بعد لحظات.",
        });
      }
      const typeLabels: Record<string, string> = {
        lessonPlan: "خطة درس",
        activity: "نشاط تعلم",
        homework: "واجب منزلي",
        classQuestions: "أسئلة صفية",
        differentiation: "استراتيجيات تمييز",
        integrativeSituation: "وضعية إدماجية",
      };

      if (input.lessonId && teachingTemplate) {
        const lesson = await getLessonById(input.lessonId);
        const existingTags = Array.isArray(lesson?.tags)
          ? lesson.tags.filter(tag => typeof tag !== "string" || !tag.startsWith("قالب تدريس:"))
          : [];
        await updateLesson(input.lessonId, {
          tags: [...existingTags, `قالب تدريس: ${teachingTemplate.label}`],
        } as any);
      }

      const result = await createAIResource({
        userId: ctx.user.id,
        lessonId: input.lessonId,
        classId: input.classId,
        // تُحفظ الوضعية الإدماجية ضمن نوع «نشاط» المتاح في النموذج الحالي،
        // وتُميّز في البيانات الوصفية حتى تبقى قابلة للتحرير والطباعة دون تغيير بنية القاعدة.
        type: input.contentType === "integrativeSituation" ? "activity" : input.contentType,
        title: canonicalTitle,
        content,
        metadata: {
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          situationId: input.situationId,
          officialSituationTitle,
          officialSituationObjectives,
          titleSource: officialSituationTitle && useOfficialSituationTitle ? "official_situation" : "teacher_edit",
          curriculumCitations,
          teachingTemplate: teachingTemplate ? {
            key: teachingTemplate.key,
            label: teachingTemplate.label,
            stages: teachingTemplate.stages,
          } : undefined,
          resourceKind: input.contentType === "integrativeSituation" ? "integrativeSituation" : undefined,
        },
        tags: [typeLabels[input.contentType], input.subject, input.gradeLevel, ...(teachingTemplate ? [`قالب تدريس: ${teachingTemplate.label}`] : [])],
        sourceDocumentIds: curriculumCitations.length > 0 ? curriculumCitations.map(c => c.id) : undefined,
      });

      return { resourceId: result?.id, content, curriculumCitations, teachingTemplate };
    }),

    generateAssessment: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      title: z.string().min(1),
      subject: z.string(),
      gradeLevel: z.string(),
      assessmentType: z.enum(["quiz", "exam", "rubric", "answerKey"]),
      topic: z.string(),
      duration: z.string().optional(),
      numQuestions: z.number().optional(),
      // Teacher OS integration fields
      lessonIds: z.array(z.number()).optional(),
      competencyIds: z.array(z.string()).optional(),
      autoImport: z.boolean().optional(),
      useNationalRules: z.boolean().optional().default(true),
      llmModel: z.string().optional(),
      situationIds: z.array(z.number()).optional(),
      preferOfficialSituationTitle: z.boolean().optional(),
      // وقت نهاية الاختبار (بالمللي ثانية) — يُستخدم لرمز QR نموذج الإجابات
      examEndsAt: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      // ─── Get Teacher OS data (completed lessons) ─────────────
      let completedLessons: { title: string; unitTitle?: string; unitNumber?: number; lessonNumber?: number; objectives?: string }[] = [];
      if (input.lessonIds && input.lessonIds.length > 0) {
        const allLessons = await getLessons(ctx.user.id);
        completedLessons = allLessons
          .filter(l => input.lessonIds!.includes(l.id) && l.isCompleted)
          .map(l => ({
            title: l.title,
            unitTitle: l.unitTitle || undefined,
            unitNumber: l.unitNumber || undefined,
            lessonNumber: l.lessonNumber || undefined,
            objectives: l.objectives || undefined,
          }));
      }

      // ─── Get completed situations (Teacher OS) ─────────────
      let completedSituations: { id: number; title: string; sectionTitle?: string; objectives?: string; competencies?: string; situationNumber?: number }[] = [];
      if (input.situationIds && input.situationIds.length > 0) {
        const allSituations = await getLearningSituationsByUserId(ctx.user.id);
        for (const s of allSituations) {
          if (input.situationIds!.includes(s.id)) {
            const section = await getAnnualPlanSectionById(s.sectionId);
            completedSituations.push({
              id: s.id,
              title: s.title,
              sectionTitle: section ? section.title : undefined,
              objectives: s.objectives || undefined,
              competencies: section?.competencies || undefined,
              situationNumber: s.situationNumber,
            });
          }
        }
      }
      // عنوان وضعية واحدة محددة هو العنوان الافتراضي للتقويم؛ وعند جمع وضعيات
      // متعددة يبقى العنوان الذي يحرره الأستاذ هو الأنسب لوصف التقويم الجامع.
      const officialSituationTitle = completedSituations.length === 1 ? completedSituations[0].title : undefined;
      const useOfficialSituationTitle = input.preferOfficialSituationTitle !== false;
      const canonicalAssessmentTitle = useOfficialSituationTitle && officialSituationTitle ? officialSituationTitle : input.title;
      const canonicalTopic = useOfficialSituationTitle && officialSituationTitle ? officialSituationTitle : input.topic;

      // ─── Retrieve curriculum knowledge base documents (RAG) ──
      const curriculumDocs = await getCurriculumForTopic(canonicalTopic, input.gradeLevel, input.subject);
      const curriculumContext = curriculumDocs.length > 0
        ? `=== وثائق المنهاج الرسمية (مرجع للاستشهاد) ===\n${curriculumDocs.map((doc, i) => `[${i + 1}] ${doc.title} (المصدر: ${doc.sourceReference || 'وثيقة المنهاج الرسمية'})${doc.lessonNumber ? ` — الدرس ${doc.lessonNumber}` : ''}\n    المحتوى: ${doc.content.substring(0, 300)}...`).join("\n\n")}\n\nتعليمات الاستشهاد الصارمة: يجب ربط كل سؤال بوثيقة المنهاج الرسمية ذات الصلة من القائمة أعلاه. بعد كل سؤال ضع الاستشهاد بالصيغة التالية:\n[مرجع: رقم الوثيقة — عنوان الوثيقة — المقطع]\nمثال: [مرجع: 1 — وثيقة المنهاج السنة الرابعة — المقطع الثاني: التاريخ الوطني — درس الثورة الجزائرية]\nلا تضف أسئلة لا يمكن ربطها بوثيقة منهاج رسمية.`
        : "لا توجد وثائق منهاج مطابقة في قاعدة المعرفة. أنشئ الأسئلة بناءً على الموضوع المطلوب فقط.";

      // ─── Build rules context ─────────────────────────────────
      const rule = input.useNationalRules ? getAssessmentRule(input.gradeLevel, input.subject) : undefined;
      const examHeader = rule ? getExamHeader(input.gradeLevel, input.subject) : "";
      const rulesContext = rule ? buildAssessmentContext({
        gradeLevel: input.gradeLevel,
        subject: input.subject,
        completedLessons,
        completedSituations,
        selectedCompetencies: input.competencyIds,
        autoImport: input.autoImport,
      }) : "";

      // ─── Generate prompts with rules integration ─────────────
      const prompts: Record<string, string> = {
        quiz: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ اختباراً قصيراً.

${curriculumContext}

${rulesContext}

- الموضوع: ${canonicalTopic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${input.numQuestions ? `- عدد الأسئلة: ${input.numQuestions}` : "- 10 أسئلة متنوعة"}
${input.duration ? `- المدة: ${input.duration}` : (rule ? `- المدة: ${rule.duration}` : "")}

${rule ? `توزيع النقاط: ${rule.weights.map(w => `${w.label}: ${w.points} نقطة`).join("، ")}` : ""}

قدم أسئلة متنوعة مع ربط كل سؤال بالكفاءة التي يقيسها. ابدأ بالجزء الأول: ${examHeader}

قدم أسئلة متنوعة مع مفتاح إجابات.`,

        exam: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ امتحاناً فصلياً رسمياً.

${curriculumContext}

${rulesContext}

- الموضوع: ${canonicalTopic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${input.numQuestions ? `- عدد الأسئلة: ${input.numQuestions}` : "- 5 أسئلة مقالية متنوعة"}
${input.duration ? `- المدة: ${input.duration}` : (rule ? `- المدة: ${rule.duration}` : "")}

${rule ? `توزيع النقاط الرسمي:
${rule.weights.map(w => `- ${w.label}: ${w.points} نقطة (${((w.points / rule.totalPoints) * 100).toFixed(0)}%)`).join("\n")}` : ""}

اكتب الاختبار كاملاً مع:
1. ترويسة رسمية بالمستوى والمادة والمدة
2. أسئلة مرتبة حسب توزيع النقاط
3. ربط كل سؤال بالكفاءة التي يقيسها
4. سلم التنقيط التفصيلي
5. نموذج الإجابة

ابدأ بـ: ${examHeader}

قدم الامتحان مع مفتاح الإجابات ونظام التنقيط.`,

        rubric: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ معايير تقييم.

${curriculumContext}

${rulesContext}

- الموضوع: ${canonicalTopic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم شبكة تقييم (Rubric) مفصلة مع معايير ومؤشرات ومستويات أداء.`,

        answerKey: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مفتاح إجابات مفصل.

${curriculumContext}

${rulesContext}

- الموضوع: ${canonicalTopic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم إجابات نموذجية مع شرح مفصل لكل إجابة.`,
      };

      const response = await invokeLLM({
        ...(input.llmModel ? { model: input.llmModel } : {}),
        messages: [
          { role: "system", content: prompts[input.assessmentType] },
          { role: "user", content: "أنشئ التقويم المطلوب بالتفصيل." },
        ],
      });

      const typeLabels: Record<string, string> = {
        quiz: "اختبار قصير",
        exam: "امتحان",
        rubric: "معايير تقييم",
        answerKey: "مفتاح إجابات",
      };

      const content = getLLMTextContent(response);
      if (!content) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `تعذر توليد ${typeLabels[input.assessmentType] ?? "المحتوى"} لأن خدمة الذكاء الاصطناعي لم تُرجع محتوى صالحاً. حاول مجدداً بعد لحظات.`,
        });
      }

      // Build metadata with rules engine info
      // Build curriculum citations from retrieved docs
      const curriculumCitations = curriculumDocs.map((doc, i) => ({
        referenceNumber: i + 1,
        docId: doc.id,
        title: doc.title,
        sourceReference: doc.sourceReference || 'وثيقة المنهاج الرسمية',
        type: doc.type,
        unitNumber: doc.unitNumber,
        lessonNumber: doc.lessonNumber,
      }));

      const metadata: Record<string, unknown> = {
        subject: input.subject,
        gradeLevel: input.gradeLevel,
        topic: canonicalTopic,
        situationIds: completedSituations.map(situation => situation.id),
        officialSituationTitles: completedSituations.map(situation => situation.title),
        titleSource: officialSituationTitle && useOfficialSituationTitle ? "official_situation" : "teacher_edit",
        useNationalRules: input.useNationalRules,
        completedLessonIds: input.lessonIds || [],
        competencyIds: input.competencyIds || [],
        curriculumCitations,
        curriculumDocsCount: curriculumDocs.length,
      };

      if (rule) {
        metadata.totalPoints = rule.totalPoints;
        metadata.duration = rule.duration;
        metadata.examType = rule.examType;
        metadata.pointDistribution = rule.weights;
        metadata.numQuestions = input.numQuestions || rule.maxQuestions;
        const structure = getExamStructure(input.gradeLevel, input.subject);
        if (structure) metadata.examStructure = structure;
      }

      const result = await createAIResource({
        userId: ctx.user.id,
        classId: input.classId,
        type: input.assessmentType,
        title: canonicalAssessmentTitle,
        subject: input.subject,
        gradeLevel: input.gradeLevel,
        content,
        metadata,
        tags: [typeLabels[input.assessmentType], input.subject, input.gradeLevel, ...(input.useNationalRules ? ["تقويم وطني"] : [])],
      } as any);

      // حفظ وقت نهاية الاختبار إذا حُدِّد (لرمز QR نموذج الإجابات المشفّر بالوقت)
      if (result?.id && input.examEndsAt) {
        await updateAIResource(result.id, { examEndsAt: input.examEndsAt } as any);
      }

      return { resourceId: result?.id, content, title: canonicalAssessmentTitle, topic: canonicalTopic, rulesApplied: !!rule, pointDistribution: rule?.weights || [], totalPoints: rule?.totalPoints || 20, duration: rule?.duration || "غير محدد", curriculumCitations, curriculumDocsCount: curriculumDocs.length };
    }),

    /**
     * يعيد مصدر LaTeX آمناً ومهجأً فقط. لا يجري الخادم أي عملية تجميع أو تنفيذ
     * لمحتوى الأستاذ أو لمخرجات الذكاء الاصطناعي؛ التنزيل يتيح للأستاذ الطباعة
     * عالية الدقة لاحقاً عبر XeLaTeX أو Overleaf.
     */
    exportAssessmentLatex: protectedProcedure.input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(100_000),
      subject: z.string().min(1).max(80),
      gradeLevel: z.string().min(1).max(80),
      assessmentType: z.enum(["quiz", "exam", "rubric", "answerKey"]),
      printTheme: z.enum(["nibras", "official", "mono"]).optional(),
      topic: z.string().max(300).optional(),
      duration: z.string().max(80).optional(),
      totalPoints: z.number().positive().max(100).optional(),
      teacherName: z.string().max(160).optional(),
      school: z.string().max(200).optional(),
      className: z.string().max(80).optional(),
      assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).strict()).mutation(({ input }) => {
      const texContent = buildAssessmentLatexDocument(input);
      const datePart = input.assessmentDate || new Date().toISOString().slice(0, 10);
      return {
        filename: `nibras-assessment-${datePart}.tex`,
        texContent,
        compiler: "xelatex" as const,
      };
    }),

    /**
     * يعيد ملف PDF جاهزاً للطباعة من القالب العربي. يعمل التجميع داخل الخادم
     * فقط؛ لا يحتاج الأستاذ إلى تثبيت LaTeX أو فتح ملف مصدر.
     */
    exportAssessmentPdf: protectedProcedure.input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(100_000),
      subject: z.string().min(1).max(80),
      gradeLevel: z.string().min(1).max(80),
      assessmentType: z.enum(["quiz", "exam", "rubric", "answerKey"]),
      printTheme: z.enum(["nibras", "official", "mono"]).optional(),
      topic: z.string().max(300).optional(),
      duration: z.string().max(80).optional(),
      totalPoints: z.number().positive().max(100).optional(),
      teacherName: z.string().max(160).optional(),
      school: z.string().max(200).optional(),
      className: z.string().max(80).optional(),
      assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).strict()).mutation(async ({ input }) => {
      try {
        const texContent = buildAssessmentLatexDocument(input);
        const pdfBuffer = await compileLatexToPdf(texContent);
        const datePart = input.assessmentDate || new Date().toISOString().slice(0, 10);
        const kind = input.assessmentType === "answerKey" ? "answer-key" : "assessment";
        return {
          filename: `nibras-${kind}-${datePart}.pdf`,
          pdfBase64: pdfBuffer.toString("base64"),
          mimeType: "application/pdf" as const,
        };
      } catch (error) {
        if (error instanceof LatexCompilationError) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: error.message });
        }
        throw error;
      }
    }),

    /**
     * يعيد مصدر LaTeX للمذكرة البيداغوجية من القالب العربي.
     */
    exportLessonPlanTex: protectedProcedure.input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(100_000),
      subject: z.string().max(80).optional(),
      gradeLevel: z.string().max(80).optional(),
      printTheme: z.enum(["nibras", "official", "mono"]).optional(),
      unitTitle: z.string().max(300).optional(),
      duration: z.string().max(80).optional(),
      date: z.string().max(30).optional(),
      academicYear: z.string().max(20).optional(),
      teacherName: z.string().max(160).optional(),
      school: z.string().max(200).optional(),
      province: z.string().max(120).optional(),
      className: z.string().max(80).optional(),
      objectives: z.string().max(2000).optional(),
      lessonNumber: z.number().positive().max(99).optional(),
      unitNumber: z.number().positive().max(99).optional(),
      serialNumber: z.string().max(32).optional(),
      isClassroomPlan: z.boolean().optional(),
    }).strict()).mutation(({ input }) => {
      const texContent = buildLessonPlanLatexDocument(input);
      const datePart = input.date || new Date().toISOString().slice(0, 10);
      return {
        filename: `nibras-lesson-plan-${datePart}.tex`,
        texContent,
        compiler: "xelatex" as const,
      };
    }),

    /**
     * يعيد ملف PDF جاهزاً للطباعة من قالب المذكرة العربية.
     */
    exportLessonPlanPdf: protectedProcedure.input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(100_000),
      subject: z.string().max(80).optional(),
      gradeLevel: z.string().max(80).optional(),
      printTheme: z.enum(["nibras", "official", "mono"]).optional(),
      unitTitle: z.string().max(300).optional(),
      duration: z.string().max(80).optional(),
      date: z.string().max(30).optional(),
      academicYear: z.string().max(20).optional(),
      teacherName: z.string().max(160).optional(),
      school: z.string().max(200).optional(),
      province: z.string().max(120).optional(),
      className: z.string().max(80).optional(),
      objectives: z.string().max(2000).optional(),
      lessonNumber: z.number().positive().max(99).optional(),
      unitNumber: z.number().positive().max(99).optional(),
      serialNumber: z.string().max(32).optional(),
      isClassroomPlan: z.boolean().optional(),
    }).strict()).mutation(async ({ input }) => {
      try {
        const texContent = buildLessonPlanLatexDocument(input);
        const pdfBuffer = await compileLatexToPdf(texContent);
        const datePart = input.date || new Date().toISOString().slice(0, 10);
        return {
          filename: `nibras-lesson-plan-${datePart}.pdf`,
          pdfBase64: pdfBuffer.toString("base64"),
          mimeType: "application/pdf" as const,
        };
      } catch (error) {
        if (error instanceof LatexCompilationError) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: error.message });
        }
        throw error;
      }
    }),

    // ─── National Rules API ────────────────────────────────────
    getAssessmentRules: protectedProcedure.input(z.object({
      gradeLevel: z.string().optional(),
      subject: z.string().optional(),
    })).query(({ input }) => {
      if (input.gradeLevel && input.subject) {
        const rule = getAssessmentRule(input.gradeLevel, input.subject);
        return rule ? [rule] : [];
      }
      return getAllRules();
    }),

    getCompetencyCategories: protectedProcedure.query(() => {
      return COMPETENCY_CATEGORIES;
    }),

    weeklyReadinessSummary: protectedProcedure.query(async ({ ctx }) => {
      // تلخيص جاهزية الأسبوع القادم: الوضعية التالية والحصص المتبقية لكل قسم،
      // دون الحاجة لاختيار قسم — واجهة الصفحة الرئيسية تعرضه تلقائياً.
      const resolvedYear = await getActiveAcademicYear();
      const schedule = resolvedYear ? await getWeeklyScheduleEntries(ctx.user.id, resolvedYear) : [];
      const lessons = await getLessons(ctx.user.id);
      const classPlans = await getAnnualPlans(ctx.user.id, resolvedYear ? { academicYear: resolvedYear } : undefined);
      const situations: { id: number; situationNumber: number; title: string; isCompleted: boolean; sessionStatus: string | null }[] = [];
      for (const plan of classPlans) {
        const sections = (await getAnnualPlanSections(plan.id)) ?? [];
        for (const section of sections) {
          for (const situation of (await getLearningSituations(section.id)) ?? []) {
            situations.push({
              id: situation.id,
              situationNumber: situation.situationNumber,
              title: situation.title,
              isCompleted: situation.isCompleted,
              sessionStatus: situation.sessionStatus ?? null,
            });
          }
        }
      }
      return buildWeeklyReadiness(
        schedule,
        lessons.map((lesson) => ({
          id: lesson.id,
          classId: lesson.classId ?? null,
          subject: lesson.subject ?? null,
          situationId: null,
          situationTitle: null,
          isCompleted: lesson.isCompleted,
        })),
        situations,
      );
    }),

    getTeacherOSContext: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      gradeLevel: z.string().optional(),
      subject: z.string().optional(),
      academicYear: z.string().min(4).max(16).optional(),
    })).query(async ({ ctx, input }) => {
      // عند عدم تحديد السنة صراحة، نشتقها من الموسم المفعّل في النظام حتى لو كان ملف الأستاذ
      // غير محدّث بها — فلا يعتمد سياق الأستاذ على إدخال يدوي متكرر.
      const resolvedYear = input.academicYear || (await getActiveAcademicYear());
      const planFilters = resolvedYear ? { academicYear: resolvedYear } : undefined;
      // Auto-import: get completed lessons from Teacher OS
      const lessons = await getLessons(ctx.user.id, {
        classId: input.classId,
        isCompleted: true,
      });

      // Auto-derive competencies from completed lessons' objectives
      const coveredCompetencies: string[] = [];
      const lessonSummaries = lessons.map(l => ({
        id: l.id,
        title: l.title,
        unitTitle: l.unitTitle || undefined,
        unitNumber: l.unitNumber || undefined,
        lessonNumber: l.lessonNumber || undefined,
        objectives: l.objectives || undefined,
        date: l.date?.toISOString() || undefined,
      }));

      // Derive competencies from completed lesson objectives
      if (input.gradeLevel && input.subject) {
        const applicableCompetencies = COMPETENCY_CATEGORIES.filter(c =>
          c.applicableSubjects.some(s => input.subject!.includes(s) || s.includes(input.subject!))
        );

        // Auto-derive: if lessons have objectives, match them to competencies
        const allObjectives = lessons.map(l => l.objectives || "").join(" ");
        applicableCompetencies.forEach(c => {
          // Match competency to lesson objectives via keyword matching
          const matched = c.bloomLevels.some(bloom => allObjectives.includes(bloom)) ||
                          c.bloomLevels.length > 0; // Include all applicable competencies if lessons exist
          if (matched || lessons.length > 0) {
            coveredCompetencies.push(c.name);
          }
        });

        // If no competencies matched but lessons exist, include all applicable
        if (coveredCompetencies.length === 0 && lessons.length > 0) {
          applicableCompetencies.forEach(c => coveredCompetencies.push(c.name));
        }
      }

      // Get sections and situations for the class
      let currentSection = null;
      let nextSituation = null;
      let completedSituations = 0;
      let totalSituations = 0;
      let currentSectionProgress = { completed: 0, total: 0 };
      let sectionProgressDetailed: { id: number; sectionNumber: number; title: string; total: number; completed: number; percent: number; lastCompletedDate?: string }[] = [];
      let annualProgressPercent = 0;
      try {
        if (input.classId) {
          const plans = await getAnnualPlans(ctx.user.id, planFilters);
          let classPlan = plans.find(p => p.classId === input.classId && (!input.subject || p.subject === input.subject));
          // عند تعذر مطابقة المادة صراحة (المخطط موزع على عدة خطط حسب المادة)، نستخدم أي
          // خطة للقسم حتى لا يفقد الأستاذ سياق إنجازاته — فلا يضطر لإعادة إدخال المادة.
          if (!classPlan) classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            const sections = (await getAnnualPlanSections(classPlan.id)) ?? [];
            const sectionProgressList: { id: number; sectionNumber: number; title: string; total: number; completed: number; percent: number; lastCompletedDate?: string }[] = [];
            for (const section of sections) {
              const situations = (await getLearningSituations(section.id)) ?? [];
              const completed = situations.filter(s => s.isCompleted);
              const completedCount = completed.length;
              totalSituations += situations.length;
              completedSituations += completedCount;
              const lastCompleted = completed.sort((a, b) =>
                ((b.completedDate?.getTime() ?? 0) - (a.completedDate?.getTime() ?? 0)))[0];
              sectionProgressList.push({
                id: section.id,
                sectionNumber: section.sectionNumber,
                title: section.title,
                total: situations.length,
                completed: completedCount,
                percent: situations.length > 0 ? Math.round((completedCount / situations.length) * 100) : 0,
                lastCompletedDate: lastCompleted?.completedDate?.toISOString(),
              });
              const firstIncomplete = situations.find(s => !s.isCompleted);
              // الحصة اليومية تُفتح على أول مقطع يحوي وضعية لم تُنجز فعلاً،
              // لا على أول مقطع في الخطة مهما كان تقدمه.
              if (!currentSection && firstIncomplete) {
                currentSection = { id: section.id, number: section.sectionNumber, title: section.title, isCompleted: section.isCompleted };
                currentSectionProgress = { completed: completedCount, total: situations.length };
                nextSituation = {
                  id: firstIncomplete.id,
                  title: firstIncomplete.title,
                  sectionNumber: section.sectionNumber,
                  situationNumber: firstIncomplete.situationNumber,
                  sessionStatus: firstIncomplete.sessionStatus ?? null,
                  completionNotes: firstIncomplete.completionNotes ?? null,
                };
              }
            }
            // عند اكتمال الخطة نُبقي آخر مقطع ظاهرًا كملخص، بدل إخفاء سياق الأستاذ بالكامل.
            if (!currentSection && sections.length > 0) {
              const lastSection = sections[sections.length - 1];
              currentSection = {
                id: lastSection.id,
                number: lastSection.sectionNumber,
                title: lastSection.title,
                isCompleted: lastSection.isCompleted,
              };
              const lastProgress = sectionProgressList[sectionProgressList.length - 1];
              currentSectionProgress = lastProgress
                ? { completed: lastProgress.completed, total: lastProgress.total }
                : currentSectionProgress;
            }
            sectionProgressDetailed = sectionProgressList;
            annualProgressPercent = totalSituations > 0 ? Math.round((completedSituations / totalSituations) * 100) : 0;
          }
        }
      } catch (e) { /* sections not yet configured */ }

      // دفتر المتابعة: مؤشّر الرزنامة — مقارنة التقدم الفعلي بالزمن المنقضي منذ بداية التدريس
      let schedulePace: { status: 'ahead' | 'on_track' | 'behind' | 'not_started'; elapsedWeeks: number; expectedPercent: number; actualPercent: number; note: string } | null = null;
      try {
        if (input.classId && totalSituations > 0) {
          const plans = await getAnnualPlans(ctx.user.id, planFilters);
          let classPlan = plans.find(p => p.classId === input.classId && (!input.subject || p.subject === input.subject));
          if (!classPlan) classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            // لا نربط متابعة الأستاذ بسنة جامدة: بداية التدريس تُشتق من موسم الخطة نفسه.
            // المرجع الحالي للتدرج المعتمد هو أول اثنين من أكتوبر، مع الإبقاء على المؤشر
            // تقديرياً إلى أن تتوفر رزنامة رسمية مفصلة قابلة للحفظ في النظام.
            const startYearMatch = classPlan.academicYear?.match(/^(\d{4})/);
            const startYear = startYearMatch ? Number(startYearMatch[1]) : NaN;
            if (!Number.isFinite(startYear)) {
              throw new Error("Academic year is unavailable for pace estimate");
            }
            const octoberFirst = new Date(Date.UTC(startYear, 9, 1));
            const daysToMonday = (8 - octoberFirst.getUTCDay()) % 7;
            const termStart = new Date(Date.UTC(startYear, 9, 1 + daysToMonday));
            const now = new Date();
            const elapsedMs = Math.max(0, now.getTime() - termStart.getTime());
            const elapsedWeeks = Math.floor(elapsedMs / (7 * 24 * 3600 * 1000));
            // تقدير متحفظ: متوسط أسبوعين لكل وضعية تعليمية (شامل الإدماج الكلي والتقويم)
            const expectedSituations = Math.min(totalSituations, Math.max(0, elapsedWeeks / 2));
            const expectedPercent = Math.round((expectedSituations / totalSituations) * 100);
            // منطق الحالات:
            // 1) لا إنجاز ولا تقدم متوقع (قبل بداية التدريس أو بدايتها) → «في الانتظار» وليس «منتظم»
            // 2) لا إنجاز مع تقدم متوقع → «لم يبدأ بعد» (تنبيه مهذب قبل تصنيفه متأخرًا)
            // 3) بقية الحالات مقارنة بالرزنامة (متقدم/منتظم/متأخر)
            const hasStarted = annualProgressPercent > 0;
            const status = !hasStarted && expectedPercent > 0 ? 'not_started'
              : annualProgressPercent >= expectedPercent + 15 ? 'ahead'
              : annualProgressPercent >= expectedPercent - 15 ? 'on_track'
              : 'behind';
            const note = status === 'ahead' ? 'التقدم أسرع من الرزنامة التقديرية — يمكن تخصيص وقت للمراجعة أو الإثراء.'
              : status === 'on_track' ? 'التقدم منتظم مقارنة بالرزنامة التقديرية.'
              : status === 'behind'
                ? 'التقدم أبطأ من الرزنامة التقديرية — راجع وتيرة الحصص أو مدد الوضعيات.'
                : 'لم تُسجَّل بعدُ أي وضعية منجزة بينما الرزنامة التقديرية تنتظر تقدمًا — ابدأ بتسجيل إنجازات الوضعيات المنجزة فعليًا.';
            schedulePace = { status, elapsedWeeks, expectedPercent, actualPercent: annualProgressPercent, note };
          }
        }
      } catch (e) { /* schedule estimate not available yet */ }

      // Collect completed situations with details
      const completedSituationsList: any[] = [];
      try {
        if (input.classId) {
          const plans = await getAnnualPlans(ctx.user.id, planFilters);
          let classPlan = plans.find(p => p.classId === input.classId && (!input.subject || p.subject === input.subject));
          if (!classPlan) classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            const sections = (await getAnnualPlanSections(classPlan.id)) ?? [];
            for (const section of sections) {
              const situations = (await getLearningSituations(section.id)) ?? [];
              for (const s of situations) {
                if (s.isCompleted) {
                  completedSituationsList.push({
                    id: s.id,
                    sectionTitle: section.title,
                    sectionNumber: section.sectionNumber,
                    situationNumber: s.situationNumber,
                    title: s.title,
                    objectives: s.objectives || undefined,
                    completedDate: s.completedDate?.toISOString(),
                  });
                }
              }
            }
          }
        }
      } catch (e) { /* no sections configured */ console.error("[nibras] completedSituationsList failed:", e); }
      // تعرض بطاقة العلاج أحدث وضعية منجزة أولاً حتى يكون عنوانها الافتراضي
      // هو العنوان الرسمي الأقرب للتقويم الذي حلّله الأستاذ.
      completedSituationsList.sort((a, b) =>
        (new Date(b.completedDate || 0).getTime()) - (new Date(a.completedDate || 0).getTime())
      );
      return {
        completedLessons: lessonSummaries,
        completedSituations: completedSituationsList,
        totalCompleted: lessonSummaries.length,
        competencies: coveredCompetencies,
        currentSection,
        nextSituation,
        sectionProgress: { completed: completedSituations, total: totalSituations },
        currentSectionProgress,
        sectionProgressDetailed,
        annualProgressPercent,
        schedulePace,
      };
    }),

    searchCurriculum: protectedProcedure.input(z.object({
      query: z.string().min(1),
      gradeLevel: z.string().optional(),
      subject: z.string().optional(),
    })).mutation(async ({ input }) => {
      const docs = await getCurriculumDocuments({
        search: input.query,
        gradeLevel: input.gradeLevel,
        subject: input.subject,
      });
      return docs;
    }),
  }),

  // ─── Annual Plan Sections ──────────────────────────────────
  sections: router({
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getAnnualPlanSectionById(input.id);
    }),
    list: protectedProcedure.input(z.object({ annualPlanId: z.number() })).query(async ({ input }) => {
      const sections = await getAnnualPlanSections(input.annualPlanId);
      // Include situations for each section
      const withSituations = await Promise.all(sections.map(async (s) => {
        const situations = await getLearningSituations(s.id);
        return { ...s, situations };
      }));
      return withSituations;
    }),
    create: protectedProcedure.input(z.object({
      annualPlanId: z.number(),
      sectionNumber: z.number(),
      title: z.string(),
      duration: z.string().optional(),
      competencies: z.string().optional(),
      objectives: z.string().optional(),
      resources: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const plan = await getAnnualPlanById(input.annualPlanId);
      if (!plan || plan.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الخطة غير موجودة" });
      }
      if (plan.isReference) {
        throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن إضافة مقطع إلى المخطط المرجعي" });
      }
      return await createAnnualPlanSection({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      duration: z.string().optional(),
      competencies: z.string().optional(),
      objectives: z.string().optional(),
      resources: z.string().optional(),
      isCompleted: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      await requireEditableSection(input.id, ctx.user.id);
      await updateAnnualPlanSection(input.id, input);
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await requireEditableSection(input.id, ctx.user.id);
      await deleteAnnualPlanSection(input.id);
      return { success: true } as const;
    }),
    createLessonFromSituation: protectedProcedure.input(z.object({
      situationId: z.number(),
      classId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const allSituations = await getLearningSituationsByUserId(ctx.user.id);
      const situation = allSituations.find(s => s.id === input.situationId);
      if (!situation) throw new TRPCError({ code: "NOT_FOUND", message: "الوضعية غير موجودة" });

      const section = await getAnnualPlanSectionById(situation.sectionId);

      let gradeLevel = "";
      let subject = "التاريخ والجغرافيا";
      if (input.classId) {
        const cls = await getClassById(input.classId);
        if (cls) {
          gradeLevel = cls.gradeLevel || "";
          subject = cls.subject || subject;
        }
      }

      const lesson = await createLesson({
        userId: ctx.user.id,
        classId: input.classId,
        title: `مذكرة: ${situation.title}`,
        subject,
        gradeLevel,
        unitTitle: section?.title || "",
        objectives: situation.objectives || "",
        content: situation.content || "",
        plan: situation.content || "",
        tags: JSON.stringify({ sourceSituation: situation.id, sourceSection: situation.sectionId }),
      } as any);

      return lesson;
    }),
  }),

  // ─── Learning Situations ───────────────────────────────────
  situations: router({
    list: protectedProcedure.input(z.object({ sectionId: z.number() })).query(async ({ input }) => {
      return await getLearningSituations(input.sectionId);
    }),
    // كل الوضعيات المعلقة للمستخدم (لبطاقة «الدروس المعلقة» في لوحة التحكم)
    listPending: protectedProcedure.query(async ({ ctx }) => {
      return await getPendingOperationalLearningSituationsByUserId(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getLearningSituationById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      sectionId: z.number(),
      situationNumber: z.number(),
      title: z.string(),
      objectives: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await requireEditableSection(input.sectionId, ctx.user.id);
      return await createLearningSituation({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      objectives: z.string().optional(),
      content: z.string().optional(),
      isCompleted: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      await requireEditableSituation(input.id, ctx.user.id);
      await updateLearningSituation(input.id, input);
      return { success: true } as const;
    }),
    toggleCompleted: protectedProcedure.input(z.object({ id: z.number(), isCompleted: z.boolean() })).mutation(async ({ ctx, input }) => {
      const situation = await requireEditableSituation(input.id, ctx.user.id);
      await toggleLearningSituationCompleted(situation.id, input.isCompleted, undefined, input.isCompleted ? "completed" : null);
      return { success: true } as const;
    }),
    completeSession: protectedProcedure.input(z.object({
      situationId: z.number(),
      note: z.string().trim().max(3000).optional(),
      sessionStatus: z.enum(["completed", "partial", "postponed", "cancelled"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const situation = await requireEditableSituation(input.situationId, ctx.user.id);

      const sessionStatus = input.sessionStatus ?? "completed";
      const isCompleted = sessionStatus === "completed";
      await toggleLearningSituationCompleted(situation.id, isCompleted, input.note, sessionStatus);
      if (input.note) {
        await createTeachingNote({
          userId: ctx.user.id,
          title: `ملاحظة حصة: ${situation.title}`,
          content: input.note,
          noteType: "session_reflection",
        } as any);
      }
      return { success: true, noteSaved: Boolean(input.note), sessionStatus, isCompleted } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await requireEditableSituation(input.id, ctx.user.id);
      await deleteLearningSituation(input.id);
      return { success: true } as const;
    }),
  }),

  // ─── Assessment Results ────────────────────────────────────
  results: router({
    list: protectedProcedure.input(z.object({ classId: z.number() })).query(async ({ ctx, input }) => {
      return await getAssessmentResults(ctx.user.id, { classId: input.classId });
    }),
    create: protectedProcedure.input(z.object({
      classId: z.number(),
      resourceId: z.number().optional(),
      title: z.string(),
      date: z.date().optional(),
      totalStudents: z.number(),
      participatedStudents: z.number().optional(),
      averageScore: z.number().optional(),
      passedCount: z.number().optional(),
      historyAverage: z.number().optional(),
      geographyAverage: z.number().optional(),
      domainScores: z.record(z.string(), z.number()).optional(),
      competencyMastery: z.record(z.string(), z.number()).optional(),
      weakAreas: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createAssessmentResult({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      totalStudents: z.number().optional(),
      participatedStudents: z.number().optional(),
      averageScore: z.number().optional(),
      passedCount: z.number().optional(),
      historyAverage: z.number().optional(),
      geographyAverage: z.number().optional(),
      domainScores: z.record(z.string(), z.number()).optional(),
      competencyMastery: z.record(z.string(), z.number()).optional(),
      weakAreas: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await updateAssessmentResult(input.id, input);
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteAssessmentResult(input.id);
      return { success: true } as const;
    }),
    analyze: protectedProcedure.input(z.object({ classId: z.number() })).query(async ({ ctx, input }) => {
      const results = await getAssessmentResults(ctx.user.id, { classId: input.classId });
      if (results.length === 0) return { totalAssessments: 0, weakDomains: [], weakDomainDetails: [], suggestions: [] };

      /** تحويل مفتاح محور خام (رقمي أو عربي) إلى تسمية مقروءة للأستاذ */
      function normalizeDomainLabel(raw: string): string {
        const trimmed = raw.trim();
        if (!trimmed) return raw;
        const num = Number(trimmed);
        if (!Number.isNaN(num)) return `المحور ${trimmed}`;
        return trimmed;
      }

      // Calculate averages across all assessments
      const avgHistory = results.reduce((sum, r) => sum + (r.historyAverage || 0), 0) / results.length;
      const avgGeography = results.reduce((sum, r) => sum + (r.geographyAverage || 0), 0) / results.length;
      const overallAvg = results.reduce((sum, r) => sum + (r.averageScore || 0), 0) / results.length;

      // Identify weak domains
      const weakDomains: string[] = [];
      if (avgHistory < 10) weakDomains.push("التاريخ");
      if (avgGeography < 10) weakDomains.push("الجغرافيا");

      // Aggregate domain scores
      const domainAverages: Record<string, number[]> = {};
      results.forEach(r => {
        const scores = r.domainScores as Record<string, number> | null;
        if (scores) {
          Object.entries(scores).forEach(([domain, score]) => {
            const label = normalizeDomainLabel(domain);
            if (!domainAverages[label]) domainAverages[label] = [];
            domainAverages[label].push(score);
          });
        }
      });

      // Find weak domains (< 10) — with meaningful labels instead of raw numeric keys
      Object.entries(domainAverages).forEach(([label, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < 10 && !weakDomains.includes(label)) weakDomains.push(label);
      });

      // Capture the weakest labeled domains (with averages) for pedagogical reporting.
      // When a subject-level domain (التاريخ/الجغرافيا) has no fine-grained domainScores,
      // fall back to the recorded subject average so the badge never shows "0 نقطة".
      const weakDomainDetails = weakDomains
        .map(label => {
          const scores = domainAverages[label];
          if (scores && scores.length > 0) {
            return { label, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 };
          }
          const subjectAvg =
            label === "التاريخ"
              ? results.reduce((s, r) => s + (r.historyAverage ?? 0), 0) / results.length
              : label === "الجغرافيا"
                ? results.reduce((s, r) => s + (r.geographyAverage ?? 0), 0) / results.length
                : undefined;
          if (subjectAvg !== undefined) {
            return { label, avg: Math.round(subjectAvg * 100) / 100 };
          }
          return { label, avg: 0 };
        })
        .sort((a, b) => a.avg - b.avg);

      // Generate suggestions based on weak areas
      const suggestions: string[] = [];
      if (weakDomains.includes("التاريخ")) suggestions.push("مراجعة مفهوم الزمن التاريخي وأساليب تحليل الوثائق التاريخية");
      if (weakDomains.includes("الجغرافيا")) suggestions.push("تعزيز مهارات قراءة الخرائط والتحليل الجغرافي");
      if (weakDomains.length > 0) {
        suggestions.push("تنظيم حصص دعم علاجية مركزة على المجالات الضعيفة");
        suggestions.push("إعادة تدريس الوضعيات التعليمية ذات الصلة بأنشطة تفاعلية");
      }
      if (overallAvg >= 10) suggestions.push("مواصلة تعزيز المكتسبات مع إثراء للمتفوقين");

      // دمج مواطن الضعف النصية المسجلة يدويًا في تسجيل النتائج (تحليل النوع والوضعيات)
      const weakAreasTexts = results
        .map(r => r.weakAreas as string | null)
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
      if (weakAreasTexts.length > 0) {
        suggestions.push("معالجة نقاط الضعف الملاحظة ميدانيًا: " + weakAreasTexts.join("؛ ") + ".");
      }

      return {
        totalAssessments: results.length,
        overallAverage: Math.round(overallAvg * 100) / 100,
        weakDomainDetails,
        avgHistory: Math.round(avgHistory * 100) / 100,
        avgGeography: Math.round(avgGeography * 100) / 100,
        weakDomains,
        suggestions,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
