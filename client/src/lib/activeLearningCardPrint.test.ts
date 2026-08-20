import { describe, expect, it } from "vitest";
import { buildActiveLearningCardHtml } from "./activeLearningCardPrint";

describe("بطاقة التعلم النشط للطباعة", () => {
  const html = buildActiveLearningCardHtml({
    dateLabel: "20 أوت 2026",
    subject: "التاريخ",
    gradeLevel: "السنة الثالثة متوسط",
    situationTitle: "اندلاع الثورة التحريرية",
    strategyName: "البازل التعاوني",
    totalMinutes: 55,
    rationale: "تقسيم مصادر التعلم ثم بناء خلاصة مشتركة.",
    phases: [{ stage: "الاكتشاف", minutes: 10, teacherRole: "يقدم السند", studentRole: "يلاحظ", tips: "اضبط الوقت" }],
    tips: ["وزع الأدوار قبل البداية."],
  });

  it("يبني بطاقة A4 تحمل بيانات النشاط وتسلسل مراحله", () => {
    expect(html).toContain("بطاقة تعلم نشط");
    expect(html).toContain("البازل التعاوني");
    expect(html).toContain("اندلاع الثورة التحريرية");
    expect(html).toContain("مراحل الإنجاز");
    expect(html).toContain("55 دقيقة");
  });

  it("يبقي هوية نبراس في البطاقة الصفية فقط ويهرب النصوص المدخلة", () => {
    const escaped = buildActiveLearningCardHtml({
      dateLabel: "اليوم",
      subject: "<مادة>",
      gradeLevel: "مستوى",
      situationTitle: "وضعية",
      strategyName: "نشاط",
      totalMinutes: 45,
      rationale: "شرح",
      phases: [],
      tips: [],
    });
    expect(html).toContain("نبراس");
    expect(escaped).toContain("&lt;مادة&gt;");
    expect(escaped).not.toContain("<مادة>");
  });
});
