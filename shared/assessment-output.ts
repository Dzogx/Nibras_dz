/**
 * ينقّي مخرج النموذج قبل حفظه بوصفه وثيقة تقويم رسمية. يحتفظ بالمضمون
 * البيداغوجي، لكنه يمنع الإحالات التقنية وصيغ الموجّه غير الملائمة للتلميذ.
 */
export function sanitizeOfficialAssessmentOutput(content: string): string {
  const withoutReferences = content
    .split("\n")
    .filter(line => !/^\s*(\[مرجع|مرجع:\s?\d|مصدر:?\s?\d|\d+\.\s+(الوضعية|المخطط|الكفاءة|وثيقة)).*$/.test(line.trim()))
    .join("\n")
    .replace(/\[مرجع[^\]]*\]/g, "")
    .replace(/\s{3,}/g, "\n");

  const withoutTeacherNotes = withoutReferences
    .split("\n")
    .filter(line => !/^\s*(ملاحظة:|تنبيه:|توضيح:|انتبه:|تذكير:|مهم:).*$/.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n+((?:يجب عليك|ننصحك|نوصي|يمكنك|لا تنس|بالتوفيق)[^.\n]{0,140}[\.\s]*)\s*$/, "");

  // «تعريف مخادع» صياغة موجّه شائعة وليست مناسبة في ورقة امتحان؛
  // تبقى المهارة نفسها (كشف الأخطاء وتصحيحها) بصياغة تربوية رسمية.
  return withoutTeacherNotes.replace(
    /((?:إليك|إليكم)\s+(?:تعريف|نص|عبارة|سؤال)\s+)(?:مخادع|مضلل)(?=\s|:|،|\.|$)/g,
    "$1غير دقيق"
  );
}
