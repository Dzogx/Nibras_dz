/**
 * محرك اقتراح استراتيجيات التعلّم النشط لحصص الدراسات الاجتماعية
 * (منهاج التعليم المتوسط الجزائري)
 *
 * يعمل بمستويين:
 * 1. المطابقة الثابتة: مصفوفة استراتيجيات مُهندسة تربويًا مطابقة بنوع الوضعية والمادة.
 * 2. التوليد الذكي (اختياري): بناء سياق تربوي كامل (الكفاءة الختامية، وضع التملك،
 *    الموارد المعرفية، معايير ومؤشرات التملك، الحجم الساعي) وتمريره لنموذج لغوي
 *    ليتولى هندسة استراتيجية مخصصة داخل الإطار البيداغوجي نفسه، مع حراسات صارمة.
 */

import { invokeLLM } from "./_core/llm";

export type Subject = "history" | "geography" | "civics" | string;

export type GradeLevel = "1AM" | "2AM" | "3AM" | "4AM" | string;

export interface StrategyPhase {
  stage: string;
  minutes: number;
  teacherRole: string;
  studentRole: string;
  tips: string;
}

export interface SuggestedStrategy {
  kind: "learning" | "integrative";
  name: string;
  rationale: string;
  phases: StrategyPhase[];
  totalMinutes: number;
  generalTips: string[];
}

// ─── المكتبة الثابتة (المطابقة الكلاسيكية) ────────────────────────

export function normalizeSubject(subject: Subject): string {
  const s = String(subject || "");
  if (s === "history" || s.includes("تاريخ")) return "history";
  if (s === "geography" || s.includes("جغرافيا")) return "geography";
  if (s === "civics" || s.includes("مدنية") || s.includes("civic")) return "civics";
  return s;
}

export function detectSituationKind(title: string, content?: string): "learning" | "integrative" {
  const text = `${title} ${content || ""}`;
  const integrative = /إدماج/i;
  return integrative.test(text) ? "integrative" : "learning";
}

