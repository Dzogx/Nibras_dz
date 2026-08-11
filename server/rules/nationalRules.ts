/**
 * National Assessment Rules Engine (محرك القواعد الوطنية للتقويم)
 *
 * هذا المحرك المركزي يحتوي على جميع القواعد الرسمية الخاصة بالتقويم
 * في التعليم المتوسط الجزائري لمادة الدراسات الاجتماعية.
 *
 * أي تحديث للقواعد يتم من مكان واحد فقط هنا.
 */

// ─── Types ─────────────────────────────────────────────────────

export interface SubjectWeight {
  subject: string;
  points: number;
  label: string;
}

export interface AssessmentRule {
  gradeLevel: string;
  subject: string;
  totalPoints: number;
  duration: string;
  examType: "combined" | "independent";
  weights: SubjectWeight[];
  maxQuestions: number;
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
    description: "اختبار واحد يجمع التاريخ والجغرافيا (شهادة التعليم المتوسط)، التاريخ 13 نقطة والجغرافيا 7 نقاط",
  },

  // التربية المدنية - جميع المستويات
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
    description: "اختبار مستقل، 20 نقطة، المدة ساعة واحدة",
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

export const BLOOM_LEVELS = [
  { id: "remember", name: "تذكر", nameAr: "تذكر", weight: 0.2 },
  { id: "understand", name: "فهم", nameAr: "فهم", weight: 0.2 },
  { id: "apply", name: "تطبيق", nameAr: "تطبيق", weight: 0.2 },
  { id: "analyze", name: "تحليل", nameAr: "تحليل", weight: 0.15 },
  { id: "evaluate", name: "تقييم", nameAr: "تقييم", weight: 0.15 },
  { id: "create", name: "إبداع", nameAr: "إبداع", weight: 0.1 },
];

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
 * Returns how many questions should target each bloom level
 */
export function getBloomDistribution(numQuestions: number, rule?: AssessmentRule): { bloomId: string; count: number; name: string }[] {
  const distribution = [];
  let remaining = numQuestions;

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
 * This creates the curriculum-context block for AI generation
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
  // Question distribution guidance
  context.push("");
  context.push(`=== توزيع الأسئلة المقترح ===`);
  const bloomDist = getBloomDistribution(rule.maxQuestions, rule);
  bloomDist.forEach(d => {
    context.push(`- ${d.name}: ${d.count} سؤال`);
  });

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
