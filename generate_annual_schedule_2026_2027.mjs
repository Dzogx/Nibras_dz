import { readFile, writeFile } from 'node:fs/promises';

const inputPath = '/home/ubuntu/curriculum_data/structured.json';
const outputPath = '/home/ubuntu/nibras/annual_schedule_2026_2027_draft.md';

const canonicalSubject = (subject) => subject.includes('تاريخ') ? 'التاريخ' : subject;
const planKey = (subject, level) => `${canonicalSubject(subject)}|${level}`;

// These values were read from the original user-provided 2022 annual-plan PDFs.
// They intentionally do not rely on the partially unreliable `duration` values in structured.json.
const sectionHours = new Map([
  ['التاريخ|السنة الأولى متوسط', [8, 12, 7]],
  ['التاريخ|السنة الثانية متوسط', [8, 10, 7]],
  ['التاريخ|السنة الثالثة متوسط', [8, 12, 7]],
  ['التاريخ|السنة الرابعة متوسط', [10, 10, 10]],
  ['الجغرافيا|السنة الأولى متوسط', [10, 10, 7]],
  ['الجغرافيا|السنة الثانية متوسط', [10, 10, 7]],
  ['الجغرافيا|السنة الثالثة متوسط', [10, 10, 7]],
  ['الجغرافيا|السنة الرابعة متوسط', [10, 10, 7]],
  ['التربية المدنية|السنة الأولى متوسط', [10, 10, 7]],
  ['التربية المدنية|السنة الثانية متوسط', [10, 9, 8]],
  ['التربية المدنية|السنة الثالثة متوسط', [10, 9, 8]],
  ['التربية المدنية|السنة الرابعة متوسط', [10, 9, 8]],
]);

const fileByPlan = new Map([
  ['التاريخ|السنة الأولى متوسط', 'المخططاتالسنوية2022تاريخالسنةالأولىمتوسط(1).pdf'],
  ['التاريخ|السنة الثانية متوسط', 'المخططاتالسنوية2022تاريخالسنةالثانيةمتوسط(1).pdf'],
  ['التاريخ|السنة الثالثة متوسط', 'المخططاتالسنوية2022تاريخالسنةالثالثةمتوسط.pdf'],
  ['التاريخ|السنة الرابعة متوسط', 'المخططاتالسنوية2022تاريخالسنةالرابعةمتوسط(1).pdf'],
  ['الجغرافيا|السنة الأولى متوسط', 'المخططاتالسنوية2022جغرافياالسنةالأولىمتوسط(1).pdf'],
  ['الجغرافيا|السنة الثانية متوسط', 'المخططاتالسنوية2022جغرافياالسنةالثانيةمتوسط.pdf'],
  ['الجغرافيا|السنة الثالثة متوسط', 'المخططاتالسنوية2022جغرافياالسنةالثالثةمتوسط(1).pdf'],
  ['الجغرافيا|السنة الرابعة متوسط', 'المخططاتالسنوية2022جغرافياالسنةالرابعةمتوسط(1).pdf'],
  ['التربية المدنية|السنة الأولى متوسط', 'المخططاتالسنوية2022تربيةمدنيةالسنةالأولىمتوسط.pdf'],
  ['التربية المدنية|السنة الثانية متوسط', 'المخططاتالسنوية2022تربيةمدنيةالسنةالثانيةمتوسط(1).pdf'],
  ['التربية المدنية|السنة الثالثة متوسط', 'المخططاتالسنوية2022تربيةمدنيةالسنةالثالثةمتوسط.pdf'],
  ['التربية المدنية|السنة الرابعة متوسط', 'المخططاتالسنوية2022تربيةمدنيةالسنةالرابعةمتوسط(1).pdf'],
]);

const levelOrder = ['السنة الأولى متوسط', 'السنة الثانية متوسط', 'السنة الثالثة متوسط', 'السنة الرابعة متوسط'];
const subjectOrder = ['التاريخ', 'الجغرافيا', 'التربية المدنية'];
const span = (start, count) => count === 1 ? `الأسبوع ${start}` : `الأسابيع ${start}–${start + count - 1}`;

