/**
 * روابط المسار اليومي. يبقى معرّف الوضعية في الرابط كي تستعيد الواجهة التالية
 * عنوانها الرسمي وسياقها التربوي من الخطة السنوية بدلاً من طلب إدخاله مجدداً.
 */
export function buildQuickLessonPath(situationId: number) {
  return `/lesson-generator?situationId=${situationId}`;
}

export function buildQuickAssessmentPath(situationId: number, classId?: number) {
  const params = new URLSearchParams({ situationId: String(situationId) });
  if (classId) params.set("classId", String(classId));
  return `/assessment?${params.toString()}`;
}

export function buildQuickIntegrativeSituationPath(situationId: number, classId?: number) {
  const params = new URLSearchParams({ situationId: String(situationId) });
  if (classId) params.set("classId", String(classId));
  return `/integrative-situation?${params.toString()}`;
}

export type WeeklyScheduleSlot = {
  dayOfWeek: string;
  periodIndex: number;
  startTime: string;
  endTime: string;
};

const schoolDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

function asMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * تعيد الحصة الجارية، أو الحصة التالية في اليوم نفسه قبل انتهائها.
 * تُبقي واجهة اليوم منطلقة من جدول خدمة الأستاذ لا من قسم محفوظ يدوياً.
 */
export function getScheduledSlotForNow<T extends WeeklyScheduleSlot>(
  entries: T[] | undefined,
  now = new Date(),
): T | undefined {
  const dayOfWeek = schoolDays[now.getDay()];
  if (!dayOfWeek) return undefined;

  const minute = now.getHours() * 60 + now.getMinutes();
  return (entries ?? [])
    .filter((entry) => entry.dayOfWeek === dayOfWeek)
    .sort((first, second) => first.periodIndex - second.periodIndex)
    .find((entry) => asMinutes(entry.endTime) > minute);
}
