import { describe, it, expect } from "vitest";
import {
  detectSituationKind,
  normalizeSubject,
  suggestStrategyForSituation,
  formatStrategyForLesson,
  STRATEGIES,
  type SuggestedStrategy,
} from "./strategies";

// ─── تصنيف نوع الوضعية ──────────────────────────────────────────
describe("detectSituationKind", () => {
  it("تصنّف الوضعية الإدماجية الصريحة", () => {
    expect(detectSituationKind("وضعية إدماجية جزئية — التاريخ الوطني")).toBe("integrative");
    expect(detectSituationKind("إدماج الموارد المكتسبة في وضعية جديدة", "تقويم")).toBe("integrative");
    expect(detectSituationKind("وضعيات إدماج الموارد المقررة", "الوضعية الإدماجية الكلية موحدة للمستوى")).toBe("integrative");
  });
  it("تصنّف الوضعية التعلّمية افتراضيًا", () => {
    expect(detectSituationKind("الحرب الجزائرية: الانطلاقة وتنظيم الثورة")).toBe("learning");
    expect(detectSituationKind("المجال الجغرافي: الموقع الفلكي والجغرافي")).toBe("learning");
  });
});

// ─── تطبيع المادة ────────────────────────────────────────────────
describe("normalizeSubject", () => {
  it("يميز المواد الثلاث", () => {
    // المطابقة بالأولوية: التاريخ ثم الجغرافيا ثم المدنية
    expect(normalizeSubject("التاريخ")).toBe("history");
    expect(normalizeSubject("الجغرافيا")).toBe("geography");
    expect(normalizeSubject("التربية المدنية")).toBe("civics");
    expect(normalizeSubject("مدنية")).toBe("civics");
    expect(normalizeSubject("history")).toBe("history");
  });
});

