require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  // 1) كل نموذج مع عدد مقاطعه
  const [models] = await conn.query(`
    SELECT cm.id, cm.gradeLevel, cm.subject,
           (SELECT COUNT(*) FROM sectionCompetencies sc WHERE sc.competencyModelId = cm.id) AS sectionCount,
           LEFT(cm.globalCompetency, 120) AS globalText
    FROM competencyModels cm ORDER BY cm.gradeLevel, cm.subject`);
  console.log('=== النماذج ===');
  for (const m of models) console.log(`${m.id} | ${m.gradeLevel} | ${m.subject} | أقسام: ${m.sectionCount} | ${m.globalText}`);
  // 2) تجميع حسب المجموعة للتأكد من عدم تكرار النماذج
  const groups = {};
  for (const m of models) {
    const k = m.gradeLevel + '|' + m.subject;
    groups[k] = (groups[k] || 0) + 1;
  }
  console.log('\n=== تكرار النماذج ===');
  for (const [k, n] of Object.entries(groups)) console.log(`${k}: ${n} نموذجًا`);
  // 3) عينة كفاءة ختامية مع معاييرها
  const [sample] = await conn.query('SELECT sectionNumber, sectionTitle, competencyAction, LEFT(termCompetency, 80) AS t, criteria FROM sectionCompetencies LIMIT 2');
  console.log('\n=== عينة ===');
  console.log(JSON.stringify(sample, null, 1));
  await conn.end();
  process.exit(0);
})();
