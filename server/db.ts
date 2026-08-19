import { eq, asc, desc, and, or, like, sql, count, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertTeacherProfile, teacherProfiles,
  InsertAcademicYear, academicYears,
  InsertCurriculumDocument, curriculumDocuments,
  InsertClass, classes,
  InsertWeeklyScheduleEntry, weeklyScheduleEntries,
  InsertCompensatorySession, compensatorySessions,
  InsertAnnualPlan, annualPlans,
  InsertLesson, lessons,
  InsertTeachingNote, teachingNotes,
  InsertAIResource, aiResources,
  InsertInspectorReview, inspectorReviews,
  curriculumSearchIndex,
  annualPlanSections,
  learningSituations,
  assessmentResults,
  studentGrades,
  InsertStudentGrade,
  gradebookEntries,
  InsertGradebookEntry,
  InsertAnnualPlanSection,
  InsertLearningSituation,
  InsertAssessmentResult,
} from "../drizzle/schema";
import { ENV } from './_core/env';
// xlsx تُستورد هنا مباشرة: نمط ESM ثابت متوافق مع الخادم والاختبارات معًا.
import * as XLSX from "xlsx";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * فرض db-mock: أي اختبار يحمّل getDb الحقيقي مباشرة من قاعدة بيانات حقيقية
 * (وليس db-mock.ts) يعتبر فاشلًا تصميميًا. في بيئة vitest نمنع الاتصال الفعلي.
 */
function _runningUnderVitest(): boolean {
  if (typeof process === "undefined") return false;
  // vitest يشغّل الاختبارات في عمال منفصلين (tinypool fork) حيث لا يظهر «vitest»
  // في process.argv — نعتمد على علامة بيئية يحددها runner عبر vitest.config
  const envFlag = process.env.__NIBRAS_TEST_MODE === "1";
  const argvFlag = Array.isArray(process.argv) && process.argv.some(a => /vitest|vite-node/.test(a));
  const metaFlag = typeof import.meta !== "undefined" &&
    typeof (import.meta as any).env?.VITEST === "boolean" &&
    (import.meta as any).env.VITEST === true;
  return Boolean(envFlag) || Boolean(argvFlag) || Boolean(metaFlag);
}

function _mockEnforced(): boolean {
  return typeof (globalThis as any).__NIBRAS_DB_MOCK_ENFORCED === "boolean"
    ? Boolean((globalThis as any).__NIBRAS_DB_MOCK_ENFORCED)
    : false;
}

export async function getDb() {
  if (_runningUnderVitest() && !_mockEnforced()) {
    throw new Error(
      "[db-mock] استدعاء getDb الحقيقي غير مسموح في الاختبارات — يجب استخدام db-mock.ts",
    );
  }
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Teacher Profile ──────────────────────────────────────────
export async function getTeacherProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTeacherProfile(data: InsertTeacherProfile) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(teacherProfiles).values(data);
  return { id: result.insertId };
}

export async function updateTeacherProfile(userId: number, data: Partial<InsertTeacherProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teacherProfiles).set(data as any).where(eq(teacherProfiles.userId, userId));
}

// ─── Academic Years ───────────────────────────────────────────
export async function getAcademicYears() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(academicYears).orderBy(desc(academicYears.year));
}

/** يفعّل موسمًا دراسيًا معيّنًا ويضبط سنة الدراسة في ملف الأستاذ، مع تعطيل كل المواسم الأخرى. */
export async function activateAcademicYear(userId: number, academicYear: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // تفعيل الموسم المطلوب وتعطيل البقية
  await db.update(academicYears).set({ isActive: false });
  await db.update(academicYears).set({ isActive: true }).where(eq(academicYears.year, academicYear));
  // ربط الملف الشخصي بسنة الدراسة المفعّلة
  await updateTeacherProfile(userId, { academicYear } as any);
  return true;
}

/** يعيد السنة الدراسية المفعّلة (isActive=true) إن وجدت، وأحدث سنة مُعرَّفة في غيابها. */
export async function getActiveAcademicYear(): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const active = await db.select().from(academicYears).where(eq(academicYears.isActive, true)).limit(1);
  if (active.length > 0) return active[0].year;
  const latest = await db.select().from(academicYears).orderBy(desc(academicYears.year)).limit(1);
  if (latest.length > 0) return latest[0].year;
  return undefined;
}

// ─── Curriculum Documents ─────────────────────────────────────
export async function getCurriculumDocuments(filters: { userId?: number; subject?: string; gradeLevel?: string; type?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.subject) conditions.push(eq(curriculumDocuments.subject, filters.subject as any));
  if (filters.gradeLevel) conditions.push(eq(curriculumDocuments.gradeLevel, filters.gradeLevel as any));
  if (filters.type) conditions.push(eq(curriculumDocuments.type, filters.type as any));
  if (filters.search) conditions.push(or(like(curriculumDocuments.title, `%${filters.search}%`), like(curriculumDocuments.content, `%${filters.search}%`)));
  if (conditions.length > 0) {
    return await db.select().from(curriculumDocuments).where(and(...conditions)).orderBy(desc(curriculumDocuments.createdAt));
  }
  return await db.select().from(curriculumDocuments).orderBy(desc(curriculumDocuments.createdAt));
}

/**
 * Retrieve curriculum documents relevant to a topic/lesson for RAG citation.
 * Performs keyword-based matching on title and content.
 */
export async function getCurriculumForTopic(topic: string, gradeLevel?: string, subject?: string) {
  const db = await getDb();
  if (!db) return [];

  const referenceConditions = [];
  if (gradeLevel) referenceConditions.push(eq(curriculumDocuments.gradeLevel, gradeLevel as any));
  if (subject) {
    // مخططات التاريخ والجغرافيا الرسمية مخزنة كمرجع مشترك، بينما قد يأتي طلب
    // المولد بمادة «التاريخ» أو «الجغرافيا» منفردة.
    const matchingSubjects = subject === "التاريخ" || subject === "الجغرافيا"
      ? or(
          eq(curriculumDocuments.subject, subject as any),
          eq(curriculumDocuments.subject, "التاريخ والجغرافيا" as any),
        )
      : eq(curriculumDocuments.subject, subject as any);
    referenceConditions.push(matchingSubjects);
  }

  // Split topic into keywords and match against title/content
  const keywords = topic.split(/\s+/).filter(k => k.length > 2);
  let keywordCondition;
  if (keywords.length > 0) {
    const searchConditions = keywords.map(k =>
      or(like(curriculumDocuments.title, `%${k}%`), like(curriculumDocuments.content, `%${k}%`))
    );
    if (searchConditions.length > 0) {
      keywordCondition = or(...searchConditions);
    }
  }

  if (keywordCondition) {
    const topicalDocuments = await db.select().from(curriculumDocuments)
      .where(and(...referenceConditions, keywordCondition))
      .orderBy(desc(curriculumDocuments.createdAt))
      .limit(10);
    if (topicalDocuments.length > 0) return topicalDocuments;
  }

  if (referenceConditions.length > 0) {
    // عدم تطابق عنوان الوضعية حرفيًا لا يعني غياب المرجع: المخطط السنوي وثيقة
    // منهجية رسمية، وهو المرجع الصحيح لتثبيت المستوى والمادة والكفاءات والوضعيات.
    const annualPlanReferences = await db.select().from(curriculumDocuments)
      .where(and(...referenceConditions, eq(curriculumDocuments.type, "annualPlan" as any)))
      .orderBy(desc(curriculumDocuments.createdAt))
      .limit(2);
    const supportingReferences = await db.select().from(curriculumDocuments)
      .where(and(...referenceConditions))
      .orderBy(desc(curriculumDocuments.createdAt))
      .limit(8);

    return [...annualPlanReferences, ...supportingReferences.filter(document =>
      !annualPlanReferences.some(plan => plan.id === document.id)
    )].slice(0, 10);
  }

  return await db.select().from(curriculumDocuments).orderBy(desc(curriculumDocuments.createdAt)).limit(10);
}

