type StrategyPhase = {
  stage: string;
  minutes: number;
  teacherRole: string;
  studentRole: string;
  tips?: string;
};

export type ActiveLearningCardInput = {
  dateLabel: string;
  subject: string;
  gradeLevel: string;
  situationTitle: string;
  strategyName: string;
  totalMinutes: number;
  rationale: string;
  phases: StrategyPhase[];
  tips: string[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

/** بطاقة تعلم نشط قابلة للطباعة؛ الهوية مسموحة هنا لأنها أداة صفية لا وثيقة رسمية. */
export function buildActiveLearningCardHtml(input: ActiveLearningCardInput) {
  const phases = input.phases.map((phase, index) => `
    <tr>
      <td><span class="step-number">${index + 1}</span><strong>${escapeHtml(phase.stage)}</strong></td>
      <td class="duration">${phase.minutes} د</td>
      <td>${escapeHtml(phase.teacherRole)}</td>
      <td>${escapeHtml(phase.studentRole)}</td>
      <td>${escapeHtml(phase.tips || "—")}</td>
    </tr>`).join("");
  const tips = input.tips.length
    ? `<section class="tips"><h2>توصيات للتيسير</h2><ul>${input.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></section>`
    : "";

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8" />
<style>
  @page { size: A4 portrait; margin: 11mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #14233d; background: #fffefb; font-family: "Amiri", "Noto Naskh Arabic", serif; font-size: 11pt; line-height: 1.62; }
  .sheet { position: relative; min-height: 272mm; padding-bottom: 17mm; }
  .masthead { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: end; padding: 6px 2px 12px; border-bottom: 3px solid #173c66; }
  .masthead::after { content: ""; position: absolute; bottom: -3px; right: 0; width: 33%; height: 3px; background: #c4902f; }
  .brand { color: #173c66; font-size: 23pt; font-weight: 800; line-height: 1; letter-spacing: .02em; }
  .brand small { display: block; margin-top: 5px; color: #557083; font-family: "Latin Modern Roman", serif; font-size: 8pt; letter-spacing: .28em; direction: ltr; }
  .title-group { text-align: left; }
  .title-group h1 { margin: 0; color: #173c66; font-size: 21pt; line-height: 1.15; }
  .title-group p { margin: 4px 0 0; color: #9b6f1c; font-size: 10.5pt; font-weight: 700; }
  .facts { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #d8e0e5; border-radius: 9px; overflow: hidden; margin: 11px 0; background: white; }
  .fact { min-height: 53px; padding: 7px 9px; border-left: 1px solid #d8e0e5; }
  .fact:last-child { border-left: 0; }
  .fact-label { display: block; color: #547083; font-size: 8.8pt; font-weight: 700; }
  .fact-value { display: block; margin-top: 2px; color: #14233d; font-size: 10.5pt; font-weight: 700; }
  .band { display: flex; align-items: center; gap: 8px; color: white; background: #173c66; border-radius: 7px 7px 2px 2px; padding: 6px 13px; font-size: 12pt; font-weight: 700; }
  .band .tag { margin-inline-start: auto; border: 1px solid rgba(255,255,255,.5); border-radius: 999px; padding: 1px 9px; font-size: 8.5pt; font-weight: 400; }
  .strategy { border: 1px solid #d8e0e5; border-top: 0; border-radius: 0 0 9px 9px; padding: 11px 13px; background: #f8fbfb; }
  .strategy h2 { margin: 0 0 4px; color: #176f70; font-size: 15pt; }
  .strategy p { margin: 0; }
  h2 { color: #173c66; font-size: 13pt; margin: 14px 0 7px; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #ced9df; border-radius: 9px; overflow: hidden; font-size: 9.8pt; }
  th { padding: 7px 6px; color: white; background: #1d5d73; font-weight: 700; text-align: right; }
  td { padding: 7px 6px; vertical-align: top; border-top: 1px solid #dce4e8; border-left: 1px solid #dce4e8; }
  td:last-child, th:last-child { border-left: 0; }
  tr:nth-child(even) td { background: #f7fafb; }
  .duration { color: #9b6f1c; font-weight: 700; white-space: nowrap; }
  .step-number { display: inline-grid; place-items: center; width: 19px; height: 19px; margin-inline-end: 5px; border-radius: 50%; color: white; background: #c4902f; font-size: 8pt; }
  .reflection { display: grid; grid-template-columns: 1.18fr .82fr; gap: 10px; margin-top: 13px; }
  .writing, .checklist { border: 1px solid #d8e0e5; border-radius: 9px; padding: 9px 11px; }
  .writing { background: #fbfcfc; }
  .writing h2, .checklist h2 { margin: 0 0 5px; font-size: 12pt; }
  .rule { height: 22px; border-bottom: 1px dotted #7890a0; }
  .checklist { background: #fffaf0; border-color: #e7d1a7; }
  .check { padding: 3px 0; font-size: 10pt; }
  .box { display: inline-block; width: 12px; height: 12px; margin-inline-end: 5px; border: 1px solid #9b6f1c; border-radius: 2px; vertical-align: -1px; }
  .tips { margin-top: 11px; padding: 8px 12px; border-right: 4px solid #c4902f; background: #fffaf0; }
  .tips h2 { margin: 0 0 2px; font-size: 11pt; }
  .tips ul { margin: 2px 0 0; padding-right: 18px; }
  .footer { position: absolute; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #d8e0e5; padding-top: 6px; color: #557083; font-size: 8.8pt; }
  .footer strong { color: #173c66; }
  @media print { body { background: white; } }
</style></head><body><main class="sheet">
  <header class="masthead"><div class="title-group"><h1>بطاقة تعلم نشط</h1><p>أفكّر · أتعاون · أنجز</p></div><div class="brand">نبراس<small>NIBRAS</small></div></header>
  <section class="facts"><div class="fact"><span class="fact-label">المادة</span><span class="fact-value">${escapeHtml(input.subject)}</span></div><div class="fact"><span class="fact-label">المستوى</span><span class="fact-value">${escapeHtml(input.gradeLevel)}</span></div><div class="fact"><span class="fact-label">التاريخ</span><span class="fact-value">${escapeHtml(input.dateLabel)}</span></div><div class="fact"><span class="fact-label">المدة</span><span class="fact-value">${input.totalMinutes} دقيقة</span></div></section>
  <div class="band">مسار النشاط <span class="tag">الوضعية: ${escapeHtml(input.situationTitle)}</span></div>
  <section class="strategy"><h2>${escapeHtml(input.strategyName)}</h2><p>${escapeHtml(input.rationale)}</p></section>
  <h2>مراحل الإنجاز</h2><table><thead><tr><th>المرحلة</th><th>الزمن</th><th>دور الأستاذ</th><th>دور المتعلم</th><th>تنبيه تيسيري</th></tr></thead><tbody>${phases}</tbody></table>
  <section class="reflection"><div class="writing"><h2>ماذا تعلمت اليوم؟</h2><div class="rule"></div><div class="rule"></div><div class="rule"></div></div><div class="checklist"><h2>تأمل ذاتي</h2><div class="check"><span class="box"></span>فهمت المطلوب من النشاط.</div><div class="check"><span class="box"></span>تعاونت مع زملائي باحترام.</div><div class="check"><span class="box"></span>قدمت نتيجة واضحة ومنظمة.</div></div></section>
  ${tips}<footer class="footer"><span>بطاقة عمل صفية</span><strong>نبراس · تعلم أعمق</strong><span>إمضاء الأستاذ: ....................</span></footer>
</main></body></html>`;
}
