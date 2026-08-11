import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  upsertUser, getUserByOpenId,
  getTeacherProfile, createTeacherProfile, updateTeacherProfile,
  getAcademicYears,
  getCurriculumDocuments, getCurriculumDocumentById, createCurriculumDocument, updateCurriculumDocument, deleteCurriculumDocument, getCurriculumForTopic,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  getAnnualPlans, getAnnualPlanById, createAnnualPlan, updateAnnualPlan, deleteAnnualPlan,
  getLessons, getLessonById, createLesson, updateLesson, deleteLesson, toggleLessonCompleted,
  getTeachingNotes, createTeachingNote, updateTeachingNote, deleteTeachingNote,
  getAIResources, getAIResourceById, createAIResource, updateAIResource, deleteAIResource, duplicateAIResource,
  getInspectorReviews, createInspectorReview, getInspectorReviewById,
  getAnnualPlanSections, getAnnualPlanSectionById, createAnnualPlanSection, updateAnnualPlanSection, deleteAnnualPlanSection,
  getLearningSituations, getLearningSituationsByUserId, createLearningSituation, updateLearningSituation, deleteLearningSituation, toggleLearningSituationCompleted,
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
} from "./rules/nationalRules";

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
      return await getTeacherProfile(ctx.user.id);
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
    duplicate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return await duplicateAIResource(input.id, ctx.user.id);
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

      const rawContent = response.choices[0]?.message?.content;
      const evaluation = typeof rawContent === "string" ? rawContent : "تعذر إتمام التقييم.";

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

