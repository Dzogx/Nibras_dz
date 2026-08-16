// سكربت توليد نموذج تجريبي لمذكرة درس — تاريخ، سنة 4 متوسط، المقطع الأول: الوثائق التاريخية
// يشغَّل بـ: npx tsx gen-sample-lesson.mts (كتعليمة TS لتفادي مشاكل ESM في المشروع)
import { eq } from "drizzle-orm";
import { users as userTable } from "./drizzle/schema.ts";
import { getDb } from "./server/db.ts";
import { appRouter } from "./server/routers.ts";

// 1. جلب المستخدم (أستاذ نبراس)
const db = await getDb();
const [user] = await db.select().from(userTable).limit(1);
if (!user) {
  console.error("لا يوجد مستخدم في قاعدة البيانات");
  process.exit(1);
}
console.log("المستخدم:", user.id, user.name);

// 2. بناء caller بسياق مزوّد بالمستخدم مباشرة (تجاوز OAuth في وضع السكربت)
// caller عبر createCaller مباشرة
const caller = appRouter.createCaller({ user, req: {} as any, res: {} as any });

// 3. البحث عن وضعية تاريخية في السنة الرابعة متوسط (المقطع الأول: الوثائق التاريخية)
import { annualPlans, annualPlanSections, learningSituations } from "./drizzle/schema.ts";
const plans = await db
  .select()
  .from(annualPlans)
  .where(eq(annualPlans.userId, user.id));
const classPlan = plans.find(
  (p) => p.gradeLevel === "4 متوسط" && p.subject === "التاريخ والجغرافيا"
);
console.log("الخطة:", classPlan?.id, classPlan?.title);

let targetSituation = null;
if (classPlan) {
  const sections = await db
    .select()
    .from(annualPlanSections)
    .where(eq(annualPlanSections.annualPlanId, classPlan.id));
  const sec = sections.find((s) => s.title === "المقطع الأول: الوثائق التاريخية");
  if (sec) {
    const situations = await db
      .select()
      .from(learningSituations)
      .where(eq(learningSituations.sectionId, sec.id));
    targetSituation = situations[0];
    console.log("المقطع:", sec.id, sec.title, "| الوضعيات:", situations.length);
  }
}
if (!targetSituation) {
  console.error("لا توجد وضعية تاريخية 4 متوسط — سنعتمد على قيم ثابتة من المنهاج");
}

const classId = classPlan?.classId;

// 4. استدعاء مولد المذكرة
const input = {
  classId: classId,
  title: targetSituation?.title || "من الوثيقة التاريخية إلى التاريخ",
  subject: "التاريخ والجغرافيا",
  gradeLevel: "4 متوسط",
  unitTitle: "المقطع الأول: الوثائق التاريخية",
  lessonNumber: 1,
  duration: "ساعة واحدة",
  contentType: "lessonPlan",
  llmModel: "qwen/qwen3-32b",
};
console.log("إدخال التوليد:", JSON.stringify(input, null, 1));

try {
  const { writeFileSync } = await import("fs");
  const result = await caller.ai.generateLesson(input);
  writeFileSync(
    "/home/ubuntu/nibras/nibras-sample-lesson.json",
    JSON.stringify(result, null, 2),
    "utf-8"
  );
  console.log("تم التوليد بنجاح");
} catch (err) {
  console.error("فشل التوليد:", err?.message || err);
  process.exit(1);
}
