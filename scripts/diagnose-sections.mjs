import mysql from "mysql2/promise";
import "dotenv/config";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [plans] = await conn.query(
  "SELECT id, gradeLevel, subject FROM annualPlans WHERE isReference = 1",
);
console.log(`reference plans: ${plans.length}`);

const [sections] = await conn.query(
  "SELECT annualPlanId, sectionNumber, title, competencies FROM annualPlanSections WHERE annualPlanId IN (?)",
  [plans.map(p => p.id)],
);
console.log(`total sections: ${sections.length}`);

for (const s of sections) {
  const num = Number(s.sectionNumber);
  const noComp = s.competencies === null || s.competencies === "";
  console.log(s.annualPlanId, "|", s.sectionNumber, "|", (s.title || "").slice(0, 40), "| num:", Number.isNaN(num), "| compNull:", noComp, "| compLen:", s.competencies ? s.competencies.length : 0);
}

// المقاطع المعبأة
const [filled] = await conn.query("SELECT COUNT(*) AS n FROM sectionCompetencies");
console.log("filled:", filled[0].n);

const [missing] = await conn.query(
  "SELECT cm.gradeLevel, cm.subject, cm.id FROM competencyModels cm LEFT JOIN sectionCompetencies sc ON sc.competencyModelId = cm.id WHERE sc.id IS NULL",
);
console.log("models without sections:", missing.length, JSON.stringify(missing));

const [s90012] = await conn.query(
  "SELECT competencies, duration FROM annualPlanSections WHERE annualPlanId = 90012",
);
for (const r of s90012) console.log("90012 row:", r.competencies, "| dur:", r.duration);

const [filledFor2] = await conn.query(
  "SELECT sectionNumber, sectionTitle, LENGTH(termCompetency) AS len FROM sectionCompetencies WHERE competencyModelId = 2",
);
console.log("filled for model 2:", filledFor2.length, JSON.stringify(filledFor2));

const [plansFor2] = await conn.query(
  "SELECT id, academicYear FROM annualPlans WHERE isReference = 1 AND gradeLevel = 'السنة الأولى متوسط' AND subject = 'التاريخ والجغرافيا'",
);
console.log("plans for 1AM geo:", JSON.stringify(plansFor2));

await conn.end();
