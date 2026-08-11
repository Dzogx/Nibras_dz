/**
 * Seed the curriculumDocuments table with official 2022 annual plan data.
 * Uses Drizzle ORM API.
 */
import { getDb } from "./server/db";
import {
  annualPlans,
  annualPlanSections,
  learningSituations,
  curriculumDocuments,
} from "./drizzle/schema";
import { sql } from "drizzle-orm";
import fs from "fs";

interface Situation {
  number: number;
  title: string;
  type: string;
  objectives: string;
  activities: string;
  duration: string;
}

interface Section {
  chapter: number;
  terminal_competency: string;
  section_title: string;
  situations: Situation[];
  duration: string;
}

interface Plan {
  metadata: {
    subject: string;
    level: string;
    filename: string;
    academic_year: string;
    source: string;
  };
  global_competency: string;
  sections: Section[];
  char_count: number;
}

async function main() {
  const db = await getDb();
  console.log("DB connection established");

  const dataPath = "/home/ubuntu/curriculum_data/structured.json";
  const plans: Plan[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`Loaded ${plans.length} plans`);

  // Get owner user ID
  let userId = 1;
  const users = await db.select().from(curriculumDocuments).limit(1);
  const [userResult] = await db.execute(sql`SELECT id FROM users LIMIT 1`);
  if (Array.isArray(userResult) && userResult.length > 0) {
    userId = userResult[0].id;
  }
  console.log(`Using userId: ${userId}`);

  // Clear existing data
  console.log("Clearing existing data...");
  await db.execute(sql`DELETE FROM learningSituations`);
  await db.execute(sql`DELETE FROM annualPlanSections`);
  await db.execute(sql`DELETE FROM annualPlans WHERE title LIKE 'المخطط السنوي 2022%'`);
  await db.execute(sql`DELETE FROM curriculumDocuments WHERE sourceReference LIKE '%المخططات السنوية 2022%'`);

  for (const plan of plans) {
    const subject = plan.metadata.subject;
    const level = plan.metadata.level;
    const year = plan.metadata.academic_year;
    const source = plan.metadata.source;

    console.log(`\n  Processing: ${subject} - ${level} (${plan.sections.length} sections)`);

    // Insert plan
    const planTitle = `المخطط السنوي ${year} - ${subject} - ${level}`;
    const planInsertResult = await db.insert(annualPlans).values({
      userId,
      subject,
      gradeLevel: level,
      academicYear: year,
      title: planTitle,
      content: plan.global_competency || "",
      classId: null,
    });
    const planId = planInsertResult[0].insertId;
    console.log(`  Plan ID: ${planId}`);

    // Insert global competency doc
    if (plan.global_competency) {
      await db.insert(curriculumDocuments).values({
        title: `الكفاءة الشاملة - ${subject} - ${level}`,
        type: "competency",
        subject: subject,
        gradeLevel: level,
        content: plan.global_competency,
        academicYear: year,
        tags: ["الكفاءة الشاملة"],
        sourceReference: source,
      });
    }

    for (const section of plan.sections) {
      if (!section.section_title && !section.terminal_competency && section.situations.length === 0) continue;

      const sectionTitle = (section.section_title || `المقطع ${section.number}`).slice(0, 256);

      // Insert section
      const sectionInsertResult = await db.insert(annualPlanSections).values({
        userId,
        annualPlanId: planId,
        sectionNumber: section.number,
        title: sectionTitle,
        duration: section.duration || "",
        competencies: section.terminal_competency || "",
        objectives: "",
        resources: "",
        isCompleted: false,
      });
      const sectionId = sectionInsertResult[0].insertId;

      // Insert terminal competency doc
      if (section.terminal_competency) {
        await db.insert(curriculumDocuments).values({
          title: `الكفاءة الختامية ${section.number} - ${subject} - ${level}`,
          type: "competency",
          subject: subject,
          gradeLevel: level,
          content: section.terminal_competency,
          academicYear: year,
          unitNumber: section.number,
          tags: ["الكفاءة الختامية", `المقطع ${section.number}`],
          sourceReference: source,
        });
      }

      // Insert situations
      for (const sit of section.situations) {
        if (!sit.title && !sit.objectives && !sit.activities) continue;

        const sitTitle = (sit.title || `الوضعية ${sit.number}`).slice(0, 256);

        await db.insert(learningSituations).values({
          userId,
          sectionId,
          situationNumber: sit.number,
          title: sitTitle,
          objectives: sit.objectives || "",
          content: sit.activities || "",
          isCompleted: false,
        });

        // Insert situation doc for RAG
        if (sit.objectives || sit.activities) {
          await db.insert(curriculumDocuments).values({
            title: `الوضعية ${sit.number} - ${subject} - ${level} - المقطع ${section.number}`,
            type: "unit",
            subject: subject,
            gradeLevel: level,
            content: (sit.objectives || "") + "\n\n" + (sit.activities || ""),
            academicYear: year,
            unitNumber: section.number,
            lessonNumber: sit.number,
            tags: ["الوضعية التعليمية", `المقطع ${section.number}`],
            sourceReference: source,
          });
        }
      }
    }

    // Insert plan summary doc
    await db.insert(curriculumDocuments).values({
      title: `المخطط السنوي ${year} - ${subject} - ${level}`,
      type: "annualPlan",
      subject: subject,
      gradeLevel: level,
      content: `الكفاءة الشاملة: ${plan.global_competency || ""}\n\n` +
        plan.sections.map(s =>
          `المقطع ${s.number}: ${s.section_title || ""}\nالكفاءة الختامية: ${s.terminal_competency || ""}\nالوضعيات: ${s.situations.length}`
        ).join("\n\n"),
      academicYear: year,
      tags: ["المخطط السنوي"],
      sourceReference: source,
    });
  }

  // Summary
  const [docCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM curriculumDocuments`);
  const [secCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM annualPlanSections`);
  const [sitCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM learningSituations`);
  const [planCount] = await db.execute(sql`SELECT COUNT(*) as cnt FROM annualPlans`);

  console.log("\n=== Seeding Complete ===");
  console.log(`curriculumDocuments: ${docCount.cnt}`);
  console.log(`annualPlanSections: ${secCount.cnt}`);
  console.log(`learningSituations: ${sitCount.cnt}`);
  console.log(`annualPlans: ${planCount.cnt}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
