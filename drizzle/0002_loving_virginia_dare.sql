CREATE TABLE `annualPlanSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`annualPlanId` int NOT NULL,
	`sectionNumber` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`duration` varchar(64),
	`competencies` text,
	`objectives` text,
	`resources` text,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annualPlanSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`resourceId` int,
	`title` varchar(256) NOT NULL,
	`date` timestamp,
	`totalStudents` int NOT NULL,
	`participatedStudents` int,
	`averageScore` double,
	`passedCount` int,
	`historyAverage` double,
	`geographyAverage` double,
	`domainScores` json,
	`competencyMastery` json,
	`weakAreas` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessmentResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningSituations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sectionId` int NOT NULL,
	`situationNumber` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`objectives` text,
	`content` text,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningSituations_id` PRIMARY KEY(`id`)
);
