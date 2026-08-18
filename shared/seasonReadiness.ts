export const SEASON_SUBJECTS = ["التاريخ", "الجغرافيا", "التربية المدنية"] as const;

export type SeasonSubject = (typeof SEASON_SUBJECTS)[number];

type ReadinessClass = {
  id: number;
  name: string;
  gradeLevel?: string | null;
  academicYear?: string | null;
};

type ReadinessPlan = {
  classId?: number | null;
  isReference?: boolean | null;
  subject?: string | null;
};

type ReadinessScheduleEntry = {
  classId: number;
  subject?: string | null;
};

const planMatchesSubject = (planSubject: string | null | undefined, subject: SeasonSubject) => {
  if (subject === "التاريخ") return planSubject === "التاريخ" || planSubject === "التاريخ والجغرافيا";
  return planSubject === subject;
};

/**
 * يحوّل بيانات الموسم الخام إلى قائمة واضحة بما ينقص كل قسم قبل البدء اليومي.
 * يقبل مخطط «التاريخ والجغرافيا» بوصفه المخطط المقابل لحصة التاريخ في المستويات
 * التي يعتمد فيها التدرج الرسمي هذا العنوان.
 */
export function buildSeasonReadiness(
  classes: ReadinessClass[],
  plans: ReadinessPlan[],
  scheduleEntries: ReadinessScheduleEntry[],
  academicYear: string,
) {
  const seasonClasses = classes.filter((classItem) => !classItem.academicYear || classItem.academicYear === academicYear);

  const items = seasonClasses.map((classItem) => {
    const scheduledSubjects = new Set(
      scheduleEntries
        .filter((entry) => entry.classId === classItem.id && SEASON_SUBJECTS.includes(entry.subject as SeasonSubject))
        .map((entry) => entry.subject as SeasonSubject),
    );
    const classPlans = plans.filter((plan) => plan.classId === classItem.id && !plan.isReference);
    const missingScheduleSubjects = SEASON_SUBJECTS.filter((subject) => !scheduledSubjects.has(subject));
    const missingPlanSubjects = SEASON_SUBJECTS.filter(
      (subject) => !classPlans.some((plan) => planMatchesSubject(plan.subject, subject)),
    );

    return {
      classId: classItem.id,
      className: classItem.name,
      gradeLevel: classItem.gradeLevel ?? "",
      missingScheduleSubjects,
      missingPlanSubjects,
      isReady: missingScheduleSubjects.length === 0 && missingPlanSubjects.length === 0,
    };
  });

  return {
    academicYear,
    totalClasses: items.length,
    readyClasses: items.filter((item) => item.isReady).length,
    incompleteClasses: items.filter((item) => !item.isReady).length,
    items,
  };
}
