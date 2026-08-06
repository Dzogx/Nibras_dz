CREATE TABLE `academicYears` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` varchar(16) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academicYears_id` PRIMARY KEY(`id`),
	CONSTRAINT `academicYears_year_unique` UNIQUE(`year`)
);
--> statement-breakpoint
CREATE TABLE `aiResources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int,
	`classId` int,
	`type` enum('lessonPlan','activity','homework','classQuestions','differentiation','quiz','exam','rubric','answerKey','inspectorReview') NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`tags` json,
	`sourceDocumentIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiResources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `annualPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int,
	`subject` varchar(128) NOT NULL,
	`gradeLevel` varchar(128) NOT NULL,
	`academicYear` varchar(16) NOT NULL,
	`title` varchar(256),
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annualPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`gradeLevel` enum('السنة الأولى متوسط','السنة الثانية متوسط','السنة الثالثة متوسط','السنة الرابعة متوسط') NOT NULL,
	`section` varchar(64),
	`subject` varchar(128),
	`academicYear` varchar(16),
	`studentCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curriculumDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`type` enum('document','annualPlan','competency','unit','lesson') NOT NULL,
	`subject` enum('التاريخ والجغرافيا','التربية المدنية','التاريخ والجغرافيا والتربية المدنية') NOT NULL,
	`gradeLevel` enum('السنة الأولى متوسط','السنة الثانية متوسط','السنة الثالثة متوسط','السنة الرابعة متوسط') NOT NULL,
	`content` text NOT NULL,
	`academicYear` varchar(16),
	`unitNumber` int,
	`lessonNumber` int,
	`tags` json,
	`sourceReference` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curriculumDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curriculumSearchIndex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`searchText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curriculumSearchIndex_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspectorReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`resourceType` enum('lesson','assessment') NOT NULL,
	`evaluation` text NOT NULL,
	`criteria` json,
	`overallScore` int,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectorReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int,
	`title` varchar(256) NOT NULL,
	`subject` varchar(128),
	`gradeLevel` varchar(128),
	`unitTitle` varchar(256),
	`unitNumber` int,
	`lessonNumber` int,
	`content` text,
	`plan` text,
	`objectives` text,
	`duration` varchar(64),
	`date` timestamp,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`tags` json,
	`curriculumReferences` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacherProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(128),
	`subject` enum('التاريخ والجغرافيا','التربية المدنية','التاريخ والجغرافيا والتربية المدنية') NOT NULL DEFAULT 'التاريخ والجغرافيا',
	`academicYear` varchar(16),
	`school` varchar(256),
	`province` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacherProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teachingNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int,
	`title` varchar(256),
	`content` text NOT NULL,
	`noteType` enum('ملاحظة عامة','ملاحظة صفية','ملاحظة تقويمية','ملاحظة تربوية') NOT NULL DEFAULT 'ملاحظة عامة',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachingNotes_id` PRIMARY KEY(`id`)
);