كشف الأخطاء التربوية الحقيقية:
- إذا كان توزيع النقاط لا يتوافق مع القواعد الوطنية → خطأ جوهري
- إذا كانت الأسئلة كلها على مستوى التذكر → نقص جوهري
- إذا لم يكن هناك ربط بالكفاءات → نقص
- إذا كانت المدة غير مناسبة → ملاحظة
- إذا كان هناك سؤال لا يقيس أي هدف → خطأ

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

      const rawContent2 = response.choices[0]?.message?.content;
      const evaluation = typeof rawContent2 === "string" ? rawContent2 : "تعذر إتمام التقييم.";

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
    })).mutation(async ({ ctx, input }) => {
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

      // RAG: Retrieve relevant curriculum documents
      let curriculumContext = "";
      let curriculumCitations: Array<{ id: number; title: string; type: string; source: string }> = [];
      try {
        const docs = await getCurriculumForTopic(
          `${input.title} ${input.unitTitle || ""} ${input.subject}`,
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
          const docExcerpts = docs.map((d, i) =>
            `[${i + 1}] ${d.title} (${d.type} - ${d.gradeLevel}):
${d.content.substring(0, 300)}`
          ).join("\n\n");
          curriculumContext = `

وثائق المنهاج الرسمية المرجعية (استخدمها كأساس للمحتوى):
${docExcerpts}

استشهد بهذه الوثائق عند التوليد بالصيغة: [مرجع: ${docs.length > 0 ? docs[0].id : 0} — ${docs.length > 0 ? docs[0].title : "غير متوفر"}]`;
        } else {
          curriculumContext = "\n\nتنبيه: لم يتم العثور على وثائق منهاج رسمية مطابقة. صرّح بذلك صراحةً ولا تخترع معلومات منهاجية.";
        }
      } catch (e) {
        curriculumContext = "\n\nتنبيه: تعذر الوصول إلى قاعدة المنهاج.";
      }

      const prompts: Record<string, string> = {
        lessonPlan: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ خطة درس مفصلة ومبنية على المنهج الرسمي الجزائري.
المتطلبات:
- عنوان الدرس: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${input.unitTitle ? `- الوحدة: ${input.unitTitle}` : ""}
${input.unitNumber ? `- رقم الوحدة: ${input.unitNumber}` : ""}
${input.lessonNumber ? `- رقم الدرس: ${input.lessonNumber}` : ""}
${input.duration ? `- المدة: ${input.duration}` : ""}
${diffBlock}

قدم خطة درس تتضمن: الأهداف، المحتوى، الأنشطة، الأدوات، التقويم. استند دائماً إلى المنهج الرسمي الجزائري.${curriculumContext}`,

        activity: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ نشاط تعلم نشط جذاب.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
- المدة: ${input.duration || "حصة واحدة"}
${diffBlock}

صمم نشاطاً تفاعلياً يشجع المشاركة الفعالة للطلاب.${curriculumContext}`,

        homework: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ واجباً منزلياً مناسباً.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

أعِدّ تمارين متنوعة تشمل: أسئلة مباشرة، تحليل، وتطبيق عملي.${curriculumContext}`,

        classQuestions: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مجموعة أسئلة صفية.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

قدم أسئلة متنوعة تشمل مستويات تصنيف بلوم المختلفة: تذكر، فهم، تطبيق، تحليل، تقييم، إبداع.${curriculumContext}`,

        differentiation: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ استراتيجيات تمييز.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${diffBlock}

قدم استراتيجيات تمايز لتناسب: الطلاب المتقدمين، الطلاب العاديين، الطلاب الذين يحتاجون دعماً إضافياً.${curriculumContext}`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: prompts[input.contentType] },
        ],
      });

      const rawContent1 = response.choices[0]?.message?.content;
      const content = typeof rawContent1 === "string" ? rawContent1 : "تعذر توليد المحتوى.";
      const typeLabels: Record<string, string> = {
        lessonPlan: "خطة درس",
        activity: "نشاط تعلم",
        homework: "واجب منزلي",
        classQuestions: "أسئلة صفية",
        differentiation: "استراتيجيات تمييز",
      };

      const result = await createAIResource({
        userId: ctx.user.id,
        lessonId: input.lessonId,
        classId: input.classId,
        type: input.contentType,
        title: input.title,
        content,
        metadata: { subject: input.subject, gradeLevel: input.gradeLevel, curriculumCitations },
        tags: [typeLabels[input.contentType], input.subject, input.gradeLevel],
        sourceDocumentIds: curriculumCitations.length > 0 ? curriculumCitations.map(c => c.id) : undefined,
      });

      return { resourceId: result?.id, content, curriculumCitations };
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

      // ─── Retrieve curriculum knowledge base documents (RAG) ──
      const curriculumDocs = await getCurriculumForTopic(input.topic, input.gradeLevel, input.subject);
      const curriculumContext = curriculumDocs.length > 0
        ? `=== وثائق المنهاج الرسمية (مرجع للاستشهاد) ===\n${curriculumDocs.map((doc, i) => `[${i + 1}] ${doc.title} (المصدر: ${doc.sourceReference || 'وثيقة المنهاج الرسمية'})${doc.unitNumber ? ` (الوحدة ${doc.unitNumber})` : ''}${doc.lessonNumber ? ` — الدرس ${doc.lessonNumber}` : ''}\n    المحتوى: ${doc.content.substring(0, 300)}...`).join("\n\n")}\n\nتعليمات الاستشهاد الصارمة: يجب ربط كل سؤال بوثيقة المنهاج الرسمية ذات الصلة من القائمة أعلاه. بعد كل سؤال ضع الاستشهاد بالصيغة التالية:\n[مرجع: رقم الوثيقة — عنوان الوثيقة — الوحدة/القسم]\nمثال: [مرجع: 1 — وثيقة المنهاج السنة الرابعة — الوحدة 3 — درس الثورة الجزائرية]\nلا تضف أسئلة لا يمكن ربطها بوثيقة منهاج رسمية.`
        : "لا توجد وثائق منهاج مطابقة في قاعدة المعرفة. أنشئ الأسئلة بناءً على الموضوع المطلوب فقط.";

      // ─── Build rules context ─────────────────────────────────
      const rule = input.useNationalRules ? getAssessmentRule(input.gradeLevel, input.subject) : undefined;
      const examHeader = rule ? getExamHeader(input.gradeLevel, input.subject) : "";
      const rulesContext = rule ? buildAssessmentContext({
        gradeLevel: input.gradeLevel,
        subject: input.subject,
        completedLessons,
        selectedCompetencies: input.competencyIds,
        autoImport: input.autoImport,
      }) : "";

      // ─── Generate prompts with rules integration ─────────────
      const prompts: Record<string, string> = {
        quiz: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ اختباراً قصيراً.

${curriculumContext}

${rulesContext}

- الموضوع: ${input.topic}
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

- الموضوع: ${input.topic}
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

- الموضوع: ${input.topic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم شبكة تقييم (Rubric) مفصلة مع معايير ومؤشرات ومستويات أداء.`,

        answerKey: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مفتاح إجابات مفصل.

${curriculumContext}

${rulesContext}

- الموضوع: ${input.topic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم إجابات نموذجية مع شرح مفصل لكل إجابة.`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: prompts[input.assessmentType] },
        ],
      });

      const rawContent3 = response.choices[0]?.message?.content;
      const content = typeof rawContent3 === "string" ? rawContent3 : "تعذر توليد المحتوى.";
      const typeLabels: Record<string, string> = {
        quiz: "اختبار قصير",
        exam: "امتحان",
        rubric: "معايير تقييم",
        answerKey: "مفتاح إجابات",
      };

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
        topic: input.topic,
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
        title: input.title,
        content,
        metadata,
        tags: [typeLabels[input.assessmentType], input.subject, input.gradeLevel, ...(input.useNationalRules ? ["تقويم وطني"] : [])],
      });

      return { resourceId: result?.id, content, rulesApplied: !!rule, pointDistribution: rule?.weights || [], totalPoints: rule?.totalPoints || 20, duration: rule?.duration || "غير محدد", curriculumCitations, curriculumDocsCount: curriculumDocs.length };
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
      try {
        if (input.classId) {
          const plans = await getAnnualPlans(ctx.user.id);
          const classPlan = plans.find(p => p.classId === input.classId);
          if (classPlan) {
            const sections = await getAnnualPlanSections(classPlan.id);
            totalSituations = sections.length;
            for (const section of sections) {
              const situations = await getLearningSituations(section.id);
              completedSituations += situations.filter(s => s.isCompleted).length;
              if (!currentSection) {
                currentSection = { id: section.id, number: section.sectionNumber, title: section.title, isCompleted: section.isCompleted };
                const firstIncomplete = situations.find(s => !s.isCompleted);
                if (firstIncomplete) nextSituation = { id: firstIncomplete.id, title: firstIncomplete.title, sectionNumber: section.sectionNumber };
              }
            }
          }
        }
      } catch (e) { /* sections not yet configured */ }

      return {
        completedLessons: lessonSummaries,
        totalCompleted: lessonSummaries.length,
        competencies: coveredCompetencies,
        currentSection,
        nextSituation,
        sectionProgress: { completed: completedSituations, total: totalSituations },
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
  }),

  // ─── Learning Situations ───────────────────────────────────
  situations: router({
    list: protectedProcedure.input(z.object({ sectionId: z.number() })).query(async ({ input }) => {
      return await getLearningSituations(input.sectionId);
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
      if (results.length === 0) return { totalAssessments: 0, weakDomains: [], suggestions: [] };

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
            if (!domainAverages[domain]) domainAverages[domain] = [];
            domainAverages[domain].push(score);
          });
        }
      });

      // Find weak domains (< 10)
      Object.entries(domainAverages).forEach(([domain, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < 10 && !weakDomains.includes(domain)) weakDomains.push(domain);
      });

      // Generate suggestions based on weak areas
      const suggestions: string[] = [];
      if (weakDomains.includes("التاريخ")) suggestions.push("مراجعة مفهوم الزمن التاريخي وأساليب تحليل الوثائق التاريخية");
      if (weakDomains.includes("الجغرافيا")) suggestions.push("تعزيز مهارات قراءة الخرائط والتحليل الجغرافي");
      if (weakDomains.length > 0) {
        suggestions.push("تنظيم حصص دعم علاجية مركزة على المجالات الضعيفة");
        suggestions.push("إعادة تدريس الوضعيات التعليمية ذات الصلة بأنشطة تفاعلية");
      }
      if (overallAvg >= 10) suggestions.push("مواصلة تعزيز المكتسبات مع إثراء للمتعففين");

      return {
        totalAssessments: results.length,
        overallAverage: Math.round(overallAvg * 100) / 100,
        avgHistory: Math.round(avgHistory * 100) / 100,
        avgGeography: Math.round(avgGeography * 100) / 100,
        weakDomains,
        suggestions,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
