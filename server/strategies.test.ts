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
    // «التاريخ والجغرافيا» تحوي كلمة جغرافيا فتُطابق الجغرافيا (التاريخ افتراضي)
    expect(normalizeSubject("التاريخ والجغرافيا")).toBe("geography");
    expect(normalizeSubject("التاريخ")).toBe("history");
    expect(normalizeSubject("الجغرافيا")).toBe("geography");
    expect(normalizeSubject("التربية المدنية")).toBe("civics");
    expect(normalizeSubject("مدني")).toBe("civics");
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

  it("الإدماجية التاريخية تعتمد حل المشكلات بالمجموعات", () => {
    const s = suggestStrategyForSituation({
      title: "وضعية إدماجية جزئية",
      subject: "التاريخ",
    });
    expect(s.name).toContain("حل المشكلات");
  });

  it("الإدماجية الجغرافية تعتمد التحليل المتدرج بالوثائق", () => {
    const s = suggestStrategyForSituation({ title: "وضعية إدماجية", subject: "الجغرافيا" });
    expect(s.name).toContain("التحليل الجغرافي");
  });

  it("الإدماجية المدنية تعتمد المحاكاة والنقاش الديمقراطي", () => {
    const s = suggestStrategyForSituation({ title: "وضعية إدماجية", subject: "التربية المدنية" });
    expect(s.name).toContain("المحاكاة");
  });

  it("التعلمية التاريخية تعتمد الاستجواب المتدرج وفق هرم بلوم", () => {
    const s = suggestStrategyForSituation({ title: "الحرب الجزائرية: الانطلاقة وتنظيم الثورة", subject: "التاريخ" });
    expect(s.name).toContain("الاستجواب المتدرج");
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
    for (const pool of [STRATEGIES.INTEGRATIVE_STRATEGIES, STRATEGIES.LEARNING_STRATEGIES]) {
      const subjects = pool.map(m => m.subject);
      expect(subjects).toContain("history");
      expect(subjects).toContain("geography");
      expect(subjects).toContain("civics");
    }
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
