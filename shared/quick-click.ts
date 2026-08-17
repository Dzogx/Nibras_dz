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
