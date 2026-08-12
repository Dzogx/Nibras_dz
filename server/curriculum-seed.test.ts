/**
 * Tests that the official 2022 curriculum data was properly seeded.
 * Verifies data integrity of annual plans, sections, and situations.
 */
import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

describe("Curriculum Seeding Data Integrity", () => {
  it("should have 12 annual plans (one per level/subject combination)", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM annualPlans WHERE title LIKE 'المخطط السنوي 2022/2023%'`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBe(12);
  });

  it("should have sections for all 4 levels of History/Geography", async () => {
    const db = await getDb();
    // History plans are stored under both official subjects: 'التاريخ والجغرافيا'
    // (1AM/2AM/4AM official PDF titles) and 'التاريخ' (3AM official PDF title).
    const [result] = await db.execute(
      sql`SELECT COUNT(DISTINCT ap.gradeLevel) as cnt FROM annualPlanSections aps JOIN annualPlans ap ON aps.annualPlanId = ap.id WHERE ap.subject IN ('التاريخ والجغرافيا', 'التاريخ') AND aps.title IN ('التاريخ الاجتماعي', 'التاريخ الوطني', 'التاريخ العام', 'الوثائق التاريخية', 'تاريخ الجزائر في القرن 19', 'السياسة الستعمارية في الجزائر', 'النضال الوطني والتقدم')`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBe(4);
  });

  it("should have sections for all 4 levels of Civic Education", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(DISTINCT gradeLevel) as cnt FROM annualPlanSections aps JOIN annualPlans ap ON aps.annualPlanId = ap.id WHERE ap.subject = 'التربية المدنية'`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBe(4);
  });

  it("should have learning situations linked to sections", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM learningSituations ls JOIN annualPlanSections aps ON ls.sectionId = aps.id`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBeGreaterThan(0);
  });

  it("should have curriculum documents for RAG", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM curriculumDocuments WHERE sourceReference LIKE '%المخططات السنوية 2022%'`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBeGreaterThan(50);
  });

  it("should have situations with objectives content", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM learningSituations WHERE objectives != ''`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBeGreaterThan(30);
  });

  it("should have the 4 standalone geography plans (official 2022 Geo PDFs)", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM annualPlans WHERE subject = 'الجغرافيا' AND title LIKE 'المخطط السنوي 2022/2023%'`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBe(4);
  });

  it("should have at least 90 learning situations across all plans", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM learningSituations ls JOIN annualPlanSections aps ON ls.sectionId = aps.id`
    );
    const count = (result as any[])[0].cnt;
    // Official source: 1AM 9 + 2AM 8 + 3AM 9 + 4AM 0 (History 4AM PDF is summary-only),
    // Civic 8+7+6+9, Geography 9+8+9+9 = 91 situations
    expect(parseInt(count)).toBe(91);
  });

  it("should have competency documents per level", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM curriculumDocuments WHERE type = 'competency' AND sourceReference LIKE '%المخططات السنوية 2022%'`
    );
    const count = (result as any[])[0].cnt;
    expect(parseInt(count)).toBeGreaterThan(20);
  });
});
