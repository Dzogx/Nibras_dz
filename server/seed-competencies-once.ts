/**
 * سكربت one-shot لملء الجدول الهرمي للكفاءات (بدون LLM):
 * - competencyModels: الكفاءة الشاملة لكل مجموعة (مستوى×مادة) من curriculumDocuments
 * - sectionCompetencies: الكفاءة الختامية لكل مقطع من annualPlanSections (isReference)
 * معايير ومؤشرات تُولد آليًا من الفعل والموضوع في صياغة الكفاءة.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const userId = process.env.OWNER_OPEN_ID || "owner";
const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');

const INTEGRATION_KEYWORDS = ["يدمج", "إدماج", "إدماجية", "وضعية الإدماج", "وضعية إدماج"];

/** صيغ الكفاءة الشاملة الرسمية من المنهاج الجزائري (تُستخدم عند اقتطاع محتوى الوثيقة). */
const GLOBAL_FALLBACKS: Record<string, string> = {
  "السنة الأولى متوسط|التاريخ والجغرافيا":
    "يكون المتعلم قادراً على إبراز قيمة الموروث التاريخي الوطني كمكون من مكونات الهوية الوطنية، من خلال التعرّف واكتشاف المنجزات الحضارية وأسلوب تكيف الإنسان مع وسطه",
  "السنة الثانية متوسط|التاريخ والجغرافيا":
    "يكون المتعلم قادراً على إبراز الدور التاريخي للجزائر في الوطن العربي والعالم الإسلامي، وتفعيل دورها ضمن محيطها الجهوي والقاري والعالمي",
  "السنة الثالثة متوسط|التاريخ والجغرافيا":
    "يكون المتعلم قادراً على التعريف بالشخصية الجزائرية في مختلف مظاهرها من خلال إبراز دور الحركات الإصلاحية ومقاومة الاستعمار",
  "السنة الرابعة متوسط|التاريخ والجغرافيا":
    "يكون المتعلم قادراً على التعريف بالشخصية الجزائرية في مختلف مظاهرها من خلال استكشاف مظاهر استقلال الدولة الجزائرية الحديثة",
  "السنة الأولى متوسط|التربية المدنية":
    "في نهاية السنة الأولى من التعليم المتوسط، في وضعيات دالة، باستعمال مفاهيم وحقائق ومنهجيات خاصة بالمواد الاجتماعية، يكون المتعلم قادراً على ممارسة حقوقه وواجباته انطلاقاً مما تفرضه وتيرة التمدرس في المؤسسة التعليمية من نظام ومسؤولية تجاه الذات والغير",
  "السنة الثانية متوسط|التربية المدنية":
    "في نهاية السنة الثانية من التعليم المتوسط، في وضعيات دالة، يكون المتعلم قادراً على إبراز قيم المواطنة وأخلاقيات التواصل والتضامن انطلاقاً من وثائق حقوق الإنسان",
  "السنة الثالثة متوسط|التربية المدنية":
    "في نهاية السنة الثالثة من التعليم المتوسط، في وضعيات دالة، يكون المتعلم قادراً على إبراز مفهوم الدولة الجزائرية كجمهورية ديمقراطية شعبية وتأكيد تمسكه بترقية العلاقات الاجتماعية في إطار المؤسسات",
  "السنة الرابعة متوسط|التربية المدنية":
    "في نهاية التعليم المتوسط، في وضعيات دالة، يكون المتعلم قادراً على إبراز مظاهر استقلال الدولة الجزائرية الحديثة ذات السيادة الكاملة والتأكيد على تمسكه بقيم الجمهورية والمواطنة",
};

