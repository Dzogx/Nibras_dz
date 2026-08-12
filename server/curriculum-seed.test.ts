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
    // Historical plans use two source labels, but share the same three canonical sections.
    const [result] = await db.execute(
      sql`SELECT COUNT(DISTINCT ap.gradeLevel) as cnt FROM annualPlanSections aps JOIN annualPlans ap ON aps.annualPlanId = ap.id WHERE ap.subject IN ('التاريخ والجغرافيا', 'التاريخ') AND aps.title IN ('الوثائق التاريخية', 'التاريخ الوطني', 'التاريخ العام')`
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

  it("should assign 4AM geography situations to the three canonical sections", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT aps.title AS title, COUNT(ls.id) AS situationCount
          FROM annualPlanSections aps
          JOIN annualPlans ap ON ap.id = aps.annualPlanId
          LEFT JOIN learningSituations ls ON ls.sectionId = aps.id
          WHERE ap.gradeLevel = 'السنة الرابعة متوسط' AND ap.subject = 'الجغرافيا'
          GROUP BY aps.id, aps.title
          ORDER BY aps.sectionNumber`
    );
    expect(result as any[]).toEqual([
      { title: "المجال الجغرافي", situationCount: 3 },
      { title: "السكان والتنمية", situationCount: 3 },
      { title: "السكان والبيئة", situationCount: 3 },
    ]);
  });

  it("should use the canonical history section names for 4AM", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT aps.title AS title
          FROM annualPlanSections aps
          JOIN annualPlans ap ON ap.id = aps.annualPlanId
          WHERE ap.gradeLevel = 'السنة الرابعة متوسط' AND ap.subject = 'التاريخ والجغرافيا'
          ORDER BY aps.sectionNumber`
    );
    expect((result as any[]).map((row) => row.title)).toEqual([
      "الوثائق التاريخية",
      "التاريخ الوطني",
      "التاريخ العام",
    ]);
  });

  it("should use only the canonical section names across all official plans", async () => {
    const db = await getDb();
    const [result] = await db.execute(
      sql`SELECT ap.gradeLevel, ap.subject, aps.sectionNumber, aps.title
          FROM annualPlanSections aps
          JOIN annualPlans ap ON ap.id = aps.annualPlanId
          WHERE (ap.subject IN ('التاريخ والجغرافيا', 'التاريخ')
                 AND aps.title NOT IN ('الوثائق التاريخية', 'التاريخ الوطني', 'التاريخ العام'))
             OR (ap.subject = 'الجغرافيا'
                 AND aps.title NOT IN ('المجال الجغرافي', 'السكان والتنمية', 'السكان والبيئة'))
             OR (ap.subject = 'التربية المدنية'
                 AND aps.title NOT IN ('الحياة الجماعية', 'الحياة المدنية', 'الحياة الديمقراطية ومؤسسات الجمهورية'))
          ORDER BY ap.gradeLevel, ap.subject, aps.sectionNumber`
    );
    expect(result as any[]).toEqual([]);
  });
});
