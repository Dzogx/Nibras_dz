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
  getCurriculumDocuments, getCurriculumDocumentById, createCurriculumDocument, updateCurriculumDocument, deleteCurriculumDocument,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  getAnnualPlans, getAnnualPlanById, createAnnualPlan, updateAnnualPlan, deleteAnnualPlan,
  getLessons, getLessonById, createLesson, updateLesson, deleteLesson, toggleLessonCompleted,
  getTeachingNotes, createTeachingNote, updateTeachingNote, deleteTeachingNote,
  getAIResources, getAIResourceById, createAIResource, updateAIResource, deleteAIResource, duplicateAIResource,
  getInspectorReviews, createInspectorReview, getInspectorReviewById,
} from "./db";

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
2. **وضوح أهداف التعلم**: هل الأهداف محددة وقابلة للقياس؟
3. **جودة التقييم وأسئلة التقييم**: هل الأسئلة متنوعة ومناسبة؟
4. **تطبيق تصنيف بلوم (Bloom's Taxonomy)**: هل يشمل مستويات مختلفة (تذكر، فهم، تطبيق، تحليل، تقييم، إبداع)؟
5. **دمج التعلم النشط**: هل يتضمن أنشطة تفاعلية تشجع مشاركة الطلاب؟
6. **استراتيجيات التمييز والتمايز**: هل يأخذ بعين الاعتبار الفروق الفردية بين التلاميذ؟

قدم تقييماً مفصلاً مع نقاط القوة والضعف وتوصيات عملية للتحسين. أعِطِ تقييماً عاماً من 100.

أجب بتنسيق Markdown منظم بعناوين واضحة.`
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

قدم تقييماً مفصلاً مع توصيات عملية للتحسين. أعِطِ تقييماً عاماً من 100.

أجب بتنسيق Markdown منظم بعناوين واضحة.`
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
    })).mutation(async ({ ctx, input }) => {
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

قدم خطة درس تتضمن: الأهداف، المحتوى، الأنشطة، الأدوات، التقويم. استند دائماً إلى المنهج الرسمي الجزائري.`,

        activity: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ نشاط تعلم نشط جذاب.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
- المدة: ${input.duration || "حصة واحدة"}

صمم نشاطاً تفاعلياً يشجع المشاركة الفعالة للطلاب.`,

        homework: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ واجباً منزلياً مناسباً.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

أعِدّ تمارين متنوعة تشمل: أسئلة مباشرة، تحليل، وتطبيق عملي.`,

        classQuestions: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مجموعة أسئلة صفية.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم أسئلة متنوعة تشمل مستويات تصنيف بلوم المختلفة: تذكر، فهم، تطبيق، تحليل، تقييم، إبداع.`,

        differentiation: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ استراتيجيات تمييز.
- الموضوع: ${input.title}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم استراتيجيات تمايز لتناسب: الطلاب المتقدمين، الطلاب العاديين، الطلاب الذين يحتاجون دعماً إضافياً.`,
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
        metadata: { subject: input.subject, gradeLevel: input.gradeLevel },
        tags: [typeLabels[input.contentType], input.subject, input.gradeLevel],
      });

      return { resourceId: result?.id, content };
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
    })).mutation(async ({ ctx, input }) => {
      const prompts: Record<string, string> = {
        quiz: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ اختباراً قصيراً.
- الموضوع: ${input.topic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${input.numQuestions ? `- عدد الأسئلة: ${input.numQuestions}` : "- 10 أسئلة متنوعة"}
${input.duration ? `- المدة: ${input.duration}` : ""}

قدم أسئلة متنوعة مع مفتاح إجابات.`,

        exam: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ امتحاناً فصلياً.
- الموضوع: ${input.topic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}
${input.numQuestions ? `- عدد الأسئلة: ${input.numQuestions}` : "- 5 أسئلة مقالية متنوعة"}
${input.duration ? `- المدة: ${input.duration}` : "- ساعة واحدة"}

قدم الامتحان مع مفتاح الإجابات ونظام التنقيط.`,

        rubric: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ معايير تقييم.
- الموضوع: ${input.topic}
- المادة: ${input.subject}
- المستوى: ${input.gradeLevel}

قدم شبكة تقييم (Rubric) مفصلة مع معايير ومؤشرات ومستويات أداء.`,

        answerKey: `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ مفتاح إجابات مفصل.
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

      const result = await createAIResource({
        userId: ctx.user.id,
        classId: input.classId,
        type: input.assessmentType,
        title: input.title,
        content,
        metadata: { subject: input.subject, gradeLevel: input.gradeLevel, topic: input.topic },
        tags: [typeLabels[input.assessmentType], input.subject, input.gradeLevel],
      });

      return { resourceId: result?.id, content };
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
});

export type AppRouter = typeof appRouter;