export async function getCurriculumDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(curriculumDocuments).where(eq(curriculumDocuments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCurriculumDocument(data: InsertCurriculumDocument) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(curriculumDocuments).values(data);
  const docId = result.insertId;
  // Build search index
  if (data.title || data.content) {
    await db.insert(curriculumSearchIndex).values({
      documentId: docId,
      searchText: `${data.title || ''} ${data.content?.substring(0, 500) || ''}`.trim(),
    });
  }
  return { id: docId };
}

export async function updateCurriculumDocument(id: number, data: Partial<InsertCurriculumDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(curriculumDocuments).set(data as any).where(eq(curriculumDocuments.id, id));
}

export async function deleteCurriculumDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(curriculumSearchIndex).where(eq(curriculumSearchIndex.documentId, id));
  await db.delete(curriculumDocuments).where(eq(curriculumDocuments.id, id));
}

// ─── Classes ──────────────────────────────────────────────────
export async function getClasses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(classes).where(eq(classes.userId, userId)).orderBy(desc(classes.createdAt));
}

export async function getClassById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClass(data: InsertClass) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(classes).values(data);
  return { id: result.insertId };
}

export async function updateClass(id: number, data: Partial<InsertClass>) {
  const db = await getDb();
  if (!db) return;
  await db.update(classes).set(data as any).where(eq(classes.id, id));
}

export async function deleteClass(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(classes).where(eq(classes.id, id));
}

// ─── Weekly Schedule ──────────────────────────────────────────
export async function getWeeklyScheduleEntries(userId: number, academicYear: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(weeklyScheduleEntries)
    .where(and(
      eq(weeklyScheduleEntries.userId, userId),
      eq(weeklyScheduleEntries.academicYear, academicYear),
    ))
    .orderBy(weeklyScheduleEntries.dayOfWeek, weeklyScheduleEntries.periodIndex);
}

/** يعيد المواسم التي يملك الأستاذ فيها جدول خدمة محفوظاً. */
export async function listScheduleSeasons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ academicYear: weeklyScheduleEntries.academicYear })
    .from(weeklyScheduleEntries)
    .where(eq(weeklyScheduleEntries.userId, userId))
    .groupBy(weeklyScheduleEntries.academicYear)
    .orderBy(desc(weeklyScheduleEntries.academicYear));
  return rows.map((row) => row.academicYear);
}

export async function replaceWeeklyScheduleEntries(
  userId: number,
  academicYear: string,
  entries: Omit<InsertWeeklyScheduleEntry, "id" | "userId" | "academicYear" | "createdAt" | "updatedAt">[],
) {
  const db = await getDb();
  if (!db) return { count: 0 };

  await db.delete(weeklyScheduleEntries).where(and(
    eq(weeklyScheduleEntries.userId, userId),
    eq(weeklyScheduleEntries.academicYear, academicYear),
  ));

  if (entries.length === 0) return { count: 0 };

  await db.insert(weeklyScheduleEntries).values(entries.map(entry => ({
    ...entry,
    userId,
    academicYear,
  })));
  return { count: entries.length };
}

// ─── Compensatory Sessions ─────────────────────────────────────
/**
 * يحجز هذا السجل موعداً استثنائياً لوضعية مؤجلة أو ملغاة. يبقى مستقلاً تماماً
 * عن جدول الخدمة الدوري حتى لا يؤدي إعادة البرمجة إلى تعديل جدول الأستاذ.
 */
export async function createCompensatorySession(data: InsertCompensatorySession) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(compensatorySessions).values(data);
  return { id: result.insertId };
}

export async function getCompensatorySessionsBySituation(userId: number, situationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(compensatorySessions)
    .where(and(
      eq(compensatorySessions.userId, userId),
      eq(compensatorySessions.situationId, situationId),
    ))
    .orderBy(desc(compensatorySessions.scheduledDate), desc(compensatorySessions.periodIndex));
}

/** يعرض فقط الحجوزات المقبلة النشطة في الموسم المختار. */
export async function getUpcomingCompensatorySessions(userId: number, academicYear: string) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return await db
    .select()
    .from(compensatorySessions)
    .where(and(
      eq(compensatorySessions.userId, userId),
      eq(compensatorySessions.academicYear, academicYear),
      eq(compensatorySessions.status, "scheduled"),
      sql`${compensatorySessions.scheduledDate} >= ${localToday}`,
    ))
    .orderBy(compensatorySessions.scheduledDate, compensatorySessions.periodIndex);
}

export async function updateCompensatorySessionStatus(
  id: number,
  userId: number,
  status: "completed" | "cancelled",
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(compensatorySessions)
    .set({ status })
    .where(and(
      eq(compensatorySessions.id, id),
      eq(compensatorySessions.userId, userId),
    ));
}

