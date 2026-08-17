import { describe, expect, it } from "vitest";
import { buildQuickAssessmentPath, buildQuickLessonPath } from "../shared/quick-click";

describe("مسار النقرات السريعة", () => {
  it("يحمل معرّف الوضعية إلى مولّد المذكرة لاسترجاع عنوانها الرسمي", () => {
    expect(buildQuickLessonPath(201004)).toBe("/lesson-generator?situationId=201004");
  });

  it("يحمل الوضعية والقسم إلى استوديو التقييم دون إعادة إدخال السياق", () => {
    expect(buildQuickAssessmentPath(201004, 11)).toBe("/assessment?situationId=201004&classId=11");
  });
});
