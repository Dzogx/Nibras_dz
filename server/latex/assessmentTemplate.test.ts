import { describe, expect, it } from "vitest";
import { buildAssessmentLatexDocument } from "./assessmentTemplate";

describe("buildAssessmentLatexDocument", () => {
  const baseInput = {
    title: "اختبار الثورة الجزائرية",
    content: "# الوضعية الأولى\n1. اذكر سببين للثورة. [مرجع: 1]\n- أجب بخط واضح.",
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الرابعة متوسط",
    assessmentType: "exam" as const,
    duration: "ساعة واحدة",
    totalPoints: 20,
  };

  it("ينشئ وثيقة عربية قابلة للتجميع بـ XeLaTeX مع ترويسة التقويم", () => {
    const latex = buildAssessmentLatexDocument(baseInput);

    expect(latex).toContain("\\documentclass[12pt,a4paper]{article}");
    expect(latex).toContain("\\setmainlanguage{arabic}");
    expect(latex).toContain("\\newfontfamily\\arabicfont");
    expect(latex).toContain("اختبار تحصيلي");
    expect(latex).toContain("اللقب والاسم");
    expect(latex).toContain("\\section*{الوضعية الأولى}");
    expect(latex).not.toContain("[مرجع: 1]");
  });

  it("يهرب أوامر LaTeX القادمة من المحتوى ولا يدرجها كأوامر قابلة للتنفيذ", () => {
    const latex = buildAssessmentLatexDocument({
      ...baseInput,
      content: "1. اكتب % ثم \\input{secret}",
      title: "اختبار #1",
    });

    expect(latex).toContain("اختبار \\#1");
    expect(latex).toContain("\\textbackslash{}input\\{secret\\}");
    expect(latex).not.toContain("\\input{secret}");
  });

  it("يحذف خانة بيانات التلميذ من نموذج الإجابة", () => {
    const latex = buildAssessmentLatexDocument({ ...baseInput, assessmentType: "answerKey" });

    expect(latex).toContain("نموذج الإجابة وسلم التنقيط");
    expect(latex).not.toContain("اللقب والاسم");
  });

  it.each([
    ["nibras", "17324D", "هوية نبراس"],
    ["official", "25364B", "رسمي اقتصادي"],
    ["mono", "000000", "أبيض وأسود"],
  ] as const)("يضمّن نمط %s الطباعي في ألوان وترويسة القالب", (printTheme, ink, label) => {
    const latex = buildAssessmentLatexDocument({ ...baseInput, printTheme });

    expect(latex).toContain(`\\definecolor{NibrasInk}{HTML}{${ink}}`);
    expect(latex).toContain(label);
  });
});
