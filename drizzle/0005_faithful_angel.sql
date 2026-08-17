CREATE TABLE `weeklyScheduleEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`academicYear` varchar(16) NOT NULL,
	`dayOfWeek` enum('الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس') NOT NULL,
	`periodIndex` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`room` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyScheduleEntries_id` PRIMARY KEY(`id`)
);