// ─── المحرك الرئيسي ─────────────────────────────────────────────
describe("suggestStrategyForSituation", () => {
  it("يطابق كل مادة × كل نوع وضعية (6 حالات)", () => {
    const cases: Array<{ title: string; subject: string; kind: "integrative" | "learning" }> = [
      { title: "إدماج الموارد التاريخية", subject: "التاريخ والجغرافيا", kind: "integrative" },
      { title: "الحرب الجزائرية: الانطلاقة", subject: "التاريخ والجغرافيا", kind: "learning" },
      { title: "إدماج الموارد الجغرافية", subject: "الجغرافيا", kind: "integrative" },
      { title: "الموقع الفلكي والجغرافي", subject: "الجغرافيا", kind: "learning" },
      { title: "وضعية إدماجية: المشاركة في الحياة المدنية", subject: "التربية المدنية", kind: "integrative" },
      { title: "مبادئ الديمقراطية", subject: "التربية المدنية", kind: "learning" },
    ];
    for (const c of cases) {
      const s = suggestStrategyForSituation({ title: c.title, subject: c.subject });
      expect(s.kind).toBe(c.kind);
      expect(s.name).toBeTruthy();
      expect(s.phases.length).toBeGreaterThanOrEqual(5);
      expect(s.generalTips.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("الإدماجية التاريخية تعتمد البازل التعاوني (Jigsaw) كاستراتيجية إدماج أولى", () => {
    const s = suggestStrategyForSituation({
      title: "وضعية إدماجية جزئية",
      subject: "التاريخ",
    });
    expect(s.name).toContain("البازل");
    expect(s.totalMinutes).toBe(55);
  });

  it("البازل متاح لكل المواد وليس للتاريخ فقط (منهجية إدماج عامة)", () => {
    const jigsaw = STRATEGIES.INTEGRATIVE_STRATEGIES.find(m => m.strategy.name.includes("البازل"));
    expect(jigsaw?.subject).toBe("all");
  });

  it("الإدماجية التاريخية لا تزال تحتفظ بمنهجية الأدوات في الخزانة", () => {
    const methods = STRATEGIES.INTEGRATIVE_STRATEGIES.map(m => m.strategy.name);
    expect(methods).toContain("حل الوضعية الإدماجية بمنهجية الأدوات");
    expect(methods).toContain("البازل التعاوني (Jigsaw) على مكونات الوضعيات الإدماجية");
  });

  it("الإدماجية الجغرافية تعطي بازل Jigsaw أولاً (خزانة إدماج موحدة لكل المواد)", () => {
    const s = suggestStrategyForSituation({ title: "وضعية إدماجية", subject: "الجغرافيا" });
    expect(s.kind).toBe("integrative");
    expect(s.totalMinutes).toBe(55);
  });

  it("الإدماجية المدنية تعطي بازل Jigsaw أولاً (خزانة إدماج موحدة لكل المواد)", () => {
    const s = suggestStrategyForSituation({ title: "وضعية إدماجية", subject: "التربية المدنية" });
    expect(s.kind).toBe("integrative");
    expect(s.totalMinutes).toBe(55);
  });

  it("خزانة الإدماج تضم كلتا استراتيجيتي البازل ومنهجية الأدوات", () => {
    const names = STRATEGIES.INTEGRATIVE_STRATEGIES.map(m => m.strategy.name);
    expect(names).toContain("البازل التعاوني (Jigsaw) على مكونات الوضعيات الإدماجية");
    expect(names).toContain("حل الوضعية الإدماجية بمنهجية الأدوات");
  });

  it("التعلمية التاريخية تعتمد التحقيق التاريخي من الوثيقة إلى الاستنتاج", () => {
    const s = suggestStrategyForSituation({ title: "الحرب الجزائرية: الانطلاقة وتنظيم الثورة", subject: "التاريخ" });
    expect(s.name).toContain("التحقيق التاريخي");
  });

  it("التعلمية الجغرافية تعتمد رحلة الاستكشاف من الوثيقة إلى المفهوم", () => {
    const s = suggestStrategyForSituation({ title: "الموقع الفلكي والجغرافي", subject: "الجغرافيا" });
    expect(s.name).toContain("الاستكشاف الجغرافي");
  });

  it("التعلمية المدنية تعتمد الحوار السقراطي بالوثيقة القانونية", () => {
    const s = suggestStrategyForSituation({ title: "مبادئ الديمقراطية", subject: "التربية المدنية" });
    expect(s.name).toContain("الحوار السقراطي");
  });

  it("المطابقة العامة للإدماجية تسبق المطابقة بالمادة في الخزانة الموحدة", () => {
    // الخزانة الإدماجية موحدة (subject=all) فتعمل لكل مادة
    const s = suggestStrategyForSituation({ title: "إدماج الموارد المقررة", subject: "التاريخ والجغرافيا" });
    expect(s.kind).toBe("integrative");
    expect(s.phases.length).toBe(6);
  });

  it("كل استراتيجية بحصة 55 دقيقة ومجموع مراحله متسق", () => {
    for (const pool of [STRATEGIES.INTEGRATIVE_STRATEGIES, STRATEGIES.LEARNING_STRATEGIES]) {
      for (const m of pool) {
        const total = m.strategy.phases.reduce((acc, p) => acc + p.minutes, 0);
        expect(total).toBe(m.strategy.totalMinutes);
        expect(total).toBe(55);
      }
    }
  });

  it("لا مراحل بمدة صفرية أو سلبية ولا أدوار فارغة", () => {
    for (const pool of [STRATEGIES.INTEGRATIVE_STRATEGIES, STRATEGIES.LEARNING_STRATEGIES]) {
      for (const m of pool) {
        for (const p of m.strategy.phases) {
          expect(p.minutes).toBeGreaterThan(0);
          expect(p.teacherRole.trim()).toBeTruthy();
          expect(p.studentRole.trim()).toBeTruthy();
          expect(p.stage.trim()).toBeTruthy();
        }
        expect(m.strategy.rationale.trim()).toBeTruthy();
        for (const t of m.strategy.generalTips) expect(t.trim()).toBeTruthy();
      }
    }
  });

  it("كل مادة لها استراتيجية في كل نوع وضعية", () => {
    // الخزانة الإدماجية موحدة لكل المواد (subject=all)
    expect(STRATEGIES.INTEGRATIVE_STRATEGIES.map(m => m.subject)).toContain("all");
    // الخزانة التعلمية تغطي المواد الثلاث منفردة
    const learningSubjects = STRATEGIES.LEARNING_STRATEGIES.map(m => m.subject);
    expect(learningSubjects).toContain("history");
    expect(learningSubjects).toContain("geography");
    expect(learningSubjects).toContain("civics");
  });
});

// ─── تنسيق الاستراتيجية للمذكرة ─────────────────────────────────
describe("formatStrategyForLesson", () => {
  it("يقحم المراحل الزمنية وأدوار الأستاذ والتلميذ في النص", () => {
    const s: SuggestedStrategy = suggestStrategyForSituation({
      title: "الحرب الجزائرية: الانطلاقة وتنظيم الثورة",
      subject: "التاريخ والجغرافيا",
    });
    const text = formatStrategyForLesson(s);
    expect(text).toContain("استراتيجية تسيير الحصة المقترحة");
    expect(text).toContain("دور الأستاذ");
    expect(text).toContain("دور التلميذ");
    expect(text).toContain("نصائح عامة");
    expect(text).toContain("55 دقيقة");
    for (const p of s.phases) {
      expect(text).toContain(`${p.stage} (${p.minutes} د)`);
    }
  });
});

// ─── الموجّه التربوي للمولّد الذكي ─────────────────────────────────
import { buildLLMPrompt, suggestStrategyWithLLM, type CompetencySectionContext } from "./strategies";

function baseCtx(overrides: Partial<CompetencySectionContext> = {}): CompetencySectionContext {
  return {
    situationTitle: "وضعية إدماجية جزئية: المقاومة المسلحة بعد 1945",
    globalCompetency: "يكون المتعلم قادراً على إبراز قيمة الموروث التاريخي الوطني كمكون من مكونات الهوية الوطنية",
    termCompetency: "يوظف مفهوم المقاومة المسلحة لتحليل دور الشباب الجزائري في التحرر الوطني",
    competencyAction: "إدماج",
    durationHours: 2,
    knowledgeResources: [
      { title: "الوقائع التاريخية", action: "إدماج" },
      { title: "التواريخ والشخصيات", action: "إدماج" },
    ],
    criteria: [
      { criterion: "يحلل الوثيقة التاريخية", indicators: ["يحدد المصدر والزمن", "يستخلص المعلومة المفيدة"] },
      { criterion: "يصوغ الاستنتاج", indicators: ["يربط الوقائع بالسياق"] },
    ],
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الرابعة متوسط",
    ...overrides,
  };
}

describe("buildLLMPrompt", () => {
  it("يبني موجّهًا يتضمن الكفاءة الشاملة والختامية وموارد المقطع ومعاييره", () => {
    const prompt = buildLLMPrompt(baseCtx());
    expect(prompt).toContain("الكفاءة الشاملة للمستوى");
    expect(prompt).toContain("الكفاءة الختامية للمقطع");
    expect(prompt).toContain("الوقائع التاريخية");
    expect(prompt).toContain("يحلل الوثيقة التاريخية");
    expect(prompt).toContain("يستخلص المعلومة المفيدة");
    expect(prompt).toContain("يوظف مفهوم المقاومة المسلحة");
    expect(prompt).toContain("120 دقيقة في كل حصة");
  });

  it("يوجّه بحسب وضع التملك (تنصيب/إدماج)", () => {
    const install = buildLLMPrompt(baseCtx({ competencyAction: "تنصيب" }));
    const integrate = buildLLMPrompt(baseCtx({ competencyAction: "إدماج" }));
    expect(install).toContain("- وضع التملك: تنصيب");
    expect(install).toContain("أول تماس للتلاميذ");
    expect(integrate).toContain("- وضع التملك: إدماج");
    expect(integrate).toContain("ممارسة مستقلة");
    expect(integrate).toContain("التقويم التحصيلي");
  });

  it("يلتزم بالمحتوى المعروض فقط عند غياب الموارد — لا اختراع", () => {
    const prompt = buildLLMPrompt(baseCtx({ knowledgeResources: undefined, criteria: undefined }));
    expect(prompt).toContain("لا تخترع موارد جديدة");
  });

  it("يمرر مدة الحصة الصحيحة من الحجم الساعي", () => {
    expect(buildLLMPrompt(baseCtx({ durationHours: 1.5 }))).toContain("90 دقيقة");
    expect(buildLLMPrompt(baseCtx({ durationHours: 0, sessionMinutes: 45 }))).toContain("45 دقيقة");
    expect(buildLLMPrompt(baseCtx({ durationHours: 0 }))).toContain("55 دقيقة");
  });
});

// ─── تحليل استجابة النموذج الذكي ──────────────────────────────────
import { vi } from "vitest";
vi.mock("./_core/llm", async importOriginal => {
  const actual = await importOriginal<typeof import("./_core/llm")>();
  return {
    ...actual,
    invokeLLM: vi.fn(async () => ({
      choices: [{ message: { content: "INVALID" } }],
    })),
  };
});

describe("suggestStrategyWithLLM", () => {
  it("يستجيب باستراتيجية ثابتة عند استجابة JSON غير صالحة", async () => {
    const result = await suggestStrategyWithLLM(baseCtx());
    expect(result.source).toBe("static");
    expect(result.note).toContain("المطابقة الثابتة");
    expect(result.strategy.phases.length).toBeGreaterThan(0);
  });

  it("يقبل استجابة JSON صالحة ويصنف نوع الوضعية", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const validResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "حل الوضعية الإدماجية بوثائق تاريخية",
              rationale: "تناسب وضعية إدماجية جزئية",
              totalMinutes: 120,
              phases: [
                { stage: "الافتتاح", minutes: 7, teacherRole: "يقدّم السؤال المحوري", studentRole: "يستذكر الموارد", tips: "ربط بالمكتسبات" },
                { stage: "التحليل", minutes: 40, teacherRole: "يوزّع الوثائق", studentRole: "يحلل ويستخرج", tips: "توجيه فرقي" },
                { stage: "التركيب", minutes: 30, teacherRole: "ينظم النقاش", studentRole: "يصوغ الاستنتاج", tips: "دفع نحو التجريد" },
                { stage: "التمارين", minutes: 25, teacherRole: "يصحح", studentRole: "يتدرب ذاتيًا", tips: "تغذية راجعة" },
                { stage: "الختام", minutes: 18, teacherRole: "يقدّم التقويم الذاتي", studentRole: "يقوّم ذاته", tips: "تسجيل الملاحظات" },
              ],
              generalTips: ["توصية 1", "توصية 2", "توصية 3", "توصية 4"],
            }),
          },
        },
      ],
    };
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce(validResponse);
    const result = await suggestStrategyWithLLM(baseCtx());
    expect(result.source).toBe("ai");
    expect(result.strategy.kind).toBe("integrative");
    expect(result.strategy.totalMinutes).toBe(120);
    expect(result.strategy.phases.length).toBe(5);
  });

  it("يرفض استجابة بأقل من 4 مراحل صالحة", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ name: "مختصرة", totalMinutes: 30, phases: [{ stage: "ا", minutes: 10, teacherRole: "ا", studentRole: "ا", tips: "ا" }], generalTips: [] }) } }],
    });
    const result = await suggestStrategyWithLLM(baseCtx());
    expect(result.source).toBe("static");
  });

  it("يسقط إلى الثابت عند تعذر الاتصال بالنموذج", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("فشل الشبكة"));
    const result = await suggestStrategyWithLLM(baseCtx());
    expect(result.source).toBe("static");
    expect(result.note).toContain("تعذر الوصول");
  });

  it("لا يسمح بتجاوز الإطار التربوي: الموجّه يمنع اختراع محتوى منهاجي", () => {
    expect(buildLLMPrompt(baseCtx()).includes("أكثر توجيهًا في التنصيب")).toBe(true);
    expect(buildLLMPrompt(baseCtx({ competencyAction: "إدماج" })).includes("ممارسة مستقلة")).toBe(true);
    const prompt = buildLLMPrompt(baseCtx());
    expect(prompt).toContain("لا تخترع وثائق أو تواريخ أو أحداثًا أو حقائق لم تُذكر");
    expect(prompt).toContain("دقيقة بالضبط (مجموع مراحل التسيير)");
  });
});
