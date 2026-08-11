import { getDb } from "./server/db";
import {
  annualPlans,
  annualPlanSections,
  learningSituations,
  curriculumDocuments,
} from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  
  // Clear existing seeded data
  await db.execute(sql`DELETE FROM curriculum_documents`);
  await db.execute(sql`DELETE FROM learning_situations`);
  await db.execute(sql`DELETE FROM annual_plan_sections`);
  await db.execute(sql`DELETE FROM annual_plans`);
  
  console.log("Cleared existing data");
}

main().catch(console.error);