const INTEGRATIVE_STRATEGIES = [
  {
    subject: "all",
    strategy: {
      kind: "integrative" as const,
      name: "حل الوضعية الإدماجية بمنهجية الأدوات",
      rationale: "وضعية الإدماج تختبر التملك الحقيقي: تلميذ واحد يواجه وضعًا مركّبًا لا يُحلّ بذكر حقيقة واحدة. المنهجية المعتمدة في المنهاج الجزائري (الملاءمة، استعمال أدوات المادة، المنهجية، الإتقان والتمييز) تُعلَّم مرحلة مرحلة حتى يصبح حلّ الوضعية مهارة متقنة لا مفاجأة في الاختبار.",
      totalMinutes: 55,
      phases: [
        { stage: "تعرّف الوضعية", minutes: 5, teacherRole: "يعرض وضعية الإدماج كاملة (سياق، سندات، تعليمة) ويقرأها قراءة صامتة جماعية", studentRole: "يقرأ ويحدد العناصر: ماذا طُلب؟ ما السندات؟ ما المادة المستهدفة؟", tips: "لا تشترط الحلّ الآن — الهدف قراءة الوضعية قراءة منهجية" },
        { stage: "تحليل السندات", minutes: 10, teacherRole: "يقود تحليلًا للسندات (خريطة، نص تاريخي، وثيقة قانونية): ماذا تعطي؟ ماذا تُخفي؟", studentRole: "يستخرج المعلومات ذات الصلة فقط ويصنّفها في جدول", tips: "تدريب استخلاص المعلومات هو 40% من الإتقان — خصّص له وقتًا" },
        { stage: "الربط بالمكتسبات", minutes: 10, teacherRole: "يربط كل سَند بالكفاءة والموارد التي درُسها التلاميذ في المقطع", studentRole: "يحدد الموارد المعرفية التي يحتاجها الحل ويحدد الفجوة", tips: "الوضعية لا تُحلّ بموارد المقطع الحالي فقط — اربطها بالمكتسبات السابقة" },
        { stage: "صياغة الحلّ التدريجي", minutes: 15, teacherRole: "يقترح حلَّ نموذجٍ جزئيًا ثم يسحب الدعائم (scaffolding) تدريجيًا", studentRole: "يحلّ فرديًا أولًا ثم يشارك في المجموعة ويناقش اختلافات الحلول", tips: "سحب الدعائم هو جوهر الإدماج: من الحلّ الموجّه إلى الحلّ المستقل" },
        { stage: "المعايرة بشبكة التقويم", minutes: 10, teacherRole: "يعرض شبكة التقويم الرسمية (الملاءمة/أدوات المادة/المنهجية/الإتقان) ويصحح عينات", studentRole: "يصحّح حلّ زميل بالشبكة ويعلّل تقديره لكل معيار", tips: "التصحيح المتبادل بالشبكة يقوّم الفهم ويحضّر للتقويم الذاتي في الاختبار" },
        { stage: "الختام", minutes: 5, teacherRole: "يحدد مع التلاميذ مؤشرات النضج لكل معيار ويوجّههم لقائمة المراجعة", studentRole: "يحدد مستواه بكل معيار ويختار تمرينًا علاجيًا", tips: "مؤشرات النضج تُكتب على السبورة وتُستخدم في دفتر التنقيط" },
      ],
      generalTips: [
        "التعليمة (السؤال) هي قلب الوضعية — حلّلها مع التلاميذ كلمة كلمة",
        "درّب على شبكة التقويم الرسمية: الملاءمة، أدوات المادة، المنهجية، الإتقان والتمييز",
        "لا تحلّ الوضعية بنفسك أمامهم كاملًا — قدّم نموذجًا جزئيًا واسحب الدعائم",
        "استعمل الوضعيات الإدماجية من بنك التقويمات في المكتبة لمحاكاة الاختبار الفصلي",
      ],
    },
  },
];

