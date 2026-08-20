CREATE TABLE `competencyModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gradeLevel` enum('السنة الأولى متوسط','السنة الثانية متوسط','السنة الثالثة متوسط','السنة الرابعة متوسط') NOT NULL,
	`subject` enum('الجغرافيا','التاريخ والجغرافيا','التربية المدنية','التاريخ والجغرافيا والتربية المدنية') NOT NULL,
	`globalCompetency` text NOT NULL,
	`sourceDocTitle` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competencyModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sectionCompetencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencyModelId` int NOT NULL,
	`sectionNumber` int NOT NULL,
	`sectionTitle` varchar(256) NOT NULL,
	`termCompetency` text NOT NULL,
	`competencyAction` enum('تنصيب','إنماء','إدماج') NOT NULL DEFAULT 'إنماء',
	`durationHours` int,
	`durationLabel` varchar(64),
	`criteria` json,
	`knowledgeResources` json,
	`linkedSectionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectionCompetencies_id` PRIMARY KEY(`id`)
);
