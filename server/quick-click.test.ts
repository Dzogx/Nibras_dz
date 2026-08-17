import { describe, expect, it } from "vitest";
import { buildQuickAssessmentPath, buildQuickIntegrativeSituationPath, buildQuickLessonPath, getScheduledSlotForNow } from "../shared/quick-click";

describe("مسار النقرات السريعة", () => {
  it("يحمل معرّف الوضعية إلى مولّد المذكرة لاسترجاع عنوانها الرسمي", () => {
    expect(buildQuickLessonPath(201004)).toBe("/lesson-generator?situationId=201004");
  });

  it("يحمل الوضعية والقسم إلى استوديو التقييم دون إعادة إدخال السياق", () => {
    expect(buildQuickAssessmentPath(201004, 11)).toBe("/assessment?situationId=201004&classId=11");
  });

  it("يحمل الوضعية والقسم إلى مولّد الوضعية الإدماجية دون إعادة إدخال السياق", () => {
    expect(buildQuickIntegrativeSituationPath(201004, 11)).toBe("/integrative-situation?situationId=201004&classId=11");
  });

  it("يختار الحصة الجارية أو التالية من جدول اليوم", () => {
    const entries = [
      { classId: 1, dayOfWeek: "الاثنين", periodIndex: 1, startTime: "08:00", endTime: "09:00" },
      { classId: 2, dayOfWeek: "الاثنين", periodIndex: 2, startTime: "09:00", endTime: "10:00" },
    ];

    expect(getScheduledSlotForNow(entries, new Date(2026, 7, 17, 8, 30))?.classId).toBe(1);
    expect(getScheduledSlotForNow(entries, new Date(2026, 7, 17, 9, 15))?.classId).toBe(2);
    expect(getScheduledSlotForNow(entries, new Date(2026, 7, 17, 7, 30))?.classId).toBe(1);
    expect(getScheduledSlotForNow(entries, new Date(2026, 7, 17, 10, 0))).toBeUndefined();
  });
});