const LEARNING_STRATEGIES = [
  {
    subject: "history",
    strategy: {
      kind: "learning" as const,
      name: "التحقيق التاريخي (من الوثيقة إلى الاستنتاج)",
      rationale: "التاريخ يُبنى بالمعالجة الوثائقية: وثيقة تاريخية (نص، صورة، خريطة تاريخية) تُقرأ وتحلّل ويستنتج منها التلميذ نفسُه الحقيقة التاريخية، بدل تلقينها جاهزة. هذه المنهجية تحقق هدف المنهاج: «التاريخ وثيقة قبل أن يكون خلاصة».",
      totalMinutes: 55,
      phases: [
        { stage: "الاسترجاع والوضعية", minutes: 5, teacherRole: "يسترجع المكتسب السابق بسؤالين سريعين ويطرح التساؤل المحوري للحصة", studentRole: "يجيب ويستشعر الفجوة بين ما يعرفه وما سيكتشفه", tips: "التساؤل المحوري هو خيط الحصة كله — أعد صياغته حتى يفهمه الجميع" },
        { stage: "قراءة الوثيقة وتحليلها", minutes: 12, teacherRole: "يعرض الوثيقة ويقود قراءة منهجية (طبيعتها، مصدرها، زمنها، مضمونها)", studentRole: "يقرأ ويستخرج المعلومات الصريحة ويستنتج الضمنية", tips: "درّب على أسئلة الفهم: ماذا؟ متى؟ أين؟ من؟ لماذا؟" },
        { stage: "الاستنتاج التشاركي", minutes: 12, teacherRole: "يطرح أسئلة تؤدي إلى الاستنتاج التاريخي من الوثيقة (استجواب متدرج)", studentRole: "يبرهن ويستنتج بصيغته الخاصة ويواجه استنتاجات زملائه", tips: "الاستنتاج الذي يقوله التلميذ يُذكر ثلاثة أضعاف الاستنتاج الذي يسمعه" },
        { stage: "تثبيت المفهوم وربطه", minutes: 8, teacherRole: "يثبّت الخلاصة على السبورة ويضبط المفردات التاريخية ويكمل خط الزمن", studentRole: "ينسخ الخلاصة ويضيفها لخط الزمن/الخريطة الذهنية في دفتره", tips: "خط الزمن التدريجي (يُبنى حصة حصة) هو أداة المراجعة قبل الاختبار" },
        { stage: "التثبيت والترسيخ", minutes: 8, teacherRole: "ينظم تمرينين متدرجين (استرجاع سريع + تطبيق) ويصحح فوريًا", studentRole: "ينجز ويصحح بنفسه مستعملًا سلم التصحيح المعلن", tips: "سلم التصحيح المعلن يدرّب على التقويم الذاتي — مهارة قبل الاختبار" },
        { stage: "الاستثمار", minutes: 7, teacherRole: "يعرض سؤالًا من مستوى بلوم مرتفع (تحليل أو تركيب) في سياق جديد", studentRole: "ينجزه فرديًا على الدفتر", tips: "سؤال الاستثمار هو نفسه نمط أسئلة التقويم التحصيلي: درّب الآن قبل الاختبار" },
        { stage: "الختام والتقويم الذاتي", minutes: 3, teacherRole: "يطرح سؤالًا ختاميًا يجمع المفهوم الجديد بالمكتسب القديم", studentRole: "يقيّم فهمه الذاتي (أعرف / أحتاج مراجعة)", tips: "قائمة «أحتاج مراجعة» هي مدخل العلاج في دفتر التنقيط" },
      ],
      generalTips: [
        "الوثيقة التاريخية أولًا، الخلاصة بعد: الوثيقة هي المورد لا الخاتمة",
        "وزع أسئلتك: 60% تذكر وفهم وتطبيق — 40% تحليل وتركيب (بلوم)",
        "إذا لم يجب أحد، أعد صياغة السؤال لا الإجابة",
        "وثّق المخطط الزمني أو المفاهيمي في المكتبة لإعادة استعماله في التقويم",
      ],
    },
  },
  {
    subject: "geography",
    strategy: {
      kind: "learning" as const,
      name: "رحلة الاستكشاف الجغرافي (من الوثيقة إلى المفهوم)",
      rationale: "الجغرافيا تُبنى من التمثيل المكاني إلى المفهوم. الاستراتيجية تقلب المسار التقليدي: وثيقة (خريطة/رسم/جدول) تتحدث أولًا، ثم يتركب المفهوم من ملاحظتها — فتصبح الوثيقة هي الدرس لا مجرد سند له.",
      totalMinutes: 55,
      phases: [
        { stage: "الاستكشاف البصري الصامت", minutes: 7, teacherRole: "يعرض الوثيقة (خريطة، رسم مناخي، جدول) دون تعليق ويترك دقيقتين للملاحظة الحرة ثم يجمع ملاحظات التلاميذ", studentRole: "يلاحظ ويصف ما يراه دون تفسير (أرقام، ألوان، تسميات، اتجاهات)", tips: "منع التفسير المبكر يدرّب على الملاحظة الموضوعية — شرط القراءة الجغرافية" },
        { stage: "الاستجواب المتدرج", minutes: 12, teacherRole: "يطرح أسئلة تحليلية متدرجة تربط عناصر الوثيقة بالمكتسبات (أين؟ لماذا هناك؟ ما العلاقة؟)", studentRole: "يفسر ويربط ويعلل مستخدمًا المؤشرات", tips: "اسأل عن السببية الجغرافية دائمًا: لماذا هنا وليس هناك؟" },
        { stage: "بناء المفهوم تشاركيًا", minutes: 12, teacherRole: "يقود صياغة التعريف/المفهوم الجغرافي من كلمات التلاميذ ويثبته على السبورة", studentRole: "يشارك في الصياغة ثم ينسخ المفهوم بمفرداته", tips: "المفهوم الجغرافي يجب أن يُصاغ مرة على الأقل من قبل التلاميذ لا أن يُنسخ فقط" },
        { stage: "التحويل والتطبيق", minutes: 12, teacherRole: "يطلب التحويل من وثيقة لأخرى (من الخريطة إلى رسم، من الجدول إلى نص) ويصحح", studentRole: "ينجز التحويل ويصحح بمساعدة سلم التصحيح", tips: "التحويل هو أقوى مؤشر على التملك الجغرافي للمفهوم" },
        { stage: "الاستثمار والتقييم", minutes: 9, teacherRole: "يطرح سؤالًا استثماريًا في سياق مكاني جديد ويجمع العينات", studentRole: "ينجز السؤال ويقيس تقدمه", tips: "سؤال الاستثمار يجب أن يتطلب المفهوم الجديد لا استرجاع حقائق" },
        { stage: "الختام", minutes: 3, teacherRole: "يربط المفهوم الجديد بالوضعيات القادمة في المخطط السنوي", studentRole: "يحدد ما يحتاج مراجعة", tips: "ربط الحصة بالمخطط يُشعر التلميذ بالمسار لا بالحصص المنفصلة" },
      ],
      generalTips: [
        "الوثيقة الجغرافية هي قلب الحصة: اختر وثيقة واحدة قوية بدل ثلاث وثائق متناثرة",
        "درّب على المفردات الجغرافية الشفهية قبل الكتابية",
        "وثّق خريطة أو رسم الحصة في المكتبة لإعادة استعماله في التقويم التحصيلي",
        "المؤشرات الكمية (نسب، تراكيز) تُقرأ دائمًا بالمقارنة لا بالقيمة المطلقة",
      ],
    },
  },
  {
    subject: "civics",
    strategy: {
      kind: "learning" as const,
      name: "الحوار السقراطي بالوثيقة القانونية المرجعية",
      rationale: "التربية المدنية تُبنى على القيم والوثائق المرجعية (دستور، قانون، ميثاق). الحوار السقراطي المتدرج يوصل التلميذ بنفسه من النص القانوني إلى القيمة والممارسة، بدل تلقين القيمة كعبارة جاهزة.",
      totalMinutes: 55,
      phases: [
        { stage: "الاسترجاع والوضعية", minutes: 5, teacherRole: "يسترجع القيم المرتبطة بالدرس ويطرح موقفًا حياتيًا محيّرًا (معضلة أخلاقية/مواطنة)", studentRole: "يتعرف على المعضلة ويصيغ انطباعه الأولي", tips: "المعضلة المحيّر أفضل من السؤال المباشر: يولّد فضولًا حقيقيًا" },
        { stage: "الحوار السقراطي", minutes: 15, teacherRole: "يقود حوارًا بأسئلة متدرجة: ماذا يقول النص؟ ماذا يعني؟ ماذا يحدث لو أُخالف؟ ما القيمة الكامنة؟", studentRole: "يجيب، يعترض، يبرر، يعدّل رأيه أمام الحجة", tips: "لا تصحح رأيًا فورًا — اسأل عن مرجعيته أولًا" },
        { stage: "قراءة الوثيقة المرجعية", minutes: 10, teacherRole: "يوزع الوثيقة القانونية المبسطة ويوجه قراءة تحليلية (من يخاطب؟ ما الحق/الواجب؟)", studentRole: "يقرأ ويستخرج الحقوق والواجبات المرتبطة بالوضعية", tips: "وثيقة مبسطة لا حرفية: اقتبس المادة ولا تلزم التلميذ بنصها الحرفي" },
        { stage: "الربط والبناء", minutes: 10, teacherRole: "يجمع خيوط الحوار ويبني مع التلاميذ قاعدة الدرس (الحق/الواجب/القيمة)", studentRole: "يشارك في الصياغة ويحرر خلاصة الدرس", tips: "قاعدة الدرس = جملة تُحفظ + مثال من الحياة + مرجعية" },
        { stage: "التطبيق والممارسة", minutes: 10, teacherRole: "يقترح موقفًا تطبيقيًا ويطلب قرارًا مستندًا إلى القاعدة", studentRole: "يحل الموقف مطبقًا القاعدة ويبرر", tips: "التطبيق بالموقف المحيّر هو تقويم حقيقي للفهم لا للحفظ" },
        { stage: "الختام", minutes: 5, teacherRole: "يطرح سؤالًا ختاميًا يربط القيمة بالحياة اليومية خارج المدرسة", studentRole: "يحدد التزامًا شخصيًا مرتبطًا بالقيمة", tips: "الالتزام الشخصي (حتى لو رمزي) يجعل القيمة سلوكًا لا عبارة" },
      ],
      generalTips: [
        "القيمة تُبنى بالممارسة والحوار: لا تُلقن كجملة في السبورة",
        "وثّق المعضلات الأخلاقية التي نجحت في المكتبة لإعادة استعمالها",
        "احترم تعدد الآراء داخل إطار القيم: الاختلاف مقبول، التنمر لا",
        "اربط الحصة بالمواد الأخرى (التاريخ خصوصًا) لتعزيز التكامل",
      ],
    },
  },
];