// ─── Annual Plans ─────────────────────────────────────────────
export async function getAnnualPlans(userId: number, filters?: { academicYear?: string; subject?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [or(eq(annualPlans.userId, userId), eq(annualPlans.isReference, true))];
  if (filters?.academicYear) conditions.push(eq(annualPlans.academicYear, filters.academicYear));
  if (filters?.subject) conditions.push(eq(annualPlans.subject, filters.subject));
  return await db.select().from(annualPlans).where(and(...conditions)).orderBy(desc(annualPlans.createdAt));
}

export async function getAnnualPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(annualPlans).where(eq(annualPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnnualPlan(data: InsertAnnualPlan) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(annualPlans).values(data);
  return { id: result.insertId };
}

export async function updateAnnualPlan(id: number, data: Partial<InsertAnnualPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(annualPlans).set(data as any).where(eq(annualPlans.id, id));
}

export async function deleteAnnualPlan(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(annualPlans).where(eq(annualPlans.id, id));
}

/** ينسخ بنية مرجع رسمي (خطة ← مقاطع ← وضعيات) إلى نسخة تشغيلية مستقلة لقسم الأستاذ. */
export async function copyReferencePlanToClass(referencePlanId: number, userId: number, classId: number, academicYear: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [reference] = await db.select().from(annualPlans).where(and(
    eq(annualPlans.id, referencePlanId),
    eq(annualPlans.isReference, true),
  )).limit(1);
  if (!reference) return undefined;

  const [planResult] = await db.insert(annualPlans).values({
    userId,
    classId,
    subject: reference.subject,
    gradeLevel: reference.gradeLevel,
    academicYear,
    title: reference.title,
    content: reference.content,
    isReference: false,
  });
  const copiedPlanId = planResult.insertId;
  const referenceSections = await db.select().from(annualPlanSections)
    .where(eq(annualPlanSections.annualPlanId, referencePlanId))
    .orderBy(annualPlanSections.sectionNumber);

  for (const referenceSection of referenceSections) {
    const [sectionResult] = await db.insert(annualPlanSections).values({
      userId,
      annualPlanId: copiedPlanId,
      sectionNumber: referenceSection.sectionNumber,
      title: referenceSection.title,
      duration: referenceSection.duration,
      competencies: referenceSection.competencies,
      objectives: referenceSection.objectives,
      resources: referenceSection.resources,
      isCompleted: false,
    });
    const referenceSituations = await db.select().from(learningSituations)
      .where(eq(learningSituations.sectionId, referenceSection.id))
      .orderBy(learningSituations.situationNumber);
    if (referenceSituations.length) {
      await db.insert(learningSituations).values(referenceSituations.map((situation) => ({
        userId,
        sectionId: sectionResult.insertId,
        situationNumber: situation.situationNumber,
        title: situation.title,
        objectives: situation.objectives,
        content: situation.content,
        isCompleted: false,
        completedDate: null,
        completionNotes: null,
        sessionStatus: null,
      })));
    }
  }
  return { id: copiedPlanId };
}

// ─── Lessons ──────────────────────────────────────────────────
export async function getLessons(userId: number, filters?: { classId?: number; isCompleted?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(lessons.userId, userId)];
  if (filters?.classId) conditions.push(eq(lessons.classId, filters.classId));
  if (filters?.isCompleted !== undefined) conditions.push(eq(lessons.isCompleted, filters.isCompleted));
  return await db.select().from(lessons).where(and(...conditions)).orderBy(desc(lessons.createdAt));
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLesson(data: InsertLesson) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(lessons).values(data);
  return { id: result.insertId };
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set(data as any).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.id, id));
}

export async function toggleLessonCompleted(id: number, isCompleted: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set({ isCompleted }).where(eq(lessons.id, id));
}

// ─── Teaching Notes ───────────────────────────────────────────
export async function getTeachingNotes(userId: number, filters?: { lessonId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(teachingNotes.userId, userId)];
  if (filters?.lessonId) conditions.push(eq(teachingNotes.lessonId, filters.lessonId));
  return await db.select().from(teachingNotes).where(and(...conditions)).orderBy(desc(teachingNotes.createdAt));
}

export async function createTeachingNote(data: InsertTeachingNote) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(teachingNotes).values(data);
  return { id: result.insertId };
}

export async function updateTeachingNote(id: number, data: Partial<InsertTeachingNote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teachingNotes).set(data as any).where(eq(teachingNotes.id, id));
}

export async function deleteTeachingNote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teachingNotes).where(eq(teachingNotes.id, id));
}

// ─── AI Resources ─────────────────────────────────────────────
export async function getAIResources(userId: number, filters?: { type?: string; lessonId?: number; classId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiResources.userId, userId)];
  if (filters?.type) conditions.push(eq(aiResources.type, filters.type as any));
  if (filters?.lessonId) conditions.push(eq(aiResources.lessonId, filters.lessonId));
  if (filters?.classId) conditions.push(eq(aiResources.classId, filters.classId));
  return await db.select().from(aiResources).where(and(...conditions)).orderBy(desc(aiResources.createdAt));
}

