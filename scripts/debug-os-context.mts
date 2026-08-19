import { getAnnualPlans, getAnnualPlanSections, getLearningSituations } from "../server/db";

const userId = 1;
const classId = 90001;
const subject = "التاريخ والجغرافيا";
const academicYear = "2026-2027";

const plans = await getAnnualPlans(userId, { academicYear });
console.log("plans:", plans.map(p => ({ id: p.id, classId: p.classId, subject: p.subject, academicYear: p.academicYear })));

const planFilters = { academicYear };
let classPlan = plans.find(p => p.classId === classId && (!subject || p.subject === subject));
console.log("plan by subject match:", classPlan?.id);
if (!classPlan) classPlan = plans.find(p => p.classId === classId);
console.log("plan by fallback:", classPlan?.id);

if (classPlan) {
  const sections = await getAnnualPlanSections(classPlan.id);
  console.log("sections:", sections.map(s => s.id));
  let total = 0;
  let completed = 0;
  for (const section of sections) {
    const situations = await getLearningSituations(section.id);
    const comp = situations.filter(s => s.isCompleted);
    total += situations.length;
    completed += comp.length;
    console.log(`section ${section.id}: ${situations.length} situations, ${comp.length} completed`,
      comp.map(s => ({ id: s.id, title: s.title, completedDate: s.completedDate })));
  }
  console.log("TOTAL:", total, "COMPLETED:", completed);
}
process.exit(0);
