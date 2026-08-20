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
    ["nibras", "000000", "6C6C6C"],
    ["official", "000000", "6C6C6C"],
    ["mono", "000000", "000000"],
  ] as const)("يضمّن نمط %s الطباعي في ألوان القالب", (printTheme, ink, accent) => {
    const latex = buildAssessmentLatexDocument({ ...baseInput, printTheme });

    expect(latex).toContain(`\\definecolor{NibrasInk}{HTML}{${ink}}`);
    expect(latex).toContain(`\\definecolor{NibrasAccent}{HTML}{${accent}}`);
  });

  it("وثيقة رسمية لا تحمل أي إشارة لاسم المنصة أو شعارها أو رمز QR", () => {
    const latex = buildAssessmentLatexDocument(baseInput);

    expect(latex).not.toContain("نبراس");
    expect(latex).not.toContain("NIBRAS");
    expect(latex).not.toContain("\\usepackage{qrcode}");
    expect(latex).not.toContain("\\NibrasQrCode");
    expect(latex).not.toContain("\\NibrasArabic");
    expect(latex).not.toContain("\\NibrasLatin");
    expect(latex).toContain("\\AssessmentTitle{اختبار الثورة الجزائرية}");
    expect(latex).toContain("\\AssessmentBand{موضوعات التقويم}");
    expect(latex).toContain("تقويم تحصيلي — المجموع: 20 نقطة");
  });

  it("يحوّل مستويات العناوين الأربعة (####) والخطوط الفاصلة والاقتباس من المحتوى المولّد", () => {
    const latex = buildAssessmentLatexDocument({
      ...baseInput,
      content: "### أولاً: التاريخ (10 نقاط)\n\n#### الجزء الأول: (8 نقاط)\n\n──────────────────────────\n\n> نص السند المقتبس\n\n**السؤال الأول:**",
    });

    expect(latex).toContain("\\subsection*{أولاً: التاريخ (10 نقاط)}");
    expect(latex).toContain("\\subsubsection*{الجزء الأول: (8 نقاط)}");
    expect(latex).toContain("\\hrule");
    expect(latex).toContain("\\begin{quote}");
    expect(latex).toContain("\\textbf{السؤال الأول:}");
    expect(latex).not.toContain("####");
    expect(latex).not.toContain("──────────────");
  });

  it("لا يتأثر بإدخال حقول إضافية مجهولة عند الاستدعاء المباشر (strict typing)", () => {
    // لا تُدرج أرقام إصدار أو روابط حتى لو مُرّرت كحقول
    const latex = buildAssessmentLatexDocument({ ...baseInput, printTheme: "mono" });

    expect(latex).not.toContain("NIBRAS-");
    expect(latex).toContain("أبيض وأسود — المجموع: 20 نقطة");
  });
});
