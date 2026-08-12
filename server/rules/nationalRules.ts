/**
 * National Assessment Rules Engine (محرك القواعد الوطنية للتقويم)
 *
 * هذا المحرك المركزي يحتوي على جميع القواعد الرسمية الخاصة بالتقويم
 * في التعليم المتوسط الجزائري لمادة الدراسات الاجتماعية.
 *
 * أي تحديث للقواعد يتم من مكان واحد فقط هنا.
 *
 * المصادر الرسمية:
 * - دليل بناء اختبارات مادة التاريخ والجغرافيا في امتحان شهادة التعليم
 *   المتوسط (ديسمبر 2018): بنية الاختبار (3-4 وضعيات للتاريخ، 2-3
 *   للجغرافيا)، تدرج Bloom الصريح، الإجابة النموذجية وشبكة التقويم.
 * - المخططات السنوية لبناء التعلمات (المرجع المنهاجي).
 *
 * التوزيع: 1AM/2AM/3AM: تاريخ 10 + جغرافيا 10 | 4AM/BEM: تاريخ 13 + جغرافيا 7
 * التربية المدنية: اختبار مستقل 20 نقطة، ساعة واحدة.
 */

// ─── Types ─────────────────────────────────────────────────────

export interface SubjectWeight {
  subject: string;
  points: number;
  label: string;
}

/**
 * مواصفات بنية الأسئلة الرسمية داخل الاختبار حسب المادة.
 * مستخرجة من دليل بناء الاختبارات 2018:
 * - التاريخ (4AM): الجزء الأول 9 نقاط = 03-04 وضعيات بسيطة مستقلة،
 *   الجزء الثاني 4 نقاط = وضعية إدماج واحدة مع تعليمة وسندات.
 * - الجغرافيا (4AM): الجزء الأول 4 نقاط = 02-03 وضعيات بسيطة،
 *   الجزء الثاني 3 نقاط = وضعية إدماج واحدة مع تعليمة وسندات.
 * - 1AM/2AM/3AM: يُعمَّم مبدأ «وضعيات بسيطة + وضعية إدماج» مع حفظ
 *   توزيع النقاط 10/10.
 */
export interface QuestionBlueprint {
  /** المادة داخل الاختبار */
  subject: string;
  /** نقاط الجزء الأول (الوضعيات البسيطة) */
  part1Points: number;
  /** الحد الأدنى لعدد الوضعيات البسيطة في الجزء الأول */
  part1MinQuestions: number;
  /** الحد الأقصى لعدد الوضعيات البسيطة في الجزء الأول */
  part1MaxQuestions: number;
  /** نقاط الجزء الثاني (وضعية الإدماج) */
  part2Points: number;
  /** عدد وضعيات الإدماج في الجزء الثاني (دائماً 1) */
  part2IntegrationQuestion: 1;
}

export interface AssessmentRule {
  gradeLevel: string;
  subject: string;
  totalPoints: number;
  duration: string;
  examType: "combined" | "independent";
  weights: SubjectWeight[];
  maxQuestions: number;
  /** مواصفات بنية الأسئلة الرسمية حسب المادة داخل الاختبار */
  questionBlueprints?: QuestionBlueprint[];
  /**
   * معايير شبكة التقويم الرسمية لوضعية الإدماج (دليل 2018):
   * الإتقان، التمايز، تنظيم الورقة، اللغة، الخط، الفصل بين العناصر،
   * علامات الوقف.
   */
  rubricCriteria?: string[];
  description: string;
}

export interface ExamStructure {
  part1: {
    subject: string;
    points: number;
    suggestedQuestions: number;
  };
  part2: {
    subject: string;
    points: number;
    suggestedQuestions: number;
  };
  totalPoints: number;
  duration: string;
}

// ─── National Rules Database ───────────────────────────────────
// هذا هو المكان الوحيد لتعديل القواعد الوطنية

