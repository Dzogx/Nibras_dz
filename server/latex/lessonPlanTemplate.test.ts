import { describe, expect, it } from "vitest";
import { buildLessonPlanLatexDocument, LESSON_PLAN_PRINT_THEMES } from "./lessonPlanTemplate";

describe("lessonPlanTemplate", () => {
  const baseInput = {
    title: "الجزائر تحت الاستعمار الفرنسي",
    content: "## مقدمة\n\nيكتشف المتعلم **مظاهر الاحتلال** من خلال:\n\n- الاستيطان\n- مصادرة الأراضي\n\n1. الهدف الأول\n2. الهدف الثاني\n\n> استشهاد من المرجع الرسمي.\n",
    subject: "التاريخ",
    gradeLevel: "السنة الرابعة متوسط",
    sectionName: "أ",
    unitTitle: "الجزائر من 1830 إلى 1954",
    duration: "55 دقيقة",
    date: "2026-10-12",
    academicYear: "2026-2027",
    teacherName: "الأستاذ أحمد",
    school: "متوسطة النور",
    province: "الجزائر",
    objectives: "يدرك المتعلم مظاهر الاستعمار الاستيطاني ونتائجه على المجتمع الجزائري.",
    lessonNumber: 2,
    unitNumber: 1,
  };

  it("يبدأ المصدر بسطر التعرف المطلوب للتجميع الآمن", () => {
    const tex = buildLessonPlanLatexDocument(baseInput);
    expect(tex).toMatch(/^% Nibras Print System — Lesson Plan Template/);
  });

  it("يهرب رموز LaTeX الخاصة في العنوان والمحتوى", () => {
    const tex = buildLessonPlanLatexDocument({ ...baseInput, title: "درس #1: التوسع (1830%–1848)" });
    expect(tex).not.toContain("درس #1: التوسع (1830%–1848)");
    expect(tex).toContain("درس \\#1: التوسع (1830\\%–1848)");
  });

  it("يدرج بطاقة البيانات والموضوع والأهداف والعنوان الرئيسي", () => {
    const tex = buildLessonPlanLatexDocument(baseInput);
    expect(tex).toContain("المؤسسة: متوسطة النور");
    expect(tex).toContain("الأستاذ(ة): الأستاذ أحمد");
    expect(tex).toContain("المادة: التاريخ");
    expect(tex).toContain("الموضوع: الجزائر تحت الاستعمار الفرنسي");
    expect(tex).toContain("\\subsection*{مقدمة}");
    expect(tex).toContain("\\textbf{مظاهر الاحتلال}");
    expect(tex).toContain("الهدف(ة) التعلمية");
    expect(tex).toContain("مذكرة بيداغوجية — الجزائر من 1830 إلى 1954");
    expect(tex).toContain("\\DocumentTitle{الجزائر تحت الاستعمار الفرنسي}");
    expect(tex).toContain("\\DocumentBand{سير الحصة}");
  });

  it("يحافظ على بنية Markdown: قائمة نقطية ومرقمة واقتباس", () => {
    const tex = buildLessonPlanLatexDocument(baseInput);
    expect(tex).toContain("\\textbullet\\quad الاستيطان");
    expect(tex).toContain("\\textbf{1.} الهدف الأول");
    expect(tex).toContain("\\begin{quote}");
  });

  it("يستعمل السمات الثلاث المتاحة بدون انكسار", () => {
    for (const theme of Object.keys(LESSON_PLAN_PRINT_THEMES) as Array<keyof typeof LESSON_PLAN_PRINT_THEMES>) {
      const tex = buildLessonPlanLatexDocument({ ...baseInput, printTheme: theme });
      expect(tex).toContain(`\\definecolor{NibrasInk}{HTML}{${LESSON_PLAN_PRINT_THEMES[theme].ink}}`);
      expect(tex).toContain("\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}");
    }
  });

  it("يتعامل مع الحقول الاختيارية الغائبة دون فراغات", () => {
    const tex = buildLessonPlanLatexDocument({ title: "عنوان", content: "سطر واحد." });
    expect(tex).toContain("المادة: ........");
    expect(tex).toContain("المستوى والقسم: ........................................");
    expect(tex).toContain("\\noindent سطر واحد.\\par");
  });

  it("وثيقة محايدة لا تحمل اسم المنصة في الترويسة أو التذييل أو التذييل الختامي", () => {
    const tex = buildLessonPlanLatexDocument(baseInput);
    expect(tex).not.toContain("نبراس");
    expect(tex).toContain("وثيقة تحضير للأستاذ");
    expect(tex).toContain("وثيقة تحضير تربوية قابلة للتحرير");
    expect(tex).toContain("الجمهورية الجزائرية الديمقراطية الشعبية");
  });
});