// ─── واجهة المحرك الثابت ──────────────────────────────────────────

export interface StrategyInput {
  title: string;
  content?: string;
  subject: Subject;
  gradeLevel?: GradeLevel;
}

/**
 * يقترح الاستراتيجية الأنسب لوضعية حسب مادتها ونوعها.
 * لا يعتمد على مستوى القسم في المطابقة (المكتبة الحالية لا تميّز
 * الاستراتيجيات حسب 1AM-4AM) لكن يحتفظ به للعرض والتوسعة.
 */
export function suggestStrategyForSituation(input: StrategyInput): SuggestedStrategy {
  const kind = detectSituationKind(input.title, input.content);
  const pool = kind === "integrative" ? INTEGRATIVE_STRATEGIES : LEARNING_STRATEGIES;
  const subject = normalizeSubject(input.subject);
  // 1) مطابقة المادة، 2) تطابق كلّي، 3) افتراضي أولى المصفوفة
  const match = pool.find(m => m.subject === subject) ?? pool.find(m => m.subject === "all") ?? pool[0];
  return { ...match.strategy, kind };
}

// ─── المولّد الذكي بالذكاء الاصطناعي ──────────────────────────────

/** سياق المقطع الكامل الذي يُبنى عليه الموجّه التربوي للمولّد. */
export interface CompetencySectionContext {
  /** عنوان الوضعية */
  situationTitle: string;
  /** نص الكفاءة الشاملة للمستوى (منهاج الوزارة) */
  globalCompetency?: string;
  /** نص الكفاءة الختامية للمقطع */
  termCompetency?: string;
  /** وضع التملك: تنصيب / إنماء / إدماج */
  competencyAction?: string;
  /** الموارد المعرفية [{title, action}] */
  knowledgeResources?: Array<{ title: string; action?: string }>;
  /** معايير ومؤشرات التملك [{criterion, indicators}] */
  criteria?: Array<{ criterion: string; indicators?: unknown[] }>;
  /** الحجم الساعي للمقطع (ساعات) */
  durationHours?: number | null;
  /** المادة */
  subject: Subject;
  /** المستوى */
  gradeLevel?: GradeLevel;
  /** مدة الحصة الواحدة بالدقائق (افتراضي 55) */
  sessionMinutes?: number;
}

