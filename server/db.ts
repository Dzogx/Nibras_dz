import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertTeacherProfile, teacherProfiles,
  InsertAcademicYear, academicYears,
  InsertCurriculumDocument, curriculumDocuments,
  InsertClass, classes,
  InsertWeeklyScheduleEntry, weeklyScheduleEntries,
  InsertAnnualPlan, annualPlans,
  InsertLesson, lessons,
  InsertTeachingNote, teachingNotes,
  InsertAIResource, aiResources,
  InsertInspectorReview, inspectorReviews,
  curriculumSearchIndex,
  annualPlanSections,
  learningSituations,
  assessmentResults,
  InsertAnnualPlanSection,
  InsertLearningSituation,
  InsertAssessmentResult,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

// ─── Annual Plans ─────────────────────────────────────────────
export async function getAnnualPlans(userId: number, filters?: { academicYear?: string; subject?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(annualPlans.userId, userId)];
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

export async function toggleLearningSituationCompleted(id: number, isCompleted: boolean, notes?: string | null) {
  const db = await getDb();
  if (!db) return;
  const set: { isCompleted: boolean; completedDate: Date | null; completionNotes: string | null } = {
    isCompleted,
    completedDate: isCompleted ? new Date() : null,
    completionNotes: notes ?? null,
  };
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