// توحيد الموضوع في مفاتيح الـ fallback: الجغرافيا والتاريخ المنفصلان يستخدمان كفاءة التاريخ والجغرافيا الموحدة
const normalizedFallbacks: Record<string, string> = {};
for (const [k, v] of Object.entries(GLOBAL_FALLBACKS)) {
  normalizedFallbacks[k] = v;
  const [grade, subj] = k.split("|");
  if (subj === "التاريخ والجغرافيا") {
    normalizedFallbacks[`${grade}|الجغرافيا`] = v;
    normalizedFallbacks[`${grade}|التاريخ`] = v;
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // 1) مسح الجداول (one-shot)
  await conn.query("DELETE FROM sectionCompetencies");
  await conn.query("DELETE FROM competencyModels");

  // 2) الكفاءة الشاملة لكل مجموعة مستوى×مادة من curriculumDocuments
  const [docsRows] = await conn.query<any>([
    "SELECT gradeLevel, subject, title, content",
    "FROM curriculumDocuments",
    "WHERE type = 'competency' AND title LIKE '%الكفاءة الشاملة%'",
  ].join(" "));

  const globalMap = new Map<string, { title: string; content: string }>();
  for (const d of docsRows as any[]) {
    const key = `${d.gradeLevel}|${d.subject}`;
    if (!globalMap.has(key)) {
      globalMap.set(key, { title: String(d.title || ""), content: String(d.content || "") });
    }
  }

  // 3) المقاطع المرجعية مع كفاءاتها الختامية
  const [secRows] = await conn.query<any>([
    "SELECT ap.id AS planId, ap.gradeLevel, ap.subject, aps.sectionNumber, aps.title, aps.competencies",
    "FROM annualPlanSections aps",
    "JOIN annualPlans ap ON ap.id = aps.annualPlanId",
    "WHERE ap.isReference = 1",
    "ORDER BY ap.gradeLevel, ap.subject, aps.sectionNumber",
  ].join(" "));

  const groups = new Map<string, { gradeLevel: string; subject: string; sections: any[] }>();
  for (const s of secRows as any[]) {
    // توحيد الموضوع ضمن enum قاعدة البيانات: (التاريخ | الجغرافيا) → 'التاريخ والجغرافيا'
    const subject = s.subject === "التاريخ" ? "التاريخ والجغرافيا" : s.subject;
    const key = `${s.gradeLevel}|${subject}`;
    if (!groups.has(key)) groups.set(key, { gradeLevel: s.gradeLevel, subject, sections: [] });
    groups.get(key)!.sections.push(s);
  }

  // مطابقة مرنة للموضوع: التاريخ والجغرافيا يدرّسان معًا (الكفاءة الشاملة موحدة)
  const resolveGlobal = (gradeLevel: string, subject: string) => {
    const direct = globalMap.get(`${gradeLevel}|${subject}`);
    if (direct) return direct;
    if (subject === "الجغرافيا" || subject === "التاريخ") {
      return globalMap.get(`${gradeLevel}|التاريخ والجغرافيا`);
    }
    if (subject === "التاريخ والجغرافيا") {
      return globalMap.get(`${gradeLevel}|الجغرافيا`) || globalMap.get(`${gradeLevel}|التاريخ`);
    }
    return undefined;
  };

  for (const [key, group] of Array.from(groups.entries())) {
    const global = resolveGlobal(group.gradeLevel, group.subject);
    if (!global) {
      console.warn(`[تحذير] لا توجد وثيقة كفاءة شاملة لـ ${key} — تخطّي`);
      continue;
    }
    // نص الكفاءة الشاملة: أول جملة تبدأ بفعل كفاءة معروف (تجنب الجداول والقوائم)
    const VERB_PREFIX = new RegExp(
      "^(يوظف|يوظّف|يستعمل|يستغل|يكون|يبرز|يقدم|يقدّم|يكشف|يكشّف|ينطلق|يمارس|يحلل|يحلّل|يعتمد|يحلل|يُحلّل|يطبق|يُطبق|يقيم|يُقيّم|يشرح|يُشرح|يستنتج|يُستنتج|يوظف)"
    );
    const ARABIC_START = new RegExp("^[أإآابتثجحخدذرزسشصضطظعغفقكلمنهوي]");
    const cleanLines = global.content.split(/\n/).map(l => l.trim()).filter(l => l.length > 0 && !/[\u2500-\u257F\|#\*\|]/.test(l.slice(0, 2)) && !/^[0-9\-•●]/.test(l));
    let globalText = "";
    for (const l of cleanLines) {
      if (VERB_PREFIX.test(l) || ARABIC_START.test(l)) {
        globalText = l;
        break;
      }
    }
    if (!globalText && cleanLines.length) globalText = cleanLines[0];
    if (!globalText) globalText = global.title;
    globalText = globalText.trim().slice(0, 500);
    // إذا كان محتوى الوثيقة مقتطعًا أو غير ذي صلة (لا يبدأ بفعل كفاءة معرّف أو قصير جدًا) نستخدم الصيغة الرسمية
    const fallback = normalizedFallbacks[`${group.gradeLevel}|${group.subject}`];
    const looksLikeGlobalCompetency =
      /يكون المتعلم|في نهاية السنة|في نهاية التعليم المتوسط/.test(globalText) ||
      VERB_PREFIX.test(globalText);
    if (fallback && (!looksLikeGlobalCompetency || globalText.length < 60)) {
      globalText = fallback;
      console.warn(`[تنبيه] ${key}: محتوى الوثيقة غير صالح — استُخدمت الصيغة الرسمية من المنهاج`);
    }

    const [mres] = await conn.query<any>(
      `INSERT INTO competencyModels (userId, gradeLevel, subject, globalCompetency, sourceDocTitle)      VALUES ('${esc(userId)}', '${esc(group.gradeLevel)}', '${esc(group.subject)}', '${esc(globalText)}', '${esc(String(global.title).slice(0, 256))}')`,
    );
    const modelId = (mres as any).insertId;

    for (const s of group.sections) {
      const compText = String(s.competencies || "").trim().slice(0, 800);
      if (!compText) continue;
      const isIntegration =
        INTEGRATION_KEYWORDS.some(k => compText.includes(k)) ||
        INTEGRATION_KEYWORDS.some(k => String(s.title || "").includes(k));
      // التسلسل التربوي وفق المقاربة بالكفاءات: المقطع الأول تنصيب (اكتساب المعارف الجديدة)،
      // والمقطع الأخير إدماج (وضعية إدماجية)، والوسط إنماء — حتى لو لم تذكر كلمة إدماج نصًّا
      let action: "تنصيب" | "إنماء" | "إدماج" = "إنماء";
      const firstNum = group.sections.length > 0 ? group.sections[0].sectionNumber : null;
      const lastNum = group.sections.length > 0 ? group.sections[group.sections.length - 1].sectionNumber : null;
      if (firstNum !== null && s.sectionNumber === firstNum) {
        action = "تنصيب";
      } else if (lastNum !== null && s.sectionNumber === lastNum) {
        action = "إدماج";
      }
      const verbMatch = compText.match(/^([^\s،,.]+)(.{0,60})/);
      const topic = (verbMatch ? verbMatch[2] : compText.slice(0, 40)).replace(/[،,.]+$/, "").trim();
      const criteria = JSON.stringify([
        { criterion: "التوظيف", indicators: [`إتقان ${topic.slice(0, 50)} في وضعيات مشابهة`, `استعمال أدوات المادة في معالجته`] },
        { criterion: "التحليل", indicators: [`تفكيك عناصر ${topic.slice(0, 30)} وربطها`, `تفسير العلاقات بينها`] },
        { criterion: "التقويم", indicators: [`إصدار أحكام مبررة حول ${topic.slice(0, 30)}`, `مقارنة بين أمثلة من السياق`] },
      ]);
      const knowledge = JSON.stringify([{ title: topic.slice(0, 60) || String(s.title || ""), action: action }]);

      await conn.query(
        `INSERT INTO sectionCompetencies (competencyModelId, sectionNumber, sectionTitle, termCompetency, competencyAction, criteria, knowledgeResources) VALUES (${modelId}, ${Number(s.sectionNumber)}, '${esc(String(s.title || ""))}', '${esc(compText)}', '${esc(action)}', '${esc(criteria)}', '${esc(knowledge)}')`,
      );
    }
    console.log(`✓ ${group.gradeLevel} / ${group.subject}: ${group.sections.length} مقطعًا → نموذج ${modelId}`);
  }

  const [cnt] = await conn.query("SELECT COUNT(*) AS n FROM competencyModels") as any;
  const [scnt] = await conn.query("SELECT COUNT(*) AS n FROM sectionCompetencies") as any;
  console.log(`Done — ${cnt[0].n} نموذجًا و${scnt[0].n} كفاءة ختامية.`);
  await conn.end();
  process.exit(0);
}

void main().catch(e => {
  console.error(e);
  process.exit(1);
});
