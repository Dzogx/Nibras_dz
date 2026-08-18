export const SCHOOL_WEEK_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;

export type WeeklyScheduleSlot = {
  dayOfWeek: string;
  periodIndex: number;
};

/**
 * ترتب حصص جدول الخدمة داخل أيام العمل الفعلية للأستاذ، وتُبقي الأيام الخالية
 * ظاهرة حتى لا يبدو الأسبوع مكتملًا بالخطأ عند نسيان حصة أو أكثر.
 */
export function groupWeeklyScheduleByDay<T extends WeeklyScheduleSlot>(slots: readonly T[] | undefined) {
  return SCHOOL_WEEK_DAYS.map((day) => ({
    day,
    slots: (slots ?? [])
      .filter((slot) => slot.dayOfWeek === day)
      .slice()
      .sort((first, second) => first.periodIndex - second.periodIndex),
  }));
}
