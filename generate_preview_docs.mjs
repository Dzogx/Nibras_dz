/**
 * سكربت توليد وثائق معاينة — Manus داخلياً فقط.
 */
import { appRouter } from "./server/routers.ts";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema.ts";
import { writeFile } from "node:fs/promises";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "planetscale" });

const profiles = await db.select().from(schema.teacherProfiles).limit(100);
const userId = profiles[0]?.userId;
if (!userId) throw new Error("no profile found");
console.log("userId:", userId);

function createCtx(user) {
  return { user, db, req: {}, res: {} };
}

const caller = appRouter.createCaller(createCtx({
  id: userId,
  openId: "preview-user",
  email: "kamikazk7@gmail.com",
  name: "الهاشمي عبيدلي",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
}));

async function generateLesson() {
  const result = await caller.ai.generateLesson({
    title: "مذكرة: التعرف على موقع الجزائر وأهميته - الموقع الجغرافي والفلكي",
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الرابعة متوسط",
    duration: "ساعة ونصف",
    contentType: "lessonPlan",
    classId: 60005,
    enableDifferentiation: true,
    studentLevel: "mixed",
    difficultyLevel: "progressive",
  });
  return result;
}

async function generateAssessment() {
  const result = await caller.ai.generateAssessment({
    classId: 60005,
    title: "اختبار الفصل الأول في التاريخ - السنة الرابعة متوسط",
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الرابعة متوسط",
    assessmentType: "exam",
    topic: "الوثائق التاريخية والتاريخ الوطني: الاحتلال الفرنسي ومقاومته",
    duration: "ساعة ونصف",
    useNationalRules: true,
    situationIds: [150012, 150013, 150014, 150015],
  });
  return result;
}

async function main() {
  try {
    const lesson = await generateLesson();
    writeFile("/tmp/lesson_result.json", JSON.stringify(lesson, null, 2), "utf8");
    console.log("LESSON DONE, resourceId:", lesson.resourceId);
    const contentLen = lesson.content?.length || 0;
    console.log("lesson content length:", contentLen);
    writeFile("/tmp/lesson_content.txt", lesson.content || "", "utf8");

    const assessment = await generateAssessment();
    writeFile("/tmp/assessment_result.json", JSON.stringify(assessment, null, 2), "utf8");
    console.log("ASSESSMENT DONE, resourceId:", assessment.resourceId);
    writeFile("/tmp/assessment_content.txt", assessment.content || "", "utf8");
    console.log("assessment content length:", assessment.content?.length || 0);
    console.log("ALL DONE");
  } catch (e) {
    console.error("FAILED:", e?.message || e);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

await main();