const ACTION_GUIDANCE: Record<string, string> = {
  "تنصيب": "هذا أول تماس للتلاميذ مع المورد — ابدأ دائمًا من الملموس إلى المجرد، واستعمل العرض الحسي والتشخيص القبلي، وأدخل ببطء نحو التجريد. وازن بين التعريف الصريح والملاحظة.",
  "إنماء": "التلاميذ يمتلكون أساسًا — اربط المورد الجديد بما سبق، واستعمل المقارنة والتحويل وحل المشكلات الجزئية، وارفع تدريجيًا نحو التجريد والتعليل.",
  "إدماج": "هدف الحصة توظيف المكتسبات في وضعية مركّبة — قلّل الشرح المباشر، وأعطِ وزنًا كبيرًا للممارسة المستقلة والتصحيح المتبادل ومحاكاة نمط أسئلة التقويم التحصيلي.",
};

/**
 * يبني النص التربوي الموجّه الذي يُمرَّر للنموذج اللغوي.
 * موجّه صارم: يُلزم النموذج بالإطار البيداغوجي ولا يسمح له باختراع محتوى منهاجي.
 */
export function buildLLMPrompt(ctx: CompetencySectionContext): string {
  const subjectLabel = normalizeSubject(ctx.subject);
  const subjectAr = subjectLabel === "history" ? "التاريخ" : subjectLabel === "geography" ? "الجغرافيا" : subjectLabel === "civics" ? "التربية المدنية" : String(ctx.subject);
  const gradeAr = String(ctx.gradeLevel || "");
  const actionGuidance = ACTION_GUIDANCE[String(ctx.competencyAction || "")] || ACTION_GUIDANCE["إنماء"];
  const durationMinutes = (Number(ctx.durationHours) || 0) * 60 || (Number(ctx.sessionMinutes) || 55);
  const resourcesText = Array.isArray(ctx.knowledgeResources) && ctx.knowledgeResources.length
    ? ctx.knowledgeResources.map((r, i) => `${i + 1}. ${String(r.title || "")}${r.action ? ` (${r.action})` : ""}`).join("\n")
    : "غير محددة في المقطع — اعتمد عنوان الوضعية والكفاءة الختامية فقط ولا تخترع موارد جديدة";
  const criteriaText = Array.isArray(ctx.criteria) && ctx.criteria.length
    ? ctx.criteria.map(c => `• ${String(c.criterion || "")}${Array.isArray(c.indicators) && c.indicators.length ? ` — المؤشرات: ${c.indicators.map(i => String(i)).join("، ")}` : ""}`).join("\n")
    : "غير محددة — صِغ أدوارك وأنشطتك بحيث تكون قابلة للتقويم عمومًا";
  const globalText = ctx.globalCompetency ? `\nالكفاءة الشاملة للمستوى (الإطار النهائي الذي تخدمه هذه الحصة): «${ctx.globalCompetency}»` : "";
  const termText = ctx.termCompetency ? `\nالكفاءة الختامية للمقطع (ما يجب أن يتملكه التلميذ بنهاية المقطع): «${ctx.termCompetency}»` : "";

  return [
    `أنت مهندس بيداغوجي خبير في منهاج الدراسات الاجتماعية للتعليم المتوسط الجزائري وفي بيداغوجيات التعلم النشط (التحقيق التاريخي، الاستكشاف الجغرافي، الحوار السقراطي، حل الوضعية الإدماجية).`,
    `صمّم استراتيجية تسيير حصة واحدة لوضعية تعلّمية/إدماجية ضمن المقطع التالي:`,
    `- المادة: ${subjectAr}`,
    gradeAr ? `- المستوى: ${gradeAr}` : null,
    `- الوضعية: «${ctx.situationTitle}»`,
    termText,
    globalText,
    `- وضع التملك: ${ctx.competencyAction || "غير محدد"} — ${actionGuidance}`,
    `- الحجم الساعي للمقطع: ${durationMinutes} دقيقة في كل حصة`,
    `- الموارد المعرفية للمقطع:\n${resourcesText}`,
    `- معايير ومؤشرات تملك المقطع:\n${criteriaText}`,
    "",
    `قواعد إلزامية صارمة (أي إخلال بها يعني فشل المهمة):`,
    `1. المحتوى المنهاجي مقيّد بما هو معروض أعلاه فقط — لا تخترع وثائق أو تواريخ أو أحداثًا أو حقائق لم تُذكر.`,
    `2. المدة الإجمالية يجب أن تساوي ${durationMinutes} دقيقة بالضبط (مجموع مراحل التسيير) — لا تجاوزها ولا تقلّ عنها.`,
    `3. بنية الحصة: افتتاح/استرجاع (5-8 د) ثم نشاط بنيوي مركزي من بيداغوجيات التعلم النشط يتدرج من المورد إلى الاستنتاج (25-35 د) ثم تثبيت وترسيخ (8-12 د) ثم استثمار بسؤال من مستوى بلوم مرتفع (5-10 د) ثم ختام وتقويم ذاتي (3-5 د).`,
    `4. لكل مرحلة حدد بدقة: اسم المرحلة، مدتها بالدقائق، دور الأستاذ (فعل ملموس)، دور التلميذ (سلوك قابل للملاحظة)، ونصيحة تربوية قصيرة.`,
    `5. درجة توجيه الأستاذ تتناسب مع وضع التملك: أكثر توجيهًا في التنصيب، وأقل تدخلًا وأكثر ممارسة مستقلة في الإدماج.`,
    `6. الصياغة بالعربية الفصحى التربوية المعتمدة في المذكرات الجزائرية، موجزة ومباشرة، دون حشو إنشائي.`,
    `7. اسم الاستراتيجية يعكس المنهجية والموارد الفعلية (مثلًا: «التحقيق التاريخي بوثيقة: ...»)، والتبرير يوضح لماذا تناسب هذه الوضعية تحديدًا.`,
    `8. النصائح العامة (4 نصائح): عملية، مرتبطة بالوثيقة والمادة، قابلة للتطبيق فورًا في القسم.`,
    "",
    `أجب بتنسيق JSON مطابق تمامًا للمخطط المطلوب.`,
  ].filter(Boolean).join("\n");
}

