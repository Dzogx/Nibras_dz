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
  getAcademicYears,
  getCurriculumDocuments, getCurriculumDocumentById, createCurriculumDocument, updateCurriculumDocument, deleteCurriculumDocument, getCurriculumForTopic,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  getWeeklyScheduleEntries, replaceWeeklyScheduleEntries,
  getAnnualPlans, getAnnualPlanById, createAnnualPlan, updateAnnualPlan, deleteAnnualPlan,
  getLessons, getLessonById, createLesson, updateLesson, deleteLesson, toggleLessonCompleted,
  getTeachingNotes, createTeachingNote, updateTeachingNote, deleteTeachingNote,
  getAIResources, getAIResourceById,
  getAIResourceBySerial, createAIResource, updateAIResource, deleteAIResource, duplicateAIResource,
  getInspectorReviews, createInspectorReview, getInspectorReviewById,
  getAnnualPlanSections, getAnnualPlanSectionById, createAnnualPlanSection, updateAnnualPlanSection, deleteAnnualPlanSection,
  getLearningSituations, getLearningSituationsByUserId, getLearningSituationById, createLearningSituation, updateLearningSituation, deleteLearningSituation, toggleLearningSituationCompleted,
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
} from "./rules/nationalRules";
import { getTeachingTemplate, TEACHING_TEMPLATES } from "../shared/teachingTemplates";

/**
 * يتحقق من بنية استجابة مزود الذكاء الاصطناعي وقت التشغيل.
 * لا يكفي نوع TypeScript وحده لأن الاستجابة الخارجية قد تكون رسالة خطأ أو جسماً ناقصاً.
 */
function getLLMTextContent(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;

  const choices = (response as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") return undefined;

  const message = (firstChoice as { message?: unknown }).message;
  if (!message || typeof message !== "object") return undefined;

  const content = (message as { content?: unknown }).content;
  if (typeof content === "string" && content.trim().length > 0) return content;
  if (Array.isArray(content)) {
    const textParts = content
      .filter(part => part && typeof part === "object" && (part as { type?: string }).type === "text")
      .map(part => (part as { text?: string }).text)
      .filter(t => typeof t === "string")
      .join("");
    if (textParts.trim().length > 0) return textParts;
  }
  return undefined;
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
        periodIndex: z.number().int().min(1).max(8),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "صيغة الوقت هي HH:MM"),
        room: z.string().max(64).optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const ownedClassIds = new Set((await getClasses(ctx.user.id)).map(item => item.id));
      const occupiedSlots = new Set<string>();

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
      }

      return await replaceWeeklyScheduleEntries(ctx.user.id, input.academicYear, input.entries);
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
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await getAnnualPlanById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      subject: z.string().min(1),
      gradeLevel: z.string().min(1),
      academicYear: z.string().min(1),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await createAnnualPlan({ userId: ctx.user.id, ...input } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      classId: z.number().optional(),
      subject: z.string().optional(),
      gradeLevel: z.string().optional(),
      academicYear: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAnnualPlan(id, data as any);
      return await getAnnualPlanById(id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
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
      contentType: z.enum(["lessonPlan", "activity", "homework", "classQuestions", "differentiation"]),
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

كل مخرج مسودة قابلة للتعديل: الكفاءة والكفاءات والمقاطع من وثائق المنهاج فقط، وبقية الصياغة يراجعها الأستاذ قبل الاعتماد.`,

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
        type: input.contentType,
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

    getTeacherOSContext: protectedProcedure.input(z.object({
      classId: z.number().optional(),
      gradeLevel: z.string().optional(),
      subject: z.string().optional(),
    })).query(async ({ ctx, input }) => {
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
          const plans = await getAnnualPlans(ctx.user.id);
          const classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            const sections = await getAnnualPlanSections(classPlan.id);
            const sectionProgressList: { id: number; sectionNumber: number; title: string; total: number; completed: number; percent: number; lastCompletedDate?: string }[] = [];
            for (const section of sections) {
              const situations = await getLearningSituations(section.id);
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
          const plans = await getAnnualPlans(ctx.user.id);
          const classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            // بداية التدريس حسب التدرج السنوي المعتمد (5 أكتوبر 2026) — تُحدَّث عند صدور الرزنامة الرسمية
            const termStart = new Date('2026-10-05T00:00:00Z');
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
          const plans = await getAnnualPlans(ctx.user.id);
          const classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            const sections = await getAnnualPlanSections(classPlan.id);
            for (const section of sections) {
              const situations = await getLearningSituations(section.id);
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
      } catch (e) { /* no sections configured */ }
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
    })).mutation(async ({ input }) => {
      await updateAnnualPlanSection(input.id, input);
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
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
      const all = await getLearningSituationsByUserId(ctx.user.id);
      return all.filter((s) => !s.isCompleted);
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
      return await createLearningSituation({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      objectives: z.string().optional(),
      content: z.string().optional(),
      isCompleted: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      await updateLearningSituation(input.id, input);
      return { success: true } as const;
    }),
    toggleCompleted: protectedProcedure.input(z.object({ id: z.number(), isCompleted: z.boolean() })).mutation(async ({ input }) => {
      await toggleLearningSituationCompleted(input.id, input.isCompleted);
      return { success: true } as const;
    }),
    completeSession: protectedProcedure.input(z.object({
      situationId: z.number(),
      note: z.string().trim().max(3000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const situations = await getLearningSituationsByUserId(ctx.user.id);
      const situation = situations.find((item) => item.id === input.situationId);
      if (!situation) throw new TRPCError({ code: "NOT_FOUND", message: "الوضعية غير موجودة" });

      await toggleLearningSituationCompleted(situation.id, true);
      if (input.note) {
        await createTeachingNote({
          userId: ctx.user.id,
          title: `ملاحظة حصة: ${situation.title}`,
          content: input.note,
          noteType: "session_reflection",
        } as any);
      }
      return { success: true, noteSaved: Boolean(input.note) } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
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

      // Capture the weakest labeled domains (with averages) for pedagogical reporting
      const weakDomainDetails = weakDomains
        .map(label => {
          const scores = domainAverages[label];
          if (!scores || scores.length === 0) return { label, avg: 0 };
          return { label, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 };
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
        suggestions.push("بناءً على ملاحظاتك المسجلة: " + weakAreasTexts.join("؛ "));
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
