CREATE TABLE `compensatorySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`situationId` int NOT NULL,
	`academicYear` varchar(16) NOT NULL,
	`subject` varchar(32) NOT NULL,
	`scheduledDate` varchar(10) NOT NULL,
	`dayOfWeek` enum('الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس') NOT NULL,
	`periodIndex` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`sourceStatus` enum('postponed','cancelled') NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compensatorySessions_id` PRIMARY KEY(`id`)
);