function distributeWeeks(weekCount, itemCount) {
  if (!itemCount) return [];
  const base = Math.floor(weekCount / itemCount);
  const remainder = weekCount % itemCount;
  return Array.from({ length: itemCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function escapeCell(value) {
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

const data = JSON.parse(await readFile(inputPath, 'utf8'));
const plans = data
  .map((plan) => ({ ...plan, displaySubject: canonicalSubject(plan.metadata.subject) }))
  .sort((a, b) => {
    const levelDiff = levelOrder.indexOf(a.metadata.level) - levelOrder.indexOf(b.metadata.level);
    return levelDiff || subjectOrder.indexOf(a.displaySubject) - subjectOrder.indexOf(b.displaySubject);
  });

const lines = [
  '# مسودة التدرج السنوي لمواد الاجتماعيات — 2026–2027',
  '',
  '> **صفة الوثيقة:** مسودة عمل أولية، وليست رزنامة مدرسية رسمية. تبدأ الحصص في الأسبوع الممتد من **الاثنين 5 أكتوبر 2026**. وقد تُركت العطل والاختبارات كخانات «[رزنامة معلقة]» إلى حين صدور رزنامة وزارة التربية الوطنية الخاصة بسنة 2026–2027.',
  '',
  '## ضوابط الاعتماد',
  '',
  '| الضابط | التطبيق في هذه المسودة |',
  '|---|---|',
  '| المصدر البيداغوجي | الوضعيات وعناوين المقاطع من المخططات السنوية الرسمية 2022 التي قدمها الأستاذ. |',
  '| الحجم الزمني | مدة كل مقطع قُرئت من ملفه الرسمي الأصلي وراجعت في سجل التحقق؛ لا تستخدم هذه الوثيقة حقول المدة غير الموثوقة في ملف التهيئة. [1] |',
  '| بداية التدريس | الأسبوع التعليمي 1: 5–9 أكتوبر 2026. |',
  '| العطل والاختبارات | صف مستقل «[رزنامة معلقة]» بعد كل فصل؛ لا يثبت تاريخ أو مدة قبل صدور الرزنامة الرسمية. |',
  '| توزيع الوضعيات داخل المقطع | **اقتراح تخطيطي** فقط: يقسم زمن التدريس المتبقي بالتتابع على الوضعيات الرسمية، مع أسبوع للإدماج الكلي وأسبوع للتقويم والمعالجة داخل الحجم الزمني المعلن. |',
  '| تسمية الوضعيات | يعرض الجدول ترتيب الوضعية داخل المقطع (1/عدد الوضعيات) بدلاً من إعادة صياغة عناوين استخراج 2022 آلياً؛ ويظل العنوان الحرفي المرجعي محفوظاً في سجل المنهاج. |',
  '| نزاهة المصدر | حيث لا يسمي المصدر الرسمي الوضعيات تفصيلاً (تاريخ 4AM)، لا تضاف عناوين بديلة أو محتوى مفترض. |',
  '',
  '## ملخص الأحجام الزمنية المعتمدة',
  '',
  '| المستوى | المادة | المقطع 1 | المقطع 2 | المقطع 3 | المجموع |',
  '|---|---:|---:|---:|---:|---:|',
];

for (const plan of plans) {
  const key = planKey(plan.metadata.subject, plan.metadata.level);
  const hours = sectionHours.get(key);
  if (!hours) throw new Error(`Missing verified hours for ${key}`);
  lines.push(`| ${plan.metadata.level} | ${plan.displaySubject} | ${hours[0]} سا | ${hours[1]} سا | ${hours[2]} سا | ${hours.reduce((total, value) => total + value, 0)} سا |`);
}

for (const plan of plans) {
  const key = planKey(plan.metadata.subject, plan.metadata.level);
  const hours = sectionHours.get(key);
  const sourceFile = fileByPlan.get(key);
  let week = 1;

  lines.push('', `## ${plan.metadata.level} — ${plan.displaySubject}`, '', `**المصدر المباشر:** \`/home/ubuntu/upload/${sourceFile}\`.[1]`, '', '| الأسبوع التعليمي | المقطع | البند المبرمج | الغرض |', '|---|---|---|---|');

  plan.sections.forEach((section, sectionIndex) => {
    const duration = hours[sectionIndex];
    const instructionalWeeks = duration - 2;
    const situations = section.situations ?? [];

    if (situations.length) {
      const distribution = distributeWeeks(instructionalWeeks, situations.length);
      situations.forEach((_, situationIndex) => {
        const allocatedWeeks = distribution[situationIndex];
        lines.push(`| ${span(week, allocatedWeeks)} | ${escapeCell(section.title)} | الوضعية التعليمية ${situationIndex + 1} من ${situations.length} | تدريس الوضعية وفق ترتيبها وعنوانها الحرفي في المخطط المرجعي |`);
        week += allocatedWeeks;
      });
    } else {
      lines.push(`| ${span(week, instructionalWeeks)} | ${escapeCell(section.title)} | تدريس بنود المقطع وفق المخطط الرسمي | ملف 2022 لا يسمي وضعيات تفصيلية؛ لا يضاف عنوان غير موثق |`);
      week += instructionalWeeks;
    }

    lines.push(`| ${span(week, 1)} | ${escapeCell(section.title)} | إدماج كلي | إدماج موارد المقطع |`);
    week += 1;
    lines.push(`| ${span(week, 1)} | ${escapeCell(section.title)} | تقويم ومعالجة أولية | تقويم المكتسبات ومعالجة النقائص وفق نتائج القسم |`);
    week += 1;
    const phaseLabel = sectionIndex === 0 ? 'عطلة/اختبار نهاية الفصل الأول' : sectionIndex === 1 ? 'عطلة/اختبار نهاية الفصل الثاني' : 'اختبار نهاية الفصل الثالث/اختتام السنة';
    lines.push(`| [رزنامة معلقة] | — | ${phaseLabel} | تدرج هذه الفترة وتواريخها بعد صدور الرزنامة الرسمية فقط |`);
  });

  lines.push('', `**إجمالي الأسابيع التعليمية المبرمجة للمادة:** ${week - 1} أسبوعاً (باستثناء خانات الرزنامة المعلقة).`);
}

lines.push(
  '',
  '## ملاحظات استخدام',
  '',
  'تُقرأ الأرقام في عمود «الأسبوع التعليمي» كتسلسل تدريس فعلي **باستثناء** الفترات المعلقة؛ لذلك يعاد تثبيت التاريخ الميلادي لكل أسبوع لاحق مباشرة بعد إعلان الرزنامة الرسمية. ولا تغير خانات العطلة والاختبار عدد الأسابيع المخصصة للمقاطع؛ بل تؤخر تاريخ تنفيذ الأسبوع التعليمي اللاحق فقط.',
  '',
  '### المراجع',
  '',
  '[1]: file:///home/ubuntu/nibras/official_plan_duration_visual_notes.md "سجل التحقق البصري لمدد المقاطع من ملفات المخططات السنوية الرسمية 2022"',
  '[2]: file:///home/ubuntu/curriculum_data/structured.json "نسخة منظمة من عناوين المقاطع والوضعيات المأخوذة من المخططات الرسمية"',
  ''
);

await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
