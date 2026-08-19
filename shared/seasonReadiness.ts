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

export type WeeklyScheduleRow = {
  classId: number;
  dayOfWeek: string;
  periodIndex: number;
  subject: string;
};

type WeeklyLesson = {
  id: number;
  classId: number | null;
  subject: string | null;
  situationId: number | null;
  situationTitle: string | null;
  isCompleted: boolean;
};

type WeeklySituation = {
  id: number;
  situationNumber: number;
  title: string;
  isCompleted: boolean;
  sessionStatus: string | null;
};

/**
 * يلخّص جاهزية الأسبوع القادم لكل قسم: الوضعية التالية المقررة في حصص الأسبوع
 * وحالة مذكرتها، وحالات التأجيل والإلغاء التي تتطلب متابعة.
 * المنطق التربوي: كل حصة مرتبطة بوضعية؛ «الوضعية التالية» هي أول وضعية لم تُنجز
 * في ترتيب الخطة، ولا حاجة لأن يعرف الأستاذ أي حصة تحملها — يراه في التقرير نفسه.
 */
export function buildWeeklyReadiness(
  schedule: WeeklyScheduleRow[],
  lessons: WeeklyLesson[],
  situations: WeeklySituation[],
) {
  const rowsByClass = new Map<number, WeeklyScheduleRow[]>();
  for (const row of schedule) {
    const list = rowsByClass.get(row.classId) ?? [];
    list.push(row);
    rowsByClass.set(row.classId, list);
  }

  const lessonsByClass = new Map<number, WeeklyLesson[]>();
  for (const lesson of lessons) {
    if (lesson.classId == null) continue;
    const list = lessonsByClass.get(lesson.classId) ?? [];
    list.push(lesson);
    lessonsByClass.set(lesson.classId, list);
  }

  const items = Array.from(rowsByClass.entries()).map(([classId, rows]) => {
    const classLessons = lessonsByClass.get(classId) ?? [];

    // الوضعية التالية لكل قسم: أول وضعية لم تُنجز فعلاً.
    const unfinished = situations.filter((s) => !s.isCompleted);
    const nextSituation = unfinished.length > 0 ? unfinished[0] : null;

    // حالة التأجيل أو الإلغاء التي تحتاج متابعة الأسبوع القادم.
    const deferred = situations.filter(
      (s) => s.sessionStatus === "postponed" || s.sessionStatus === "partial" || s.sessionStatus === "cancelled",
    );

    // حصص الأسبوع لكل مادة: كم حصة متبقية دون وضعية منجزة.
    const lessonsBySubject = new Map<string, number>();
    for (const lesson of classLessons) {
      if (lesson.subject) lessonsBySubject.set(lesson.subject, (lessonsBySubject.get(lesson.subject) ?? 0) + 1);
    }
    const subjectSchedule = new Map<string, number>();
    for (const row of rows) {
      if (SEASON_SUBJECTS.includes(row.subject as SeasonSubject)) {
        subjectSchedule.set(row.subject, (subjectSchedule.get(row.subject) ?? 0) + 1);
      }
    }

    const pendingBySubject: Record<string, number> = {};
    let lessonsReady = 0;
    for (const subject of Array.from(subjectSchedule.keys())) {
      const hours = subjectSchedule.get(subject) as number;
      const delivered = lessonsBySubject.get(subject) ?? 0;
      pendingBySubject[subject] = Math.max(0, hours - delivered);
      if (delivered > 0) lessonsReady += 1;
    }

    const pendingHours = Object.values(pendingBySubject).reduce((sum, value) => sum + value, 0);

    return {
      classId,
      nextSituation: nextSituation ? { id: nextSituation.id, title: nextSituation.title, situationNumber: nextSituation.situationNumber } : null,
      hasDeferred: deferred.length > 0,
      pendingHours,
      pendingBySubject,
      subjectSchedule,
      subjectLessons: lessonsBySubject,
      lessonsReady,
      totalScheduledHours: subjectSchedule.size > 0 ? subjectSchedule.size : 0,
      rowsCount: rows.length,
    };
  });

  return {
    totalScheduledHours: items.reduce((sum, item) => sum + item.rowsCount, 0),
    totalPendingHours: items.reduce((sum, item) => sum + item.pendingHours, 0),
    classesWithDeferred: items.filter((item) => item.hasDeferred).length,
    items,
  };
}