export async function getAIResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiResources).where(eq(aiResources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const SERIAL_PREFIX = "NIBRAS";

/**
 * يولّد رقماً تسلسلياً فريداً بصيغة NIBRAS-YYYY-XXXXX.
 * السنة = سنة الإنشاء الفعلية، والأرقام الخمسة = insertId مُصفَّر إلى 5 خانات
 * (insertId عالمي متسلسل داخل TiDB لذلك لا يمكن أن يتكرر).
 */
export function generateSerialNumber(insertId: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${SERIAL_PREFIX}-${y}-${String(insertId).padStart(5, "0")}`;
}

export async function createAIResource(data: InsertAIResource) {
  const db = await getDb();
  if (!db) return undefined;
  // إزالة أي قيمة يدوية للرقم التسلسلي؛ يُولَّد تلقائياً لضمان التفرد
  const { serialNumber: _unused, ...rest } = data as InsertAIResource & { serialNumber?: string | null };
  const [result] = await db.insert(aiResources).values(rest as any);
  const insertId = result.insertId;
  const serialNumber = generateSerialNumber(insertId);
  await db.update(aiResources).set({ serialNumber } as any).where(eq(aiResources.id, insertId));
  return { id: insertId, serialNumber };
}

export async function updateAIResource(id: number, data: Partial<InsertAIResource>) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiResources).set(data as any).where(eq(aiResources.id, id));
}

export async function deleteAIResource(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiResources).where(eq(aiResources.id, id));
}

export async function duplicateAIResource(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const resource = await getAIResourceById(id);
  if (!resource) return undefined;
  const [result] = await db.insert(aiResources).values({
    userId,
    lessonId: resource.lessonId,
    classId: resource.classId,
    type: resource.type,
    title: `${resource.title} (نسخة)`,
    content: resource.content,
    metadata: resource.metadata,
    tags: resource.tags,
    sourceDocumentIds: resource.sourceDocumentIds,
  });
  const insertId = result.insertId;
  const serialNumber = generateSerialNumber(insertId);
  await db.update(aiResources).set({ serialNumber } as any).where(eq(aiResources.id, insertId));
  return { id: insertId, serialNumber };
}

// ─── Inspector Reviews ────────────────────────────────────────
export async function getInspectorReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inspectorReviews).where(eq(inspectorReviews.userId, userId)).orderBy(desc(inspectorReviews.createdAt));
}

export async function createInspectorReview(data: InsertInspectorReview) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(inspectorReviews).values(data);
  return { id: result.insertId };
}

export async function getInspectorReviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspectorReviews).where(eq(inspectorReviews.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Annual Plan Sections ─────────────────────────────────────
export async function getAnnualPlanSections(annualPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(annualPlanSections).where(eq(annualPlanSections.annualPlanId, annualPlanId)).orderBy(annualPlanSections.sectionNumber);
}

export async function getAnnualPlanSectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(annualPlanSections).where(eq(annualPlanSections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAnnualPlanSection(data: InsertAnnualPlanSection) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(annualPlanSections).values(data);
  return { id: result.insertId };
}

export async function updateAnnualPlanSection(id: number, data: Partial<InsertAnnualPlanSection>) {
  const db = await getDb();
  if (!db) return;
  await db.update(annualPlanSections).set(data as any).where(eq(annualPlanSections.id, id));
}

export async function deleteAnnualPlanSection(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(annualPlanSections).where(eq(annualPlanSections.id, id));
}

// ─── Learning Situations ──────────────────────────────────────
export async function getLearningSituations(sectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(learningSituations).where(eq(learningSituations.sectionId, sectionId)).orderBy(learningSituations.situationNumber);
}

export async function getLearningSituationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(learningSituations).where(eq(learningSituations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLearningSituationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(learningSituations).where(eq(learningSituations.userId, userId)).orderBy(desc(learningSituations.createdAt));
}

/** تُرجع فقط الوضعيات التشغيلية المعلّقة، لا بنية المخططات المرجعية للقراءة والنسخ. */
export async function getPendingOperationalLearningSituationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ situation: learningSituations })
    .from(learningSituations)
    .innerJoin(annualPlanSections, eq(learningSituations.sectionId, annualPlanSections.id))
    .innerJoin(annualPlans, eq(annualPlanSections.annualPlanId, annualPlans.id))
    .where(and(
      eq(learningSituations.userId, userId),
      eq(learningSituations.isCompleted, false),
      eq(annualPlans.isReference, false),
    ))
    .orderBy(desc(learningSituations.createdAt));
  return rows.map((row) => row.situation);
}

export async function createLearningSituation(data: InsertLearningSituation) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(learningSituations).values(data);
  return { id: result.insertId };
}

export async function updateLearningSituation(id: number, data: Partial<InsertLearningSituation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(learningSituations).set(data as any).where(eq(learningSituations.id, id));
}

export async function deleteLearningSituation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(learningSituations).where(eq(learningSituations.id, id));
}

export async function toggleLearningSituationCompleted(
  id: number,
  isCompleted: boolean,
  notes?: string | null,
  sessionStatus?: "completed" | "partial" | "postponed" | "cancelled" | null,
) {
  const db = await getDb();
  if (!db) return;
  const set: {
    isCompleted: boolean;
    completedDate: Date | null;
    completionNotes: string | null;
    sessionStatus?: "completed" | "partial" | "postponed" | "cancelled" | null;
  } = {
    isCompleted,
    completedDate: isCompleted ? new Date() : null,
    completionNotes: notes ?? null,
  };
  if (sessionStatus !== undefined) set.sessionStatus = sessionStatus;
  await db.update(learningSituations).set(set).where(eq(learningSituations.id, id));
}

// ─── Assessment Results ───────────────────────────────────────
export async function getAssessmentResults(userId: number, filters?: { classId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(assessmentResults.userId, userId)];
  if (filters?.classId) conditions.push(eq(assessmentResults.classId, filters.classId));
  return await db.select().from(assessmentResults).where(and(...conditions)).orderBy(desc(assessmentResults.createdAt));
}

export async function getAssessmentResultById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessmentResults).where(eq(assessmentResults.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAssessmentResult(data: InsertAssessmentResult) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(assessmentResults).values(data);
  return { id: result.insertId };
}

export async function updateAssessmentResult(id: number, data: Partial<InsertAssessmentResult>) {
  const db = await getDb();
  if (!db) return;
  await db.update(assessmentResults).set(data as any).where(eq(assessmentResults.id, id));
}

export async function deleteAssessmentResult(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(assessmentResults).where(eq(assessmentResults.id, id));
}

export async function getAIResourceBySerial(serialNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiResources).where(eq(aiResources.serialNumber, serialNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
// ─── Student Grades (نتائج التلاميذ من ملف الرقمنة) ─────────
export async function getStudentGradesByClass(userId: number, classId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(studentGrades).where(and(eq(studentGrades.userId, userId), eq(studentGrades.classId, classId))).orderBy(desc(studentGrades.computedAverage));
}

/**
 * ينشئ نسخة Excel احتياطية من نقاط قسم معيّن (أو كل نقاط الأستاذ) بصيغة متوافقة
 * مع بنية استيراد نبراس: ورقة لكل فوج (مادة/فصل) بنفس أعمدة وثيقة الرقمنة.
 * يعيد الملف كـ Buffer (بيانات ثنائية) واسم المقترح.
 */
export async function exportBackupExcel(userId: number, classId: number | null): Promise<{ filename: string; buffer: Buffer }> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const rows = await db
    .select()
    .from(studentGrades)
    .where(classId ? and(eq(studentGrades.userId, userId), eq(studentGrades.classId, classId)) : eq(studentGrades.userId, userId))
    .orderBy(desc(studentGrades.classId), asc(studentGrades.subject), asc(studentGrades.term), desc(studentGrades.computedAverage));
  if (rows.length === 0) throw new Error("لا توجد نقاط للتصدير");

  // تجميع حسب (مادة، فصل) مع الاحتفاظ برمز الفوج واسم القسم والسطر من جدول classes للمعاينة
  const groups = new Map<string, { subject: string; term: number; fogCode: string | null; rows: typeof rows }>;
  for (const r of rows) {
    const key = `${r.subject}|${r.term}`;
    const g = groups.get(key) ?? { subject: r.subject, term: r.term, fogCode: r.fogCode ?? null, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }

  const wb = XLSX.utils.book_new();
  for (const [, g] of Array.from(groups.entries()).sort((a, b) => a[1].term - b[1].term)) {
    const sheetName = `${g.subject}-${g.term}`.slice(0, 31);
    // ترويسة متوافقة مع محوّل الاستيراد: كل صف يمثّل تلميذًا بالأسهم المتطابقة
    const sheetRows = [
      ["التعريف", "الاسم واللقب", "النشاطات", "الفرض الكتابي", "التقويم التحصيلي (الاختبار الفصلي)"],
      ...g.rows.map((r) => [r.matricule, r.fullName, r.activityScore, r.examQuizScore, r.finalExamScore]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    // عرض أعمدة مريح
    ws["!cols"] = [{ wch: 14 }, { wch: 42 }, { wch: 10 }, { wch: 12 }, { wch: 13 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const className = rows[0]?.classId ? `القسم-${rows[0].classId}` : "كل-الأقسام";
  return { filename: `نسخة-احتياطية-نقاط-${className}-${new Date().toISOString().slice(0, 10)}.xlsx`, buffer: buf };
}
/**
 * التقويمات التحصيلية المولّدة من استوديو التقييم والمرشّحة لقسم/مستوى معيّن.
 * التقويم التحصيلي وثيقة موحّدة لكل المستوى: نعرض كل تقويمات النوع exam/quiz
 * لنفس المادة والمستوى (وإن لم تُربط بالقسم نفسه) ليقترح النظام ربطها بنتائج الرقمنة.
 */
export async function listGeneratedAssessments(userId: number, classId: number, subject: string, term: number) {
  const db = await getDb();
  if (!db) return [];
  const cls = await getClassById(classId);
  if (!cls) return [];
  const rows = await db
    .select({
      id: aiResources.id,
      title: aiResources.title,
      type: aiResources.type,
      classId: aiResources.classId,
      createdAt: aiResources.createdAt,
    })
    .from(aiResources)
    .where(
      and(
        eq(aiResources.userId, userId),
        eq(aiResources.subject as any, subject),
        or(eq(aiResources.type, "exam" as any), eq(aiResources.type, "quiz" as any)),
        eq(aiResources.gradeLevel as any, cls.gradeLevel),
      ),
    )
    .orderBy(desc(aiResources.createdAt));
  return rows;
}

export async function getStudentGradesFilters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: studentGrades.id,
      classId: studentGrades.classId,
      subject: studentGrades.subject,
      term: studentGrades.term,
      fogCode: studentGrades.fogCode,
      count: count(),
    })
    .from(studentGrades)
    .where(eq(studentGrades.userId, userId))
    .groupBy(studentGrades.classId, studentGrades.subject, studentGrades.term, studentGrades.fogCode);
  return rows;
}
export async function saveStudentGradesRows(data: InsertStudentGrade[]) {
  const db = await getDb();
  if (!db) return 0;
  await db.insert(studentGrades).values(data);
  return data.length;
}
export async function deleteStudentGradesForClass(userId: number, classId: number, subject: string, term: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(studentGrades).where(and(eq(studentGrades.userId, userId), eq(studentGrades.classId, classId), eq(studentGrades.subject, subject), eq(studentGrades.term, term)));
}
export async function deleteStudentGrade(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(studentGrades).where(and(eq(studentGrades.id, id), eq(studentGrades.userId, userId)));
}

// ─── Gradebook (دفتر التنقيط: التقويم المستمر / الفرض / التحصيلي) ─────────
/**
 * يدرج مجموعة إدخالات دفتر تنقيط (شبكة تلاميذ × معايير) بعد حراسة الملكية.
 */
export async function saveGradebookEntries(userId: number, entries: InsertGradebookEntry[]) {
  const db = await getDb();
  if (!db || entries.length === 0) return 0;
  await db.insert(gradebookEntries).values(entries);
  return entries.length;
}

/**
 * يحدّث إدخالًا أو ينشئه إن لم يوجد (upsert عبر الطالب والمادة والفصل).
 */
export async function upsertGradebookEntry(userId: number, entry: Omit<InsertGradebookEntry, "classId" | "term" | "subject" | "studentName"> & { classId: number; term: number; subject: string; studentName: string }) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db
    .select({ id: gradebookEntries.id })
    .from(gradebookEntries)
    .where(
      and(
        eq(gradebookEntries.userId, userId),
        eq(gradebookEntries.classId, entry.classId),
        eq(gradebookEntries.term, entry.term),
        eq(gradebookEntries.subject, entry.subject),
        eq(gradebookEntries.studentName, entry.studentName),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = entry as Record<string, unknown> & { id?: number };
    await db.update(gradebookEntries).set(payload).where(eq(gradebookEntries.id, existing[0].id));
    return { id: existing[0].id };
  }
  await db.insert(gradebookEntries).values(entry);
  const created = await db.select({ id: gradebookEntries.id }).from(gradebookEntries).where(and(eq(gradebookEntries.userId, userId), eq(gradebookEntries.classId, entry.classId), eq(gradebookEntries.term, entry.term), eq(gradebookEntries.subject, entry.subject), eq(gradebookEntries.studentName, entry.studentName))).limit(1);
  return created[0] ?? null;
}

/**
 * يحدّث إدخالات دفتر تنقيط متعددة بدفع واحد.
 */
export async function updateGradebookEntries(userId: number, entries: { id: number; data: Partial<InsertGradebookEntry> }[]) {
  const db = await getDb();
  if (!db || entries.length === 0) return 0;
  for (const { id, data } of entries) {
    await db.update(gradebookEntries).set(data).where(and(eq(gradebookEntries.id, id), eq(gradebookEntries.userId, userId)));
  }
  return entries.length;
}

/**
 * جميع إدخالات دفتر التنقيط لقسم معيّن (فصل دراسي ومادة)، مع إجمالي التقويم المستمر
 * المحسوب من معايير الانضباط والمشاركة والواجبات والنشاطات.
 */
export async function getGradebookByClass(userId: number, classId: number, term: number, subject: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(gradebookEntries)
    .where(
      and(
        eq(gradebookEntries.userId, userId),
        eq(gradebookEntries.classId, classId),
        eq(gradebookEntries.term, term),
        eq(gradebookEntries.subject, subject),
      ),
    )
    .orderBy(asc(gradebookEntries.studentName));
  return rows;
}

/**
 * الفصول الدراسية والمواد الموجودة في دفتر التنقيط للأستاذ (للمرشيحات).
 */
export async function getGradebookFilters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      classId: gradebookEntries.classId,
      subject: gradebookEntries.subject,
      term: gradebookEntries.term,
      count: count(),
    })
    .from(gradebookEntries)
    .where(eq(gradebookEntries.userId, userId))
    .groupBy(gradebookEntries.classId, sql`${gradebookEntries.subject}`, gradebookEntries.term);
}

/**
 * حساب التقويم المستمر /20 وفق الوثيقة الوزارية 2025-2026:
 * انضباط ومواظبة (/10) + إنجاز الأنشطة (/10). إذا كان continuousScore موجودًا يدويًا يُستخدم أولًا.
 */
export function sumContinuousScore(
  attendance: number | null | string,
  activities: number | null | string,
  manual: number | null | string,
): number | null {
  if (manual != null && manual !== "") {
    const m = Number(manual);
    if (!Number.isNaN(m)) return Math.round(m * 100) / 100;
  }
  const attendanceV = attendance == null || attendance === "" ? null : Number(attendance);
  const activitiesV = activities == null || activities === "" ? null : Number(activities);
  const parts = [attendanceV, activitiesV].filter((v): v is number => v != null && !Number.isNaN(v));
  if (parts.length === 0) return null;
  return Math.round((parts.reduce((a, b) => a + b, 0)) * 100) / 100;
}

/**
 * حذف إدخالات قسم/مادة/فصل دراسي كامل مع حماية الملكية.
 */
export async function deleteGradebookForClass(userId: number, classId: number, subject: string, term: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(gradebookEntries)
    .where(and(eq(gradebookEntries.userId, userId), eq(gradebookEntries.classId, classId), eq(gradebookEntries.subject, subject), eq(gradebookEntries.term, term)));
}

/**
 * حذف إدخال واحد مع حماية الملكية.
 */
export async function deleteGradebookEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gradebookEntries).where(and(eq(gradebookEntries.id, id), eq(gradebookEntries.userId, userId)));
}

export type MonthlySummaryRow = {
  studentName: string;
  studentMatricule: string | null;
  attendanceTotal: number | null; // مجموع خانات الانضباط/المواظبة المسجلة خلال الشهر
  activityTotal: number | null; // مجموع خانات إنجاز الأنشطة خلال الشهر
  continuousTotal: number | null; // التقويم المستمر المعتمد (آخر إدخال)
  quizTotal: number | null; // مجموع نقاط الفروض المسجلة خلال الشهر
  assessmentScore: number | null; // آخر نقطة اختبار مسجلة (تبقى من الفصل)
  notes: string | null;
  entryCount: number; // عدد الإدخالات خلال الشهر
};

/**
 * الاستيفائي الشهري: ملخص تقويم التلميذ خلال شهر معيّن.
 * يجمع خانات التقويم المستمر والفرض المحفوظة خلال الشهر ويميّز التلميذ الواحد
 * (آخر إدخال هو المعتمد للتقويم المستمر والاختبار)، وهو ما يُعبّأ في خانة
 * «الاستيفائي الشهري» من دفتر التنقيط الرسمي.
 */
export async function monthlySummary(
  userId: number,
  classId: number,
  term: number,
  subject: string,
  monthKey: string,
): Promise<MonthlySummaryRow[]> {
  const db = await getDb();
  if (!db) return [];
  const [yearStr, monthStr] = monthKey.split("-");
  const start = new Date(`${yearStr}-${monthStr}-01T00:00:00`);
  const nextMonth = monthStr === "12" ? `${Number(yearStr) + 1}-01` : `${yearStr}-${String(Number(monthStr) + 1).padStart(2, "0")}`;
  const end = new Date(`${nextMonth}-01T00:00:00`);
  const rows = await db
    .select()
    .from(gradebookEntries)
    .where(
      and(
        eq(gradebookEntries.userId, userId),
        eq(gradebookEntries.classId, classId),
        eq(gradebookEntries.term, term),
        eq(gradebookEntries.subject, subject),
        gte(gradebookEntries.createdAt, start),
        lt(gradebookEntries.createdAt, end),
      ),
    )
    .orderBy(asc(gradebookEntries.studentName), desc(gradebookEntries.createdAt));

  const byStudent = new Map<string, MonthlySummaryRow>();
  for (const row of rows) {
    const key = row.studentName;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        studentName: row.studentName,
        studentMatricule: row.studentMatricule ?? null,
        attendanceTotal: 0,
        activityTotal: 0,
        continuousTotal: row.continuousScore ?? null,
        quizTotal: 0,
        assessmentScore: row.assessmentScore ?? null,
        notes: row.notes ?? null,
        entryCount: 0,
      });
    }
    const agg = byStudent.get(key)!;
    if (row.attendanceScore != null) {
      agg.attendanceTotal = (agg.attendanceTotal ?? 0) + row.attendanceScore;
      if (agg.attendanceTotal != null) agg.attendanceTotal = Math.round(agg.attendanceTotal * 100) / 100;
    }
    if (row.activityScore != null) {
      agg.activityTotal = (agg.activityTotal ?? 0) + row.activityScore;
      if (agg.activityTotal != null) agg.activityTotal = Math.round(agg.activityTotal * 100) / 100;
    }
    if (row.quizScore != null) {
      agg.quizTotal = (agg.quizTotal ?? 0) + row.quizScore;
      if (agg.quizTotal != null) agg.quizTotal = Math.round(agg.quizTotal * 100) / 100;
    }
    agg.entryCount += 1;
  }
  return Array.from(byStudent.values());
}

// ─── Excel Import (استيراد الأقسام والجدول) ───────────────────
/**
 * يحلّل مضمون ملف Excel الخام (أقسام + جدول خدمة) ويعيد صفوف مقترحة
 * جاهزة للعرض قبل الحفظ. لا يمسّ قاعدة البيانات إطلاقًا.
 *
 * تنسيق الملف:
 *  - ورقة «الأقسام»: الاسم | المستوى | الشعب | المادة | عدد التلاميذ
 *  - ورقة «الجدول»: القسم | اليوم | الحصة | المادة | من | إلى
 */
export function parseImportExcelWorkbook(buffer: Buffer) {
  // ملف Excel (.xlsx) هو أرشيف ZIP؛ الملفات النصية أو التالفة تعطي نتائج مضللة عند تمريرها دون حراسة.
  if (buffer.length < 4 || !(buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)) {
    throw new Error("الملف ليس أرشيف Excel (.xlsx) صالحاً.");
  }
  const workbook = XLSX.read(buffer, { type: "buffer", cellStyles: false });

  const sheetNames = workbook.SheetNames.map((name) => name.trim());
  const classesSheet = workbook.Sheets[sheetNames.find((name) => name.startsWith("الأقسام") || name.toLowerCase() === "classes") || sheetNames[0]];
  const scheduleSheet = workbook.Sheets[sheetNames.find((name) => name.startsWith("الجدول") || name.toLowerCase() === "schedule") || sheetNames[1] || sheetNames[0]];

  const classRows = XLSX.utils.sheet_to_json<string[]>(classesSheet, { header: 1, blankrows: false }) as string[][];
  const scheduleRows = XLSX.utils.sheet_to_json<string[]>(scheduleSheet, { header: 1, blankrows: false }) as string[][];

  const normalize = (value: unknown) => String(value ?? "").trim();
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;
  const SUBJECTS = ["التاريخ", "الجغرافيا", "التربية المدنية"] as const;
  const GRADE_LEVELS = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"] as const;
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  const issues: string[] = [];
  const parsedClasses: { name: string; gradeLevel: (typeof GRADE_LEVELS)[number] | null; subject: string; studentCount: number | null }[] = [];
  for (const row of classRows.slice(1)) {
    if (!row || row.length === 0) continue;
    const [rawName, rawGrade, , rawSubject, rawCount] = row as unknown[];
    const name = normalize(rawName);
    if (!name) continue;
    const gradeText = normalize(rawGrade);
    const gradeLevel = (GRADE_LEVELS.find((level) => gradeText.includes(level.slice(0, 6))) || null);
    const subject = normalize(rawSubject);
    const studentText = normalize(rawCount);
    const studentCount = /^\d+$/.test(studentText) ? Number(studentText) : null;
    if (!gradeLevel) issues.push(`القسم «${name}»: المستوى «${gradeText}» غير مفهوم.`);
    parsedClasses.push({ name, gradeLevel, subject, studentCount });
  }

  const parsedSchedule: { className: string; dayOfWeek: (typeof DAYS)[number] | null; periodIndex: number | null; subject: (typeof SUBJECTS)[number] | null; startTime: string | null; endTime: string | null }[] = [];
  for (const row of scheduleRows.slice(1)) {
    if (!row || row.length === 0) continue;
    const [rawClass, rawDay, rawPeriod, rawSubject, rawStart, rawEnd] = row as unknown[];
    const className = normalize(rawClass);
    if (!className) continue;
    const dayText = normalize(rawDay);
    const dayOfWeek = DAYS.find((day) => dayText.startsWith(day)) || null;
    const periodText = normalize(rawPeriod);
    const periodIndex = /^\d+$/.test(periodText) ? Math.min(7, Math.max(1, Number(periodText))) : null;
    const subjectText = normalize(rawSubject);
    const subject = SUBJECTS.find((subject) => subjectText.startsWith(subject)) || null;
    const startTime = TIME_RE.test(normalize(rawStart)) ? normalize(rawStart) : null;
    const endTime = TIME_RE.test(normalize(rawEnd)) ? normalize(rawEnd) : null;
    if (!dayOfWeek) issues.push(`صف الجدول «${className}»: اليوم «${dayText}» غير مفهوم.`);
    if (!periodIndex) issues.push(`صف الجدول «${className}»: رقم الحصة «${periodText}» غير مفهوم (1–7).`);
    if (!subject) issues.push(`صف الجدول «${className}»: المادة «${subjectText}» غير مفهومة.`);
    if (!startTime || !endTime) issues.push(`صف الجدول «${className}»: التوقيت «${normalize(rawStart)}–${normalize(rawEnd)}» غير صالح.`);
    parsedSchedule.push({ className, dayOfWeek, periodIndex, subject, startTime, endTime });
  }

  return { classes: parsedClasses, schedule: parsedSchedule, issues };
}

/**
 * تحليل وثيقة حجز النقاط الرسمية (الرقمنة) — xlsx من منصة صبّ النقاط.
 * البنية الرسمية: كل ورقة = فوج × مادة؛ الصف 5 يحمل نص الوصف
 * (الفصل والسنة والفوج التربوي والمادة)، والصف 8 يحمل أسماء الأعمدة
 * العربية، ويليها صفوف التلاميذ (رقم التعريف، اللقب، الاسم، تاريخ الميلاد،
 * معدل تقويم النشاطات، الفرض، الاختبار).
 */
export function parseRakmnaExcelWorkbook(buffer: Buffer) {
  if (buffer.length < 4 || !(buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)) {
    throw new Error("الملف ليس أرشيف Excel (.xlsx) صالحاً.");
  }
  const workbook = XLSX.read(buffer, { type: "buffer", cellStyles: false });
  const normalize = (value: unknown) => String(value ?? "").trim();

  const TERM_RE = /الفصل\s*(الأول|الثاني|الثالث|الرابع)/;
  const YEAR_RE = /(\d{4})\s*[\-–—]\s*(\d{2,4})/;
  const FOG_RE = /الفوج\s*التربوي\s*:\s*(.+?)(?=مادة|$)/;
  const SUBJECT_MAP: Record<string, string> = {
    "التربية المدنية": "التربية المدنية",
    "التاريخ والجغرافيا": "التاريخ والجغرافيا",
    "التاريخ": "التاريخ",
    "الجغرافيا": "الجغرافيا",
  };

  const parsedSheets: {
    sheetName: string;
    fogCode: string;
    term: number | null;
    academicYear: string | null;
    fogLabel: string | null;
    gradeLevel: string | null;
    fogName: string | null;
    subject: string | null;
    students: {
      matricule: string;
      fullName: string;
      birthDate: string | null;
      activityScore: number | null;
      examQuizScore: number | null;
      finalExamScore: number | null;
    }[];
    rowErrors: string[];
  }[] = [];
  const issues: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false }) as unknown[][];
    if (rows.length < 2) continue;

    // الترويسة الرسمية (صف 5 في الملف الخام) قد تتحول مواقعها عند حذف الصفوف الفارغة؛
    // نبحث عنها في أول 12 صفًا بدلًا من موقع ثابت.
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 12); i++) {
      const cellText = String(rows[i]?.[0] ?? "");
      if (cellText.includes("حجز النقاط") || cellText.includes("النقاط")) {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex < 0) {
      issues.push(`الورقة «${sheetName}»: ليست وثيقة حجز نقاط (لا تحتوي ترويسة «حجز النقاط»).`);
      continue;
    }
    const row5 = String(rows[headerRowIndex]?.[0] ?? "");

    const termMatch = row5.match(TERM_RE);
    const term = termMatch
      ? termMatch[1] === "الأول" ? 1 : termMatch[1] === "الثاني" ? 2 : termMatch[1] === "الثالث" ? 3 : 4
      : null;
    const yearMatch = row5.match(YEAR_RE);
    const academicYear = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}` : null;
    const fogMatch = row5.match(FOG_RE);
    const fogLabel = fogMatch ? normalize(fogMatch[1]) : null;
    const subjectMatch = /مادة\s*:\s*(.+)/.exec(row5);
    const rawSubject = subjectMatch ? normalize(subjectMatch[1]) : "";
    const subject = SUBJECT_MAP[rawSubject] ?? (rawSubject ? null : null);
    if (rawSubject && !subject) issues.push(`الورقة «${sheetName}»: المادة «${rawSubject}» غير مفهومة.`);

    // استخراج المستوى والرقم من بطاقة الفوج: «ثانية  متوسط    4»
    let gradeLevel: string | null = null;
    let fogName: string | null = null;
    if (fogLabel) {
      // ترتيب البدائل مهم: «الثالثة» قبل «الثانية» و«الرابعة» قبل «الرابعة/الثانية».
      // وثيقة حجز النقاط تكتب الفوج أحيانًا «ثانية  متوسط    3» (بلا لام التعريف)
      // وأحيانًا «الأولى متوسط»، لذا نجعل «الـ» التعريفية اختيارية.
      const levelMatch = fogLabel.match(/(ال)?(أولى|ثانية|ثالثة|رابعة)\s+متوسط/) ?? fogLabel.match(/(ال)?(أولى|ثانية|ثالثة|رابعة)متوسط/);
      if (levelMatch) {
        gradeLevel = `السنة ${levelMatch[1] ?? ""}${levelMatch[2]} متوسط`;
      }
      fogName = fogLabel.replace(/متوسط.*$/, "").trim();
    }

    // البحث عن صف أسماء الأعمدة العربية (بعد ترويسة الحجز)
    let headerRowIdx = -1;
    for (let i = headerRowIndex + 1; i < Math.min(rows.length, headerRowIndex + 10); i++) {
      const rowText = (rows[i] ?? []).map(normalize).join(" ");
      if (rowText.includes("رقم التعريف") && (rowText.includes("النشاطات") || rowText.includes("الفرض"))) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx < 0) {
      issues.push(`الورقة «${sheetName}»: لم يُعثر على صف أسماء الأعمدة (رقم التعريف/النشاطات/الفرض/الاختبار).`);
      continue;
    }

    const students: NonNullable<(typeof parsedSheets)[number]["students"]> = [];
    const rowErrors: string[] = [];
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length === 0) continue;
      const matricule = normalize(row[0]);
      if (!/^\d{10,20}$/.test(matricule)) continue;
      const lastName = normalize(row[1]);
      const firstName = normalize(row[2]);
      if (!lastName || !firstName) {
        rowErrors.push(`الصف ${i + 1}: اللقب/الاسم ناقص.`);
        continue;
      }
      const clamp = (raw: unknown): number | null => {
        const v = Number(raw);
        return Number.isFinite(v) ? Math.min(20, Math.max(0, v)) : null;
      };
      students.push({
        matricule,
        fullName: `${lastName} ${firstName}`,
        birthDate: normalize(row[3]) || null,
        activityScore: clamp(row[4]),
        examQuizScore: clamp(row[5]),
        finalExamScore: clamp(row[6]),
      });
    }
    if (students.length === 0) {
      rowErrors.push(`الورقة «${sheetName}»: لا صفوف تلاميذ صالحة.`);
    }
    if (rowErrors.length) issues.push(...rowErrors.map((e) => `الورقة «${sheetName}»: ${e}`));

    parsedSheets.push({
      sheetName,
      fogCode: sheetName.trim(),
      term,
      academicYear,
      fogLabel,
      gradeLevel,
      fogName,
      subject,
      students,
      rowErrors,
    });
  }
  return { sheets: parsedSheets, issues };
}

