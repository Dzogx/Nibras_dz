import { describe, expect, it } from "vitest";
import { stripMarkdown, truncateMarkdown } from "../client/src/components/MarkdownRenderer";

describe("MarkdownRenderer — stripMarkdown / truncateMarkdown", () => {
  it("تجرد التنسيقات الأساسية", () => {
    const raw =
      "### عنوان\n\n**نص جريء** و*مائل* و`كود`\n\n- نقطة أولى\n- نقطة ثانية\n\n1. مرقمة";
    const clean = stripMarkdown(raw);
    expect(clean).not.toContain("**");
    expect(clean).not.toContain("###");
    expect(clean).not.toContain("- ");
    expect(clean).toContain("نص جريء");
    expect(clean).toContain("نقطة أولى");
    expect(clean).toContain("مرقمة");
  });

  it("تجرد جداول Markdown", () => {
    const raw = "| السؤال | النقطة |\n|---|---|\n| سؤال 1 | 2 |";
    const clean = stripMarkdown(raw);
    expect(clean).not.toContain("|");
    expect(clean).not.toContain("---");
    expect(clean).toContain("سؤال 1");
    expect(clean).toContain("النقطة");
  });

  it("تقتصر دون كسر الكلمات", () => {
    const raw = "**هذا نص طويل جداً يحتوي على كلمات كثيرة يجب اقتصاصها بشكل سليم دون قطع الكلمات** والنهاية.";
    const t = truncateMarkdown(raw, 30);
    expect(t.length).toBeLessThanOrEqual(33); // 30 + "…"
    expect(t.endsWith("…")).toBe(true);
    expect(t).not.toContain("**");
  });

  it("لا تغيّر النص القصير", () => {
    expect(truncateMarkdown("نص قصير", 100)).toBe("نص قصير");
  });

  it("تتعامل مع القيم الفارغة", () => {
    expect(stripMarkdown("")).toBe("");
    expect(truncateMarkdown(undefined as unknown as string, 100)).toBe("");
  });
});
