import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint, boolean, double, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Teacher profiles with academic settings
 */
export const teacherProfiles = mysqlTable("teacherProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  subject: mysqlEnum("subject", [
    "الجغرافيا",
    "التاريخ والجغرافيا",
    "التربية المدنية",
    "التاريخ والجغرافيا والتربية المدنية",
  ]).default("التاريخ والجغرافيا").notNull(),
  academicYear: varchar("academicYear", { length: 16 }),
  school: varchar("school", { length: 256 }),
  province: varchar("province", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = typeof teacherProfiles.$inferInsert;

/**
 * Academic years
 */
export const academicYears = mysqlTable("academicYears", {
  id: int("id").autoincrement().primaryKey(),
  year: varchar("year", { length: 16 }).notNull().unique(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = typeof academicYears.$inferInsert;

/**
 * Curriculum documents (official documents)
 */
export const curriculumDocuments = mysqlTable("curriculumDocuments", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  type: mysqlEnum("type", [
    "document",
    "annualPlan",
    "competency",
    "unit",
    "lesson",
  ]).notNull(),
  subject: mysqlEnum("subject", [
    "الجغرافيا",
    "التاريخ والجغرافيا",
    "التربية المدنية",
    "التاريخ والجغرافيا والتربية المدنية",
  ]).notNull(),
  gradeLevel: mysqlEnum("gradeLevel", [
    "السنة الأولى متوسط",
    "السنة الثانية متوسط",
    "السنة الثالثة متوسط",
    "السنة الرابعة متوسط",
  ]).notNull(),
  content: text("content").notNull(),
  academicYear: varchar("academicYear", { length: 16 }),
  unitNumber: int("unitNumber"),
  lessonNumber: int("lessonNumber"),
  tags: json("tags"),
  sourceReference: varchar("sourceReference", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CurriculumDocument = typeof curriculumDocuments.$inferSelect;
export type InsertCurriculumDocument = typeof curriculumDocuments.$inferInsert;

/**
 * Classes (فصول)
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  gradeLevel: mysqlEnum("gradeLevel", [
    "السنة الأولى متوسط",
    "السنة الثانية متوسط",
    "السنة الثالثة متوسط",
    "السنة الرابعة متوسط",
  ]).notNull(),
  section: varchar("section", { length: 64 }),
  subject: varchar("subject", { length: 128 }),
  academicYear: varchar("academicYear", { length: 16 }),
  studentCount: int("studentCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Weekly teaching schedule (جدول خدمة الأستاذ)
 * يُحفظ لكل موسم دراسي ويغذي خطة اليوم تلقائياً.
 */
export const weeklyScheduleEntries = mysqlTable("weeklyScheduleEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  academicYear: varchar("academicYear", { length: 16 }).notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]).notNull(),
  periodIndex: int("periodIndex").notNull(),
  subject: varchar("subject", { length: 32 }).notNull().default("التاريخ"),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  room: varchar("room", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyScheduleEntry = typeof weeklyScheduleEntries.$inferSelect;
export type InsertWeeklyScheduleEntry = typeof weeklyScheduleEntries.$inferInsert;

/**
 * One-off make-up sessions (حصص تعويضية) — لا تعدّل جدول الخدمة الأسبوعي الأصلي.
 */
export const compensatorySessions = mysqlTable("compensatorySessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  situationId: int("situationId").notNull(),
  academicYear: varchar("academicYear", { length: 16 }).notNull(),
  subject: varchar("subject", { length: 32 }).notNull(),
  scheduledDate: varchar("scheduledDate", { length: 10 }).notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]).notNull(),
  periodIndex: int("periodIndex").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  sourceStatus: mysqlEnum("sourceStatus", ["postponed", "cancelled"]).notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompensatorySession = typeof compensatorySessions.$inferSelect;
export type InsertCompensatorySession = typeof compensatorySessions.$inferInsert;

/**
 * Annual plans (الخطط السنوية)
 */
export const annualPlans = mysqlTable("annualPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId"),
  subject: varchar("subject", { length: 128 }).notNull(),
  gradeLevel: varchar("gradeLevel", { length: 128 }).notNull(),
  academicYear: varchar("academicYear", { length: 16 }).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content"),
  isReference: boolean("isReference").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnnualPlan = typeof annualPlans.$inferSelect;
export type InsertAnnualPlan = typeof annualPlans.$inferInsert;

/**
 * Lessons (الدروس)
 */
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId"),
  title: varchar("title", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 128 }),
  gradeLevel: varchar("gradeLevel", { length: 128 }),
  unitTitle: varchar("unitTitle", { length: 256 }),
  unitNumber: int("unitNumber"),
  lessonNumber: int("lessonNumber"),
  content: text("content"),
  plan: text("plan"),
  objectives: text("objectives"),
  duration: varchar("duration", { length: 64 }),
  date: timestamp("date"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  tags: json("tags"),
  curriculumReferences: json("curriculumReferences"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

/**
 * Teaching notes (ملاحظات التدريس)
 */
export const teachingNotes = mysqlTable("teachingNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId"),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  noteType: mysqlEnum("noteType", [
    "ملاحظة عامة",
    "ملاحظة صفية",
    "ملاحظة تقويمية",
    "ملاحظة تربوية",
  ]).default("ملاحظة عامة").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeachingNote = typeof teachingNotes.$inferSelect;
export type InsertTeachingNote = typeof teachingNotes.$inferInsert;

/**
 * AI-generated resources (مكتبة المحتوى)
 */
export const aiResources = mysqlTable("aiResources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId"),
  classId: int("classId"),
  type: mysqlEnum("type", [
    "lessonPlan",
    "activity",
    "homework",
    "classQuestions",
    "differentiation",
    "quiz",
    "exam",
    "rubric",
    "answerKey",
    "inspectorReview",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  tags: json("tags"),
  sourceDocumentIds: json("sourceDocumentIds"),
  serialNumber: varchar("serialNumber", { length: 32 }),
  answerRevealAt: bigint("answerRevealAt", { mode: "number" }),
  examEndsAt: bigint("examEndsAt", { mode: "number" }),
  // فهرسة فوترسبية للمادة والمستوى — ضرورية لاقتراح التقويمات التحصيلية الموحدة
  // للمستوى (استوديو التقييم ← نتائج التلاميذ / دفتر التنقيط)
  subject: varchar("subject", { length: 128 }),
  gradeLevel: varchar("gradeLevel", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIResource = typeof aiResources.$inferSelect;
export type InsertAIResource = typeof aiResources.$inferInsert;

/**
 * Inspector reviews (وضع المفتش)
 */
export const inspectorReviews = mysqlTable("inspectorReviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resourceId: int("resourceId").notNull(),
  resourceType: mysqlEnum("resourceType", [
    "lesson",
    "assessment",
  ]).notNull(),
  evaluation: text("evaluation").notNull(),
  criteria: json("criteria"),
  overallScore: int("overallScore"),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectorReview = typeof inspectorReviews.$inferSelect;
export type InsertInspectorReview = typeof inspectorReviews.$inferInsert;

/**
 * Annual plan sections (المقاطع) — structured units within an annual plan
 */
export const annualPlanSections = mysqlTable("annualPlanSections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  annualPlanId: int("annualPlanId").notNull(),
  sectionNumber: int("sectionNumber").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  duration: varchar("duration", { length: 64 }),
  competencies: text("competencies"),
  objectives: text("objectives"),
  resources: text("resources"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnnualPlanSection = typeof annualPlanSections.$inferSelect;
export type InsertAnnualPlanSection = typeof annualPlanSections.$inferInsert;

/**
 * Learning situations (الوضعيات التعليمية) — specific situations within sections
 */
export const learningSituations = mysqlTable("learningSituations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sectionId: int("sectionId").notNull(),
  situationNumber: int("situationNumber").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  objectives: text("objectives"),
  content: text("content"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedDate: timestamp("completedDate"),
  completionNotes: text("completionNotes"),
  sessionStatus: mysqlEnum("sessionStatus", ["completed", "partial", "postponed", "cancelled"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LearningSituation = typeof learningSituations.$inferSelect;
export type InsertLearningSituation = typeof learningSituations.$inferInsert;

/**
 * Aggregate assessment results (نتائج مجمعة) — per-class per-assessment
 */
export const assessmentResults = mysqlTable("assessmentResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  resourceId: int("resourceId"),
  title: varchar("title", { length: 256 }).notNull(),
  date: timestamp("date"),
  totalStudents: int("totalStudents").notNull(),
  participatedStudents: int("participatedStudents"),
  averageScore: double("averageScore"),
  passedCount: int("passedCount"),
  historyAverage: double("historyAverage"),
  geographyAverage: double("geographyAverage"),
  domainScores: json("domainScores"),
  competencyMastery: json("competencyMastery"),
  weakAreas: text("weakAreas"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;

/**
 * Student grades (نتائج التلاميذ الفرديّة)
 * تُستورد من وثيقة حجز النقاط في الرقمنة (xlsx):
 * لكل فصل/قسم/مادة: التلاميذ بنقاط النشاطات والفرض والاختبار.
 */
export const studentGrades = mysqlTable("studentGrades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  subject: varchar("subject", { length: 64 }).notNull(),
  term: int("term").notNull(),
  fogCode: varchar("fogCode", { length: 32 }),
  matricule: varchar("matricule", { length: 32 }).notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  birthDate: varchar("birthDate", { length: 16 }),
  activityScore: double("activityScore"),
  examQuizScore: double("examQuizScore"),
  finalExamScore: double("finalExamScore"),
  computedAverage: double("computedAverage"),
  officialEvaluation: varchar("officialEvaluation", { length: 64 }),
  position: int("position"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentGrade = typeof studentGrades.$inferSelect;
export type InsertStudentGrade = typeof studentGrades.$inferInsert;

/**
 * Curriculum search index (for fast search)
 */
export const curriculumSearchIndex = mysqlTable("curriculumSearchIndex", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  searchText: text("searchText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CurriculumSearchIndex = typeof curriculumSearchIndex.$inferSelect;
export type InsertCurriculumSearchIndex = typeof curriculumSearchIndex.$inferInsert;

/**
 * دفتر التنقيط (Gradebook) — التقويم المستمر والفرض والتقويم التحصيلي
 * لكل تلميذ في كل فصل وفصل دراسي، مع مصدر النقطة (يدوي / استيراد رقمنة / استوديو التقويم).
 */
export const gradebookEntries = mysqlTable("gradebookEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  studentMatricule: varchar("studentMatricule", { length: 64 }),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  term: int("term").notNull().default(0),
  subject: varchar("subject", { length: 100 }).notNull().default("التاريخ والجغرافيا"),
  dateScored: date("dateScored"),
  // معايير التقويم المستمر وفق الوثيقة الوزارية 2025-2026 (من /20)
  attendanceScore: double("attendanceScore"), // الانضباط والمواظبة /10 (الحضور، السلوك، الأدوات)
  activityScore: double("activityScore"), // إنجاز الأنشطة /10 (استجوابات، واجبات، مشاريع)
  // التقويم المستمر /20 = انضباط/10 + أنشطة/10 (تُحسب تلقائيًا في الواجهة)
  continuousScore: double("continuousScore"),
  quizScore: double("quizScore"), // الفرض الكتابي /20
  assessmentScore: double("assessmentScore"), // الاختبار الفصلي /20
  assessmentResultId: int("assessmentResultId"),
  source: varchar("source", { length: 50 }).notNull().default("manual"),
  notes: text("notes"), // التقييم النوعي لدفتر المراسلة
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GradebookEntry = typeof gradebookEntries.$inferSelect;
export type InsertGradebookEntry = typeof gradebookEntries.$inferInsert;

// قائمة تلاميذ القسم في دفتر التنقيط (روستر مستقل عن المادة والفصل):
// تُصبّ الأسماء تلقائيًا عند استيراد ملف الرقمنة ليبدأ الأستاذ التنقيط فورًا.
export const gradebookRoster = mysqlTable("gradebookRoster", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  classId: int("classId").notNull(),
  matricule: varchar("matricule", { length: 64 }),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GradebookRosterRow = typeof gradebookRoster.$inferSelect;
export type InsertGradebookRosterRow = typeof gradebookRoster.$inferInsert;