/**
 * حساب المعدل الفصلي وفق المعادلة الرسمية للرقمنة في التعليم المتوسط:
 * المعدل = (معدل النشاطات + الفرض×1 + الاختبار×3) / 5
 */
export function computeTermAverage(activity: number | null, quiz: number | null, exam: number | null): number | null {
  if (quiz == null || exam == null) return null;
  const activityPart = activity ?? 0;
  const avg = (activityPart + quiz + exam * 3) / 5;
  return Math.round(avg * 100) / 100;
}

/**
 * التقدير اللفظي الرسمي المقابل للمعدل (نفس مقاييس الرقمنة).
 */
export function termAverageEvaluation(avg: number): string {
  if (avg >= 16) return "ممتاز";
  if (avg >= 14) return "جيد جداً";
  if (avg >= 12) return "جيد";
  if (avg >= 10) return "متوسط";
  if (avg >= 7) return "ضعيف";
  return "ضعيف جداً";
}

/**
 * يعيد ملء التقدير اللفظي الرسمي (officialEvaluation) لجميع نقاط القسم
 * وفق مقاييس الرقمنة، ويحدّث المواقف (position) بترتيب تنازلي حسب المعدل.
 */
export async function recomputeClassGradesEvaluation(userId: number, classId: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db
    .select()
    .from(studentGrades)
    .where(and(eq(studentGrades.userId, userId), eq(studentGrades.classId, classId)))
    .orderBy(desc(studentGrades.computedAverage), asc(studentGrades.fullName));
  let position = 0;
  for (const row of rows) {
    if (row.computedAverage == null) continue;
    position += 1;
    await db
      .update(studentGrades)
      .set({
        officialEvaluation: termAverageEvaluation(row.computedAverage),
        position,
      })
      .where(eq(studentGrades.id, row.id));
  }
}

