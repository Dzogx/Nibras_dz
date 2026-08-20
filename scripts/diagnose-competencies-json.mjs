// تشخيص بنية competencies JSON في المقاطع المرجعية
import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query(
  `SELECT ap.gradeLevel, ap.subject, aps.sectionNumber, aps.title, aps.competencies
   FROM annualPlanSections aps
   JOIN annualPlans ap ON ap.id = aps.annualPlanId
   WHERE ap.isReference = 1
   ORDER BY ap.gradeLevel LIMIT 4`,
);
for (const r of rows) {
  console.log(r.gradeLevel, '|', r.subject, '| مقطع', r.sectionNumber, '|', r.title);
  let cs = r.competencies;
  if (typeof cs === 'string') {
    try { cs = JSON.parse(cs); cs = JSON.stringify(cs, null, 1); } catch { cs = String(cs).slice(0, 800); }
  } else {
    cs = JSON.stringify(cs, null, 1).slice(0, 800);
  }
  console.log(String(cs).slice(0, 800));
  console.log('---');
}
await conn.end();
