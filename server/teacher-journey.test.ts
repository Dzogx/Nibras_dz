import { describe, expect, it } from "vitest";
import { prepareAssessmentFromCompletedLessons, prepareFirstResultInput } from "../shared/teacher-journey";

describe("مسار الأستاذ المبسّط", () => {
  it("يجهز تقويماً من عناوين الدروس المنجزة دون حذف عنوان أدخله الأستاذ", () => {
    expect(prepareAssessmentFromCompletedLessons({
      className: "4 متوسط أ",
      lessonTitles: ["بداية الاحتلال", "المقاومة الشعبية", "التوسع الاستعماري", "درس زائد"],
      currentTitle: "",
      currentTopic: "",
    })).toEqual({
      autoImport: true,
      title: "تقويم تحصيلي — 4 متوسط أ",
      topic: "الدروس المنجزة: بداية الاحتلال، المقاومة الشعبية، التوسع الاستعماري",
    });

    expect(prepareAssessmentFromCompletedLessons({
      className: "4 متوسط أ",
      lessonTitles: ["بداية الاحتلال"],
      currentTitle: "اختبار الفصل الأول",
      currentTopic: "المقاومات",
    })).toMatchObject({ title: "اختبار الفصل الأول", topic: "المقاومات", autoImport: true });
  });

  it("يملأ عدد التلاميذ والمشاركين في أول نتيجة من بيانات القسم فقط عند غيابهما", () => {
    expect(prepareFirstResultInput({ totalStudents: 0, participatedStudents: 0, classSize: 36 }))
      .toEqual({ totalStudents: 36, participatedStudents: 36 });
    expect(prepareFirstResultInput({ totalStudents: 30, participatedStudents: 28, classSize: 36 }))
      .toEqual({ totalStudents: 30, participatedStudents: 28 });
  });
});
