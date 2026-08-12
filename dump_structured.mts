/**
 * Dump the live DB curriculum state into /home/ubuntu/curriculum_data/structured.json
 * with keys compatible with seed_curriculum.mts, so the seed is reproducible.
 */
import { getDb } from "./server/db";
import {
  annualPlans,
  annualPlanSections,
  learningSituations,
  curriculumDocuments,
} from "./drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import fs from "fs";

const db = await getDb();

const plans = await db.select().from(annualPlans).orderBy(asc(annualPlans.id));
const out: any[] = [];

for (const p of plans) {
  const secs = await db
    .select()
    .from(annualPlanSections)
    .where(eq(annualPlanSections.annualPlanId, p.id))
    .orderBy(asc(annualPlanSections.id));
  const sections = [];
  for (const s of secs) {
    const sits = await db
      .select()
      .from(learningSituations)
      .where(eq(learningSituations.sectionId, s.id))
      .orderBy(asc(learningSituations.id));
    sections.push({
      chapter: null,
      number: s.sectionNumber ?? null,
      section_title: s.title ?? null,
      title: s.title ?? null,
      terminal_competency: s.competencies ?? null,
      objective: s.objectives ?? null,
      duration: s.duration ?? null,
      situations: sits.map((t) => ({
        number: t.situationNumber ?? null,
        title: t.title ?? null,
        type: t.situationType ?? null,
        objectives: t.objectives ?? null,
        objective: t.objectives ?? null,
        activities: t.activities ?? null,
        competency: t.competency ?? null,
        duration: t.duration ?? null,
      })),
    });
  }
  const docs = await db
    .select()
    .from(curriculumDocuments)
    .where(
      and(
        eq(curriculumDocuments.subject, p.subject),
        eq(curriculumDocuments.gradeLevel, p.gradeLevel)
      )
    );
  out.push({
    metadata: {
      subject: p.subject,
      level: p.gradeLevel,
      filename: p.pdfFilename ?? null,
      academic_year: p.academicYear ?? "2022/2023",
      source: "المخططات السنوية 2022 - وزارة التربية الوطنية",
    },
    global_competency: p.globalCompetency ?? null,
    sections,
    documents: docs.map((d) => ({
      title: d.title ?? null,
      content: d.content ?? null,
      page: d.pageNumber ?? null,
    })),
  });
}

fs.writeFileSync(
  "/home/ubuntu/curriculum_data/structured.json",
  JSON.stringify(out, null, 2)
);
const sitTotal = out.reduce(
  (a, p) => a + p.sections.reduce((b, s) => b + s.situations.length, 0),
  0
);
console.log(
  `Dumped ${out.length} plans, ${out.reduce((a, p) => a + p.sections.length, 0)} sections, ${sitTotal} situations, ${out.reduce((a, p) => a + p.documents.length, 0)} documents`
);