const RULES: Record<string, AssessmentRule> = {
  // السنة الأولى متوسط - التاريخ والجغرافيا
  "السنة الأولى متوسط:التاريخ والجغرافيا": {
    gradeLevel: "السنة الأولى متوسط",
    subject: "التاريخ والجغرافيا",
    totalPoints: 20,
    duration: "ساعة ونصف",
    examType: "combined",
    weights: [
      { subject: "التاريخ", points: 10, label: "التاريخ" },
      { subject: "الجغرافيا", points: 10, label: "الجغرافيا" },
    ],
    maxQuestions: 8,
    questionBlueprints: [
      { subject: "التاريخ", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
      { subject: "الجغرافيا", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
    ],
    rubricCriteria: ["الإتقان", "التمايز", "تنظيم الورقة", "اللغة", "الخط", "الفصل بين العناصر", "علامات الوقف"],
    description: "اختبار واحد يجمع التاريخ والجغرافيا، كل مادة 10 نقاط",
  },

  // السنة الثانية متوسط - التاريخ والجغرافيا
  "السنة الثانية متوسط:التاريخ والجغرافيا": {
    gradeLevel: "السنة الثانية متوسط",
    subject: "التاريخ والجغرافيا",
    totalPoints: 20,
    duration: "ساعة ونصف",
    examType: "combined",
    weights: [
      { subject: "التاريخ", points: 10, label: "التاريخ" },
      { subject: "الجغرافيا", points: 10, label: "الجغرافيا" },
    ],
    maxQuestions: 8,
    questionBlueprints: [
      { subject: "التاريخ", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
      { subject: "الجغرافيا", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
    ],
    rubricCriteria: ["الإتقان", "التمايز", "تنظيم الورقة", "اللغة", "الخط", "الفصل بين العناصر", "علامات الوقف"],
    description: "اختبار واحد يجمع التاريخ والجغرافيا، كل مادة 10 نقاط",
  },

  // السنة الثالثة متوسط - التاريخ والجغرافيا
  "السنة الثالثة متوسط:التاريخ والجغرافيا": {
    gradeLevel: "السنة الثالثة متوسط",
    subject: "التاريخ والجغرافيا",
    totalPoints: 20,
    duration: "ساعة ونصف",
    examType: "combined",
    weights: [
      { subject: "التاريخ", points: 10, label: "التاريخ" },
      { subject: "الجغرافيا", points: 10, label: "الجغرافيا" },
    ],
    maxQuestions: 8,
    questionBlueprints: [
      { subject: "التاريخ", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
      { subject: "الجغرافيا", part1Points: 8, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 2, part2IntegrationQuestion: 1 },
    ],
    rubricCriteria: ["الإتقان", "التمايز", "تنظيم الورقة", "اللغة", "الخط", "الفصل بين العناصر", "علامات الوقف"],
    description: "اختبار واحد يجمع التاريخ والجغرافيا، كل مادة 10 نقاط",
  },

  // السنة الرابعة متوسط - التاريخ والجغرافيا (BEM)
  "السنة الرابعة متوسط:التاريخ والجغرافيا": {
    gradeLevel: "السنة الرابعة متوسط",
    subject: "التاريخ والجغرافيا",
    totalPoints: 20,
    duration: "ساعة ونصف",
    examType: "combined",
    weights: [
      { subject: "التاريخ", points: 13, label: "التاريخ" },
      { subject: "الجغرافيا", points: 7, label: "الجغرافيا" },
    ],
    maxQuestions: 8,
    // البنية الرسمية من دليل 2018: التاريخ 9+4، الجغرافيا 4+3
    questionBlueprints: [
      { subject: "التاريخ", part1Points: 9, part1MinQuestions: 3, part1MaxQuestions: 4, part2Points: 4, part2IntegrationQuestion: 1 },
      { subject: "الجغرافيا", part1Points: 4, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 3, part2IntegrationQuestion: 1 },
    ],
    rubricCriteria: ["الإتقان", "التمايز", "تنظيم الورقة", "اللغة", "الخط", "الفصل بين العناصر", "علامات الوقف"],
    description: "اختبار واحد يجمع التاريخ والجغرافيا (شهادة التعليم المتوسط)، التاريخ 13 نقطة والجغرافيا 7 نقاط",
  },

  // الجغرافيا كمادة مستقلة في المخططات السنوية — تتبع نفس قواعد اختبار الاجتماعيات المدمج
  "السنة الأولى متوسط:الجغرافيا": { gradeLevel: "السنة الأولى متوسط", subject: "الجغرافيا", totalPoints: 10, duration: "ساعة ونصف (ضمن اختبار الاجتماعيات المشترك)", examType: "combined", weights: [{ subject: "الجغرافيا", points: 10, label: "الجغرافيا" }], maxQuestions: 4, description: "الجغرافيا في اختبار مشترك مع التاريخ، 10 نقاط" },
  "السنة الثانية متوسط:الجغرافيا": { gradeLevel: "السنة الثانية متوسط", subject: "الجغرافيا", totalPoints: 10, duration: "ساعة ونصف (ضمن اختبار الاجتماعيات المشترك)", examType: "combined", weights: [{ subject: "الجغرافيا", points: 10, label: "الجغرافيا" }], maxQuestions: 4, description: "الجغرافيا في اختبار مشترك مع التاريخ، 10 نقاط" },
  "السنة الثالثة متوسط:الجغرافيا": { gradeLevel: "السنة الثالثة متوسط", subject: "الجغرافيا", totalPoints: 10, duration: "ساعة ونصف (ضمن اختبار الاجتماعيات المشترك)", examType: "combined", weights: [{ subject: "الجغرافيا", points: 10, label: "الجغرافيا" }], maxQuestions: 4, description: "الجغرافيا في اختبار مشترك مع التاريخ، 10 نقاط" },
  "السنة الرابعة متوسط:الجغرافيا": { gradeLevel: "السنة الرابعة متوسط", subject: "الجغرافيا", totalPoints: 7, duration: "ساعة ونصف (ضمن اختبار الاجتماعيات المشترك)", examType: "combined", weights: [{ subject: "الجغرافيا", points: 7, label: "الجغرافيا" }], maxQuestions: 4, description: "الجغرافيا في اختبار شهادة التعليم المتوسط، 7 نقاط" },

  // التربية المدنية - جميع المستويات
  // البنية الرسمية من دليل بناء اختبارات مادة التربية المدنية في امتحان
  // شهادة التعليم المتوسط (ديسمبر 2018): جزءان — الجزء الأول 12 نقطة يحتوي
  // على وضعيتين أو ثلاث وضعيات بسيطة منفصلة (تعريف مصطلحات، تعداد مفاهيم،
  // تحديد مهام وخصائص)، والجزء الثاني 8 نقاط وضعية تقويمية مركبة من الواقع
  // المعيش مع تعليمة للحل وسندات. المدة ساعة واحدة والمعامل 1.
  "التربية المدنية": {
    gradeLevel: "any",
    subject: "التربية المدنية",
    totalPoints: 20,
    duration: "ساعة واحدة",
    examType: "independent",
    weights: [
      { subject: "التربية المدنية", points: 20, label: "التربية المدنية" },
    ],
    maxQuestions: 6,
    questionBlueprints: [
      { subject: "التربية المدنية", part1Points: 12, part1MinQuestions: 2, part1MaxQuestions: 3, part2Points: 8, part2IntegrationQuestion: 1 },
    ],
    rubricCriteria: ["الإتقان", "التمايز", "تنظيم الورقة", "اللغة", "الخط", "الفصل بين العناصر", "علامات الوقف"],
    description: "اختبار مستقل (المعامل 1)، ساعة واحدة: الجزء الأول 12 نقطة (2-3 وضعيات بسيطة) + الجزء الثاني 8 نقاط (وضعية تقويمية مركبة)",
  },
};

// ─── Competency Categories ─────────────────────────────────────

export interface CompetencyCategory {
  id: string;
  name: string;
  description: string;
  bloomLevels: string[];
  applicableSubjects: string[];
}

export const COMPETENCY_CATEGORIES: CompetencyCategory[] = [
  {
    id: "knowledge",
    name: "اكتساب المعارف",
    description: "تذكر واستحضار المعلومات والمفاهيم الأساسية",
    bloomLevels: ["remember", "understand"],
    applicableSubjects: ["التاريخ والجغرافيا", "التربية المدنية"],
  },
  {
    id: "methodology",
    name: "التحكم في المنهجية",
    description: "تحليل الوثائق، قراءة الخرائط، بناء جداول زمنية",
    bloomLevels: ["apply", "analyze"],
    applicableSubjects: ["التاريخ والجغرافيا", "التربية المدنية"],
  },
  {
    id: "social_citizenship",
    name: "بناء الهوية والمواطنة",
    description: "فهم الهوية الوطنية والمواطنة والقيم",
    bloomLevels: ["evaluate", "create"],
    applicableSubjects: ["التربية المدنية"],
  },
  {
    id: "historical_analysis",
    name: "التحليل التاريخي والجغرافي",
    description: "تحليل الأحداث التاريخية والظواهر الجغرافية",
    bloomLevels: ["analyze", "evaluate"],
    applicableSubjects: ["التاريخ والجغرافيا"],
  },
];

// ─── Bloom's Taxonomy Levels ───────────────────────────────────
// تصنيف المستويات الخاصة بالأفعال (استغلالها في التعليمات أو المهمات)
// المصدر: جدول تصنيف الأفعال المعتمد لمادة الاجتماعيات (بلزقوق)

export const BLOOM_LEVELS = [
  { id: "remember", name: "المعرفة", nameAr: "المعرفة", weight: 0.2 },
  { id: "understand", name: "الفهم", nameAr: "الفهم", weight: 0.2 },
  { id: "apply", name: "التطبيق", nameAr: "التطبيق", weight: 0.2 },
  { id: "analyze", name: "التحليل", nameAr: "التحليل", weight: 0.15 },
  { id: "create", name: "التركيب (ابتكار/إبناء)", nameAr: "التركيب (ابتكار/إبناء)", weight: 0.1 },
  { id: "evaluate", name: "التقييم", nameAr: "التقييم", weight: 0.15 },
];

/** أفعال بلوم المعتمدة لكل مستوى — من جدول تصنيف الأفعال لمادة الاجتماعيات */
export const BLOOM_ARABIC_VERBS: Record<string, { description: string; verbs: string[] }> = {
  remember: {
    description: "الاستدكار أو تمييز المعلومات",
    verbs: ["عرّف", "صنّف", "أدرج", "تذكّر", "تعرّف", "اربط", "انتج", "اختر", "اذكر", "استرجع", "عُد", "اكتب", "سمّ", "عيّن", "ضع قائمة", "حدّد", "انسب", "أسرد", "أمثل", "طابق", "احفظ"],
  },
  understand: {
    description: "فهم المعنى — إعادة ذكر البيانات بكلمات المتعلم الخاصة به — الاستنباط — الترجمة",
    verbs: ["اشرح", "كرّر", "أعد الصياغة بألفاظ أخرى", "صنّف", "لخّص", "وضّح", "ترجم", "راجع", "اكتب تقريراً", "ناقش", "أعد كتابة", "قدّر", "فسّر", "نظر", "أشر", "أعط", "ميّز", "رتّب", "استدل", "احسب", "أيد", "اربط بين", "توقّع", "تنبّأ", "خمّن", "قارن", "أسند", "حوّل"],
  },
  apply: {
    description: "استخدام أو تطبيق المعرفة ووضع النظريات موضع التنفيذ — استخدام المعرفة كاستجابة للظروف الواقعية",
    verbs: ["استخدم", "طبّق", "نفّذ", "حل", "أنشأ", "غيّر", "حضّر", "اجر", "أنجز", "تفاعل", "استجب", "العب دورا", "اختر", "استدل", "استعمل", "جنّد", "صوّر", "وظّف", "اعُد", "رتّب", "جهّز", "خطط", "احسب", "وضّح", "اكتشف", "تناول", "عدّل", "بيّن", "برهن"],
  },
  analyze: {
    description: "تفسير العناصر — المبادئ التنظيمية — بنية التركيب — العلاقات الداخلية — النوعية — المصداقية — العناصر القائمة بذاتها",
    verbs: ["حلّل", "جزّئ", "فهرس", "قارن", "حدّد", "قيس", "اختبر", "جرّب", "اربط", "خطط", "استنبط", "قسّم", "وضّب", "جمّع", "انتق", "صنّف", "ميّز", "افحص", "سأل", "دقّق", "فرّق", "تعرّف على", "وضّح", "استنتج", "وازن"],
  },
  create: {
    description: "تطوير تراكيب جديدة ومميّزة — أنظمة، أفكار، تفكير خلاق، عمليات",
    verbs: ["بلور", "خطط", "أنشأ", "ابتكر", "صمّم", "قم بصياغة", "أسّس", "اقترح", "اجمع", "ضمّن", "أعد ترتيب", "عدّل", "صغ", "ضع تصور", "ابن", "ألّف", "أعد البناء", "اربط بين", "لخّص أفكار"],
  },
  evaluate: {
    description: "تقييم فعالية كل المفاهيم من ناحية الأهمية — المخرجات — التفكير النقدي — عمليات المقارنة — الاستراتيجية — الحكم المتعلق بمعيار خارجي",
    verbs: ["راجع", "برّر", "قيّم", "اعرض مسالة", "دافع", "بلغ عن", "تحقّق", "ثمّن", "جادل", "نظّم", "قوّم", "احكم", "توقّع", "ساند", "انتق", "اعط أهمية", "انقد", "استخلص", "ابرز", "فسّر"],
  },
};

// ─── Public API ────────────────────────────────────────────────

/**
 * Get the assessment rule for a specific grade level and subject
 */
export function getAssessmentRule(gradeLevel: string, subject: string): AssessmentRule | undefined {
  // Try exact match first
  const exactKey = `${gradeLevel}:${subject}`;
  if (RULES[exactKey]) return RULES[exactKey];

  // Try subject-only match (for التربية المدنية which applies to all levels)
  const subjectKey = subject;
  if (RULES[subjectKey]) return RULES[subjectKey];

  return undefined;
}

/**
 * Get all available rules
 */
export function getAllRules(): AssessmentRule[] {
  return Object.values(RULES);
}

/**
 * Get the exam structure for a specific level and subject
 */
export function getExamStructure(gradeLevel: string, subject: string): ExamStructure | undefined {
  const rule = getAssessmentRule(gradeLevel, subject);
  if (!rule) return undefined;

  const weights = rule.weights;
  return {
    part1: {
      subject: weights[0]?.subject || "",
      points: weights[0]?.points || 0,
      suggestedQuestions: Math.ceil((weights[0]?.points || 0) / 2),
    },
    part2: {
      subject: weights[1]?.subject || "",
      points: weights[1]?.points || 0,
      suggestedQuestions: Math.ceil((weights[1]?.points || 0) / 2),
    },
    totalPoints: rule.totalPoints,
    duration: rule.duration,
  };
}

/**
 * Get question distribution based on Bloom's taxonomy
 * Returns how many questions should target each bloom level.
 *
 * يلتزم بالشرط الرسمي (دليل 2018): الأسئلة تعالج مختلف مستويات التفكير
 * ولا تقتصر على الحفظ والاسترجاع، وتتدرج من البسيط إلى المركب.
 */
export function getBloomDistribution(numQuestions: number, rule?: AssessmentRule): { bloomId: string; count: number; name: string }[] {
  const distribution: { bloomId: string; count: number; name: string }[] = [];
  let remaining = numQuestions;

  const isBEM = rule?.gradeLevel === "السنة الرابعة متوسط";

  for (const level of BLOOM_LEVELS) {
    const count = Math.round(numQuestions * level.weight);
    if (count > 0 && remaining > 0) {
      const actualCount = Math.min(count, remaining);
      distribution.push({
        bloomId: level.id,
        count: actualCount,
        name: level.nameAr,
      });
      remaining -= actualCount;
    }
  }

  // For BEM: guarantee coverage of higher-order thinking levels
  // (لا تقتصر على الحفظ والاسترجاع)
  if (isBEM && remaining === 0) {
    const hasHigherOrder = distribution.some(d =>
      d.bloomId === "analyze" || d.bloomId === "evaluate" || d.bloomId === "create",
    );
    if (!hasHigherOrder && distribution.some(d => d.bloomId === "remember" && d.count > 1)) {
      const remember = distribution.find(d => d.bloomId === "remember")!;
      remember.count -= 1;
      const analyze = distribution.find(d => d.bloomId === "analyze");
      if (analyze) {
        analyze.count += 1;
      } else {
        distribution.push({ bloomId: "analyze", count: 1, name: "تحليل" });
      }
    }
  }

  // If there are remaining questions, add them to "understand"
  if (remaining > 0) {
    const existing = distribution.find(d => d.bloomId === "understand");
    if (existing) {
      existing.count += remaining;
    } else {
      distribution.push({ bloomId: "understand", count: remaining, name: "فهم" });
    }
  }

  return distribution;
}

/**
 * Build the assessment prompt context from Teacher OS data
 * This creates the curriculum-context block for AI generation.
 *
 * يتضمن المواصفات الرسمية من دليل 2018: بنية الأسئلة حسب المادة،
 * تدرج Bloom الإلزامي، شروط الصياغة، ومعايير شبكة التقويم.
 */
export function buildAssessmentContext(params: {
  gradeLevel: string;
  subject: string;
  completedLessons: { title: string; unitTitle?: string; unitNumber?: number; lessonNumber?: number; objectives?: string }[];
  completedSituations?: { title: string; sectionTitle?: string; objectives?: string; competencies?: string; situationNumber?: number }[];
  selectedCompetencies?: string[];
  autoImport?: boolean;
}): string {
  const rule = getAssessmentRule(params.gradeLevel, params.subject);
  if (!rule) return "";

  const context: string[] = [];

  // Header
  context.push(`=== قواعد التقويم الوطنية (تُطبق تلقائياً) ===`);
  context.push(`- المستوى: ${params.gradeLevel}`);
  context.push(`- المادة: ${params.subject}`);
  context.push(`- مجموع النقاط: ${rule.totalPoints}`);
  context.push(`- مدة الاختبار: ${rule.duration}`);
  context.push(`- نوع الاختبار: ${rule.examType === "combined" ? "مختلط (تاريخ + جغرافيا)" : "مستقل"}`);
  context.push(`- توزيع النقاط:`);
  rule.weights.forEach(w => {
    context.push(`    • ${w.label}: ${w.points} نقطة`);
  });

  // Official question structure (دليل 2018): بنية الأسئلة حسب المادة
  if (rule.questionBlueprints && rule.questionBlueprints.length > 0) {
    context.push("");
    context.push(`=== بنية الاختبار الرسمية (دليل بناء الاختبارات 2018) ===`);
    rule.questionBlueprints.forEach(bp => {
      context.push(`المادة: ${bp.subject}`);
      context.push(`- الجزء الأول (${bp.part1Points} نقاط): من ${bp.part1MinQuestions} إلى ${bp.part1MaxQuestions} وضعيات بسيطة مستقلة عن بعضها، تعالج مختلف مستويات التفكير لدى المترشح بحيث لا تقتصر على الحفظ والاسترجاع، وتغطي منهاج المادة، مع ربط كل سؤال بالكفاءة التي يقيسها وتفصيل العلامات إلى إجمالية وجزئية`);
      context.push(`- الجزء الثاني (${bp.part2Points} نقاط): وضعية إدماج واحدة لمعالجة إشكالية مركبة في سياقها، متبوعة بتعليمة تحدد المهمة المطلوبة، وسندات (نصوص، سلالم زمنية، خرائط، جداول، معطيات إحصائية، صور، أحداث وتواريخ معلمية)`);
    });
  }

  // Competencies context
  context.push("");
  context.push(`=== الكفاءات المستهدفة ===`);
  if (params.selectedCompetencies && params.selectedCompetencies.length > 0) {
    params.selectedCompetencies.forEach(c => context.push(`- ${c}`));
  } else {
    context.push(`- اكتساب المعارف الأساسية`);
    context.push(`- التحكم في المنهجية`);
    context.push(`- التحليل والاستنتاج`);
  }

  // Bloom's taxonomy requirement (شرط إلزامي من الدليل 2018)
  context.push("");
  context.push(`=== تدرج مستويات التفكير (Bloom) — إلزامي ===`);
  context.push(`يجب أن تتدرج الأسئلة من البسيط إلى المركب: من المعرفة (التذكر) إلى الفهم إلى التطبيق ثم التحليل والتركيب ثم إصدار الأحكام. لا تقتصر الأسئلة على الحفظ والاسترجاع، ولا تترك كفاءات المنهاج دون قياس. التوزيع المقترح:`);
  const bloomDist = getBloomDistribution(rule.maxQuestions, rule);
  bloomDist.forEach(d => {
    const levelVerbs = BLOOM_ARABIC_VERBS[d.bloomId];
    const verbsSample = levelVerbs ? ` — استعمل أفعال هذا المستوى عند الصياغة مثل: ${levelVerbs.verbs.slice(0, 6).join("، ")}...` : "";
    context.push(`- ${d.name} (${levelVerbs?.description ?? ""}): ${d.count} سؤال${verbsSample}`);
  });
  context.push(``);
  context.push(`أفعال الصياغة المعتمدة لكل مستوى (جدول تصنيف الأفعال لمادة الاجتماعيات):`);
  Object.entries(BLOOM_ARABIC_VERBS).forEach(([id, level]) => {
    const entry = bloomDist.find(d => d.bloomId === id);
    const marker = entry ? ` [${entry.count} سؤال مطلوب]` : "";
    context.push(`- ${entry ? entry.name : id}: ${level.verbs.join("، ")}${marker}`);
  });

  // Completed lessons context
  context.push("");
  context.push(`=== الدروس المنجزة فعلياً (من Teacher OS) ===`);
  context.push(`عدد الدروس المنجزة: ${params.completedLessons.length}`);
  params.completedLessons.forEach((lesson, index) => {
    const prefix = lesson.unitTitle ? `[${lesson.unitTitle}]` : "";
    const num = lesson.lessonNumber ? ` (الدرس ${lesson.lessonNumber})` : "";
    context.push(`${index + 1}. ${prefix}${num} ${lesson.title}`);
    if (lesson.objectives) {
      context.push(`   الأهداف: ${lesson.objectives}`);
    }
  });

  // Completed situations context
  if (params.completedSituations && params.completedSituations.length > 0) {
    context.push("");
    context.push(`=== الوضعيات التعليمية المنجزة (من Teacher OS) ===`);
    context.push(`عدد الوضعيات المنجزة: ${params.completedSituations.length}`);
    params.completedSituations.forEach((situation, index) => {
      const section = situation.sectionTitle ? `[${situation.sectionTitle}]` : "";
      const num = situation.situationNumber ? ` (الوضعية ${situation.situationNumber})` : "";
      context.push(`${index + 1}. ${section}${num} ${situation.title}`);
      if (situation.objectives) {
        context.push(`   الأهداف: ${situation.objectives}`);
      }
      if (situation.competencies) {
        context.push(`   الكفاءات: ${situation.competencies}`);
      }
    });
  }

  // Rubric criteria (معايير شبكة التقويم الرسمية لوضعية الإدماج)
  if (rule.rubricCriteria && rule.rubricCriteria.length > 0) {
    context.push("");
    context.push(`=== معايير شبكة التقويم الرسمية (وضعية الإدماج) ===`);
    context.push(`المعايير ومؤشراتها: ${rule.rubricCriteria.join("، ")}`);
    context.push(`أرفق لكل سؤال العلامة المخصصة له، وللإجابة النموذجية شبكة تقويم مطابقة لشبكة التقويم الرسمية، مع مراعاة الأجوبة المتوقعة وتوزيع العلامات إلى جزئية وإجمالية من النصف إلى النقطة`);
  }

  // Question distribution guidance
  context.push("");
  context.push(`=== شروط صياغة الأسئلة (دليل 2018) ===`);
  context.push(`1. التدرج من البسيط إلى المركب مراعاةً للقدرات العقلية للمتعلم`);
  context.push(`2. استعمال مصطلحات متداولة لا تقبل التأويل`);
  context.push(`3. ترقيم الأسئلة (التعليمة) ووضع العلامة المخصصة لكل جزء من السؤال`);
  context.push(`4. انسجام الكم المعرفي مع الحجم الساعي المخصص للامتحان`);
  context.push(`5. مواضيع من ابتكار المصمم غير مستهلكة وفي متناول المترشح المتوسط`);
  context.push(`6. التقيد بالمنهاج الرسمي والوثيقة المرافقة والمخططات السنوية لبناء التعلمات`);

  return context.join("\n");
}

/**
 * Generate the official exam header
 */
export function getExamHeader(gradeLevel: string, subject: string): string {
  const rule = getAssessmentRule(gradeLevel, subject);
  if (!rule) return "";

  return `الجمهورية الجزائرية الديمقراطية الشعبية
وزارة التربية الوطنية
المستوى: ${gradeLevel}
المادة: ${subject}
المدة: ${rule.duration}
المجموع: ${rule.totalPoints} نقطة
${rule.examType === "combined" ? `\nتوزيع النقاط:\n${rule.weights.map(w => `- ${w.label}: ${w.points} نقطة`).join("\n")}` : ""}
${"─".repeat(50)}`;
}

// ─── Future Rule Extension Points ──────────────────────────────
// يمكن إضافة قواعد جديدة هنا مباشرة دون تعديل أي كود آخر

/**
 * Future: Add new rules programmatically
 * This allows updating rules from a config file or admin panel
 */
export function addRule(key: string, rule: AssessmentRule): void {
  RULES[key] = rule;
}

/**
 * Future: Update existing rules
 */
export function updateRule(key: string, updates: Partial<AssessmentRule>): boolean {
  if (!RULES[key]) return false;
  RULES[key] = { ...RULES[key], ...updates };
  return true;
}

/**
 * Future: Get all rules as JSON (for admin panel or export)
 */
export function getRulesAsJSON(): string {
  return JSON.stringify(RULES, null, 2);
}