/**
 * تحليل إحصائي لنقاط تلاميذ قسم (وفق مقاييس الرقمنة): المتوسط العام، أعلى/أدنى،
 * عدد الناجحين والراسبين، توزع التقديرات، ومتوسط كل محصلة.
 */
export async function getStudentGradesAnalytics(userId: number, classId: number, subject: string | null, term: number | null) {
  const db = await getDb();
  if (!db) return null;
  const filters = [eq(studentGrades.userId, userId), eq(studentGrades.classId, classId)];
  if (subject) filters.push(eq(studentGrades.subject, subject));
  if (term) filters.push(eq(studentGrades.term, term));
  const rows = await db
    .select()
    .from(studentGrades)
    .where(and(...filters))
    .orderBy(desc(studentGrades.computedAverage));
  if (rows.length === 0) return null;
  const withAverage = rows.filter((r) => r.computedAverage != null);
  const sums = { average: 0, activity: 0, quiz: 0, exam: 0 };
  let maxRow = withAverage[0];
  let minRow = withAverage[0];
  for (const r of withAverage) {
    sums.average += r.computedAverage!;
    sums.activity += r.activityScore ?? 0;
    sums.quiz += r.examQuizScore ?? 0;
    sums.exam += r.finalExamScore ?? 0;
    if (maxRow && r.computedAverage! > maxRow.computedAverage!) maxRow = r;
    if (minRow && r.computedAverage! < minRow.computedAverage!) minRow = r;
  }
  const n = withAverage.length;
  const classAverage = Math.round((sums.average / n) * 100) / 100;
  const distribution: Record<string, number> = {
    "ممتاز": 0,
    "جيد جداً": 0,
    "جيد": 0,
    "متوسط": 0,
    "ضعيف": 0,
    "ضعيف جداً": 0,
  };
  let weakCount = 0;
  const weakStudents: {
    id: number;
    fullName: string;
    matricule: string;
    computedAverage: number;
    subject: string;
    term: number;
    /** نوع الضعف المرصود: اختبار / تقويم مستمر / عام */
    weaknessType: "exam" | "continuous" | "general";
    /** توصية علاج تربوي مبنية على نوع الضعف وفق المنهاج الجزائري */
    recommendation: string;
  }[] = [];
  for (const r of withAverage) {
    const ev = termAverageEvaluation(r.computedAverage!);
    if (distribution[ev] != null) distribution[ev] += 1;
    if (r.computedAverage! < 10) {
      weakCount += 1;
      const examPart = r.finalExamScore ?? 0;
      const continuousPart = (r.activityScore ?? 0) + (r.examQuizScore ?? 0);
      // نصيب الاختبار من المعدل: الاختبار ×3 في البسط من مجموع ×5
      const examShare = r.finalExamScore != null ? (examPart * 3) / (r.computedAverage! * 5) : null;
      let weaknessType: "exam" | "continuous" | "general";
      let recommendation: string;
      if (examShare != null && examShare < 1.5) {
        weaknessType = "exam";
        recommendation =
          "الضعف مركّز في التقويم التحصيلي (الاختبار الفصلي). أعد معه الوضعيات التعليمية المنجزة ودرّبه على نمط وثيقة التقويم التحصيلي الموحّدة للمستوى (الإجابة عن الأسئلة المركبة والوضعية الإدماجية) قبل حصة الاستدراك.";
      } else if (r.finalExamScore == null && continuousPart < 8) {
        weaknessType = "continuous";
        recommendation =
          "التقويم المستمر منخفض. أشركه في الأنشطة الصفية، وأسند إليه واجبات متابعة أسبوعية، وارصد حضوره ومشاركته بانتظام في دفتر التنقيط.";
      } else if (examShare != null && examShare >= 2.4) {
        weaknessType = "continuous";
        recommendation =
          "نقطة التقويم التحصيلي مقبولة لكن التقويم المستمر يخفض المعدل. تابع مشاركته الصّفية وأنشطته اليومية وسجّلها بانتظام في دفتر التنقيط.";
      } else {
        weaknessType = "general";
        recommendation =
          "الضعف عام عبر المحصلات (التقويم المستمر والتقويم التحصيلي). أدرجه في مجموعة الاستدراك، وأعد معه أساسيات الوضعيات غير المتقنة مع أنشطة تعويضية مبسطة وفق منهاج المادة.";
      }
      weakStudents.push({
        id: r.id,
        fullName: r.fullName,
        matricule: r.matricule,
        computedAverage: r.computedAverage!,
        subject: r.subject,
        term: r.term,
        weaknessType,
        recommendation,
      });
    }
  }
  return {
    studentCount: rows.length,
    gradedCount: n,
    classAverage,
    averageActivity: Math.round((sums.activity / n) * 100) / 100,
    averageQuiz: Math.round((sums.quiz / n) * 100) / 100,
    averageExam: Math.round((sums.exam / n) * 100) / 100,
    topStudent: maxRow ? { fullName: maxRow.fullName, computedAverage: maxRow.computedAverage, matricule: maxRow.matricule } : null,
    lowestStudent: minRow ? { fullName: minRow.fullName, computedAverage: minRow.computedAverage, matricule: minRow.matricule } : null,
    distribution,
    weakCount,
    weakStudents,
  };
}
