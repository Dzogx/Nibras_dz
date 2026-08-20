import { describe, expect, it } from "vitest";
import { sanitizeOfficialAssessmentOutput } from "../shared/assessment-output";

describe("تنقية مخرج التقويم الرسمي", () => {
  it("يستبدل صياغة الموجّه غير التربوية بتمرين رسمي مكافئ", () => {
    const content = "إليك تعريف مخادع للوثيقة التاريخية يتضمن أخطاء، صححه.\n\nتنبيه: راجع التوزيع.";

    expect(sanitizeOfficialAssessmentOutput(content)).toBe(
      "إليك تعريف غير دقيق للوثيقة التاريخية يتضمن أخطاء، صححه.\n"
    );
  });

  it("يحذف الإحالات التقنية وملاحظات الأستاذ المتسربة", () => {
    const content = "السؤال الأول: عرّف الوثيقة التاريخية.\n[مرجع: 2]\nملاحظة: هذا تقويم تجريبي.";

    expect(sanitizeOfficialAssessmentOutput(content)).toBe("السؤال الأول: عرّف الوثيقة التاريخية.");
  });
});
