import { describe, it, expect, vi } from "vitest";
import {
  lessonToSlides,
  splitIntoSections,
  slideCountByKind,
  cleanInline,
} from "../shared/slides";

/**
 * فرض db-mock: أي محاولة لاستخدام قاعدة البيانات الحقيقية داخل بيئة الاختبار
 * يجب أن تفشل. نحقق من ذلك هنا (لا استدعاءات getDb مسموحة في الاختبارات).
 */
describe("db-mock enforcement", () => {
  it("getDb الحقيقي يرمي في بيئة الاختبار ما لم تُعيَّن علامة السماح", async () => {
    (globalThis as any).__NIBRAS_DB_MOCK_ENFORCED = false;
    // نحمّل الوحدة مباشرة — في اختبار slides لا حاجة لأي اتصال DB
    const { getDb } = await import("./db");
    let threw = false;
    try {
      await getDb();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    (globalThis as any).__NIBRAS_DB_MOCK_ENFORCED = undefined;
  });
});

describe("cleanInline", () => {
  it("ينظف التنسيق الغامق والمائل", () => {
    expect(cleanInline("**التعريف** والمفهوم")).toBe("التعريف والمفهوم");
    expect(cleanInline("*ملاحظة*")).toBe("ملاحظة");
  });
});

describe("splitIntoSections", () => {
  it("يقسم حسب عناوين ##", () => {
    const md = "## المرحلة الأولى\nنص المرحلة الأولى\n\n## المرحلة الثانية\nنص المرحلة الثانية";
    const sections = splitIntoSections(md);
    expect(sections.length).toBe(3); // القسم التمهيدي الفارغ + قسمان
    expect(sections[1].title).toBe("المرحلة الأولى");
    expect(sections[2].title).toBe("المرحلة الثانية");
  });

  it("يعيد قسمًا واحدًا إذا لم توجد عناوين", () => {
    const sections = splitIntoSections("نص بلا عناوين");
    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe("");
  });
});

describe("lessonToSlides", () => {
  const fullLesson = {
    title: "مذكرة: التعرف على موقع الجزائر",
    unitTitle: "المجال الجغرافي",
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الرابعة متوسط",
    duration: "40 دقيقة",
    objectives: "- تحديد الموقع الجغرافي للجزائر",
    content:
      "## التمهيد للدرس\nنناقش التلاميذ في خريطة الجزائر.\n\n## بناء المعرفة\nالجزائر أكبر دولة إفريقية.\n\n## التقويم التكويني\nأسئلة شفهية عن الدرس.",
    plan: "",
  };

  it("ينتج غلافًا + أهدافًا + مراحل + تقويمًا + نهاية", () => {
    const slides = lessonToSlides(fullLesson);
    expect(slides[0].kind).toBe("cover");
    expect(slides[0].body).toContain("المادة: التاريخ والجغرافيا");
    expect(slides[1].kind).toBe("objectives");
    expect(slides[2].kind).toBe("stage");
    expect(slides[2].title).toBe("التمهيد للدرس");
    expect(slides[3].kind).toBe("stage");
    expect(slides[4].kind).toBe("assessment");
    expect(slides[4].title).toBe("التقويم التكويني");
    expect(slides[slides.length - 1].kind).toBe("closing");
  });

  it("لا يقذف مع محتوى فارغ", () => {
    const slides = lessonToSlides({});
    expect(slides.length).toBe(2); // غلاف + نهاية فقط
    expect(slides[0].kind).toBe("cover");
    expect(slides[1].kind).toBe("closing");
  });

  it("يقسّم المحتوى الطويل إلى شرائح متابعة", () => {
    const longBody = "كلمة ".repeat(400) + "\n\n" + "كلمة ".repeat(400); // فقرتان طويلتان
    const slides = lessonToSlides({
      ...fullLesson,
      content: `## مرحلة طويلة\n${longBody}`,
      objectives: undefined,
    });
    const stages = slides.filter(s => s.kind === "stage");
    expect(stages.length).toBeGreaterThanOrEqual(2);
  });

  it("يلتقط التقويم من plan إذا غاب عن content", () => {
    const slides = lessonToSlides({
      ...fullLesson,
      content: "## المرحلة الأولى\nنص بسيط",
      plan: "## الوضعية الإدماجية\nوضعية إدماجية نهائية",
    });
    const assessment = slides.find(s => s.kind === "assessment");
    expect(assessment).toBeDefined();
    expect(assessment!.body).toContain("وضعية إدماجية نهائية");
  });

  it("يلتقط أقسام التقويم داخل content المقسم", () => {
    const slides = lessonToSlides({
      ...fullLesson,
      content: "## التقويم\nأسئلة الدرس\n\n## الواجب\nحل التمارين",
    });
    const counts = slideCountByKind(slides);
    expect(counts.assessment).toBe(2);
  });
});