const STRATEGY_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "اسم الاستراتيجية بالعربية" },
    rationale: { type: "string", description: "التبرير التربوي لماذا تناسب هذه الوضعية تحديدًا" },
    totalMinutes: { type: "integer", description: "المدة الإجمالية للدقائق (مجموع المراحل)" },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string", description: "اسم المرحلة بالعربية" },
          minutes: { type: "integer", description: "مدة المرحلة بالدقائق" },
          teacherRole: { type: "string", description: "دور الأستاذ: فعل ملموس" },
          studentRole: { type: "string", description: "دور التلميذ: سلوك قابل للملاحظة" },
          tips: { type: "string", description: "نصيحة تربوية قصيرة" },
        },
        required: ["stage", "minutes", "teacherRole", "studentRole", "tips"],
        additionalProperties: false,
      },
      description: "مراحل تسيير الحصة بالترتيب الزمني (6-7 مراحل)",
    },
    generalTips: {
      type: "array",
      items: { type: "string" },
      description: "4 نصائح عامة عملية",
    },
  },
  required: ["name", "rationale", "totalMinutes", "phases", "generalTips"],
  additionalProperties: false,
} as const;

function parseLLMStrategy(raw: string, kind: "learning" | "integrative"): SuggestedStrategy | null {
  const clean = String(raw || "").trim();
  // إزالة أي ترميز markdown حول JSON
  const jsonText = clean.replace(/^```(?:json)?\s*|\s*```$/g, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  const obj = parsed as Record<string, unknown>;
  if (!obj || typeof obj !== "object") return null;
  const phases = Array.isArray(obj.phases) ? (obj.phases as Array<Record<string, unknown>>) : [];
  if (phases.length < 4) return null;
  const parsedPhases = phases.map(p => ({
    stage: String(p.stage || ""),
    minutes: Math.max(1, Math.round(Number(p.minutes) || 1)),
    teacherRole: String(p.teacherRole || ""),
    studentRole: String(p.studentRole || ""),
    tips: String(p.tips || ""),
  })).filter(p => p.stage);
  if (parsedPhases.length < 4) return null;
  const totalMinutes = Number(obj.totalMinutes) || parsedPhases.reduce((s, p) => s + p.minutes, 0);
  const generalTips = Array.isArray(obj.generalTips)
    ? (obj.generalTips as unknown[]).filter(t => typeof t === "string").slice(0, 6)
    : [];
  return {
    kind,
    name: String(obj.name || "استراتيجية مخصصة"),
    rationale: String(obj.rationale || ""),
    phases: parsedPhases,
    totalMinutes,
    generalTips,
  };
}

/**
 * يولّد استراتيجية مخصصة بالذكاء الاصطناعي انطلاقًا من السياق التربوي الكامل.
 * عند أي فشل (استجابة غير صالحة أو نموذج غير متاح) يعود تلقائيًا للمطابقة الثابتة.
 */
export async function suggestStrategyWithLLM(
  ctx: CompetencySectionContext,
): Promise<{ strategy: SuggestedStrategy; source: "ai" | "static"; note?: string }> {
  const kind = detectSituationKind(ctx.situationTitle);
  const staticFallback = suggestStrategyForSituation({
    title: ctx.situationTitle,
    subject: ctx.subject,
    gradeLevel: ctx.gradeLevel,
  });
  let response: unknown;
  try {
    response = await invokeLLM({
      messages: [
        { role: "system", content: buildLLMPrompt(ctx) },
        { role: "user", content: "صمّم الاستراتيجية الآن وأجب بتنسيق JSON فقط." },
      ],
      response_format: { type: "json_schema", json_schema: { name: "active_learning_strategy", strict: true, schema: STRATEGY_JSON_SCHEMA } },
      max_tokens: 2200,
    });
  } catch {
    return { strategy: staticFallback, source: "static", note: "تعذر الوصول إلى نموذج الذكاء الاصطناعي — استُعملت المطابقة الثابتة" };
  }
  const raw = typeof (response as any)?.choices?.[0]?.message?.content === "string"
    ? String((response as any).choices[0].message.content)
    : "";
  const parsed = parseLLMStrategy(raw, kind);
  if (!parsed) return { strategy: staticFallback, source: "static", note: "لم يُنتج النموذج استراتيجية صالحة — استُعملت المطابقة الثابتة" };
  return { strategy: parsed, source: "ai" };
}

/**
 * يحول الاستراتيجية إلى نص عربي جاهز للإقحام في بداية خطة المذكرة.
 */
export function formatStrategyForLesson(strategy: SuggestedStrategy): string {
  const kindLabel = strategy.kind === "integrative" ? "إدماجية" : "تعلّمية";
  const lines: string[] = [
    "استراتيجية تسيير الحصة المقترحة (التعلم النشط)",
    "─".repeat(42),
    `نوع الوضعية: ${kindLabel} | الاستراتيجية: ${strategy.name}`,
    `المدة الإجمالية: ${strategy.totalMinutes} دقيقة`,
    "",
    "لماذا هذه الاستراتيجية؟",
    strategy.rationale,
    "",
    "مراحل التسيير الزمني",
    "─".repeat(42),
  ];
  strategy.phases.forEach(p => {
    lines.push(`• ${p.stage} (${p.minutes} د)`);
    lines.push(`  دور الأستاذ: ${p.teacherRole}`);
    lines.push(`  دور التلميذ: ${p.studentRole}`);
    lines.push(`  ملاحظة: ${p.tips}`);
  });
  lines.push("");
  lines.push("نصائح عامة");
  strategy.generalTips.forEach(t => lines.push(`- ${t}`));
  return lines.join("\n");
}

export const STRATEGIES = { INTEGRATIVE_STRATEGIES, LEARNING_STRATEGIES };
