// Sample exam generator: replicates the real generateAssessment flow using the
// project's own nationalRules engine + the built-in LLM API (forge).
// Run with: node scripts/generate_sample_exam.mjs
import { writeFileSync } from "fs";

// ─── 1. Env is already available via process.env (dev server injects it)

// ─── 2. Build rules context using the real engine ─────────────
import { createRequire } from "module";
const require = createRequire(import.meta.url);
await require("tsx/cjs/api").register({
  tsconfig: require.resolve("../tsconfig.json"),
});
const rulesMod = await import("../server/rules/nationalRules.ts");
const { getAssessmentRule, getExamHeader, buildAssessmentContext } = rulesMod;

// الوضعيات المنجزة فعلياً (من Teacher OS — قاعدة البيانات الرسمية)
const completedSituations = [
  { title: "يتعرّف على الصلح والوساطة كحلّ سلمّي وحضاري لفضّ النّزاعات — تعريف الصلح والوساطة", sectionTitle: "الحياة الجماعية", situationNumber: 1 },
  { title: "يستنتج دور أجهزة القضاء المختلفة في تحقيق الأمن والاستقرار — مؤسسات القضاء", sectionTitle: "الحياة الجماعية", situationNumber: 2 },
  { title: "تقرير عن جلسة صلح أو محاكمة", sectionTitle: "الحياة الجماعية", situationNumber: 3 },
  { title: "التعرف على النصوص المرجعية لحقوق الإنسان والمنظمات الإنسانية — الإعلان العالمي لحقوق الإنسان — حقوق الطفل", sectionTitle: "الحياة المدنية", situationNumber: 1 },
  { title: "استخلاص دور المؤسسات الاجتماعية والسياسية في تكريس حقوق الإنسان", sectionTitle: "الحياة المدنية", situationNumber: 2 },
  { title: "تبني فكرة أداء الواجب قبل ممارسة الحق أو المطالبة به — الهلال الأحمر الجزائري (نشاطاته ودوره)", sectionTitle: "الحياة المدنية", situationNumber: 3 },
  { title: "التعرف على الدستور ومحتوياته باعتباره مصدراً أساسياً للتشريع — تعريف الدستور", sectionTitle: "الحياة الديمقراطية ومؤسسات الجمهورية", situationNumber: 1 },
  { title: "إبراز أهمية احترام القانون لتحقيق العدل والأمن باعتباره مبدأً أساسياً", sectionTitle: "الحياة الديمقراطية ومؤسسات الجمهورية", situationNumber: 3 },
];

const rule = getAssessmentRule("السنة الرابعة متوسط", "التربية المدنية");
const examHeader = getExamHeader("السنة الرابعة متوسط", "التربية المدنية");
const rulesContext = buildAssessmentContext({
  gradeLevel: "السنة الرابعة متوسط",
  subject: "التربية المدنية",
  completedLessons: [],
  completedSituations,
  selectedCompetencies: [],
  autoImport: false,
});

const prompt = `أنت مساعد ذكي لتعليم الدراسات الاجتماعية في التعليم المتوسط الجزائري. أنشئ امتحاناً فصلياً رسمياً.

${rulesContext}

- الموضوع: الاختبار التجريبي الشامل في التربية المدنية (الجزء الأول: الوضعيات البسيطة | الجزء الثاني: وضعية إدماجية)
- المادة: التربية المدنية
- المستوى: السنة الرابعة متوسط

توزيع النقاط الرسمي:
${rule.weights.map(w => `- ${w.label}: ${w.points} نقطة (${((w.points / rule.totalPoints) * 100).toFixed(0)}%)`).join("\n")}

بناء الاختبار وفق الدليل الرسمي حصراً كما يلي:
- الجزء الأول (12 نقطة): ثلاث وضعيات بسيطة منفصلة (وضعية 1 + وضعية 2 + وضعية 3)، كل وضعية 4 نقاط، منفصلة عن بعضها تماماً (تعريف مصطلحات، تعداد مفاهيم، تحديد مهام وخصائص...).
- الجزء الثاني (8 نقاط): وضعية تقويمية مركبة واحدة من الواقع المعيش تقيس الكفاءة الشاملة، مع سياق وسندات وتعليمة للحل.

ضوابط إلزامية للوضعيات البسيطة في الجزء الأول:
1. بدون سياق إطلاقاً: صياغة مباشرة للسؤال دون تقديم أي سياق أو تمهيد سردي.
2. تدرج من الأسهل إلى الأصعب: الوضعية 1 تكون من مستويات بلوم الدنيا (المعرفة/الفهم)، والوضعية 2 في المستوى الأوسط (التطبيق/التحليل)، والوضعية 3 في المستوى الأعلى (التركيب/التقييم).
3. نسبة 60% للمستويات الدنيا من تصنيف بلوم (المعرفة + الفهم + التطبيق) و40% للمستويات العليا (التحليل + التركيب + التقييم) في الجزء الأول (أسئلة الوضعيات البسيطة — 12 نقطة): أي ما مجموعه 8 نقاط (60%) لأسئلة المستويات الدنيا، و4 نقاط (40%) لأسئلة المستويات العليا.

لكل وضعية بسيطة حدّد مستوى بلوم والفعل المعتمد بين قوسين، مثل: (المعرفة — عرّف) أو (التحليل — حلّل). قدم:
1. ترويسة رسمية بالمستوى والمادة والمدة
2. الوضعيات الثلاث المنفصلة ثم الوضعية الإدماجية — دون ذكر الكفاءة المستهدفة في ورقة الاختبار إطلاقاً (الكفاءة تخص وثائق الأستاذ فقط)
3. ربط كل وضعية بالكفاءة التي تقيسها يظهر فقط داخل مفتاح التصحيح وليس في ورقة التلميذ
4. سلم التنقيط التفصيلي لكل وضعية
5. نموذج الإجابة مع شبكة التقويم للوضعية الإدماجية

ابدأ بـ: ${examHeader}

قدم الامتحان مع مفتاح الإجابات ونظام التنقيط.`;

console.log(`RULE: ${rule.totalPoints} pts | ${rule.duration} | weights:`, JSON.stringify(rule.weights));
console.log("PROMPT LENGTH:", prompt.length, "chars");

// ─── 3. Call the built-in LLM (forge) ────────────────────────
const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
console.log("FORGE URL:", FORGE_URL ? FORGE_URL.slice(0, 60) + "..." : "MISSING");

const start = Date.now();
const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${FORGE_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.LLM_MODEL || "gemini-2.5-flash",
    messages: [
      { role: "system", content: "أنت مساعد تربوي لمادة الاجتماعيات في التعليم المتوسط الجزائري." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  }),
});
console.log("LLM call took", Date.now() - start, "ms | HTTP", res.status);

const data = await res.json();
const content = data?.choices?.[0]?.message?.content;
if (!content) {
  writeFileSync("/home/ubuntu/sample_exam_error.json", JSON.stringify(data, null, 2));
  console.error("NO CONTENT. Full response saved to /home/ubuntu/sample_exam_error.json");
  process.exit(1);
}

writeFileSync("/home/ubuntu/sample_exam_civic_4am.md", content, "utf8");
console.log("SAVED: /home/ubuntu/sample_exam_civic_4am.md");
