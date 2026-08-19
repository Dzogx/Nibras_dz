CREATE TABLE `gradebookRoster` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`matricule` varchar(64),
	`fullName` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gradebookRoster_id` PRIMARY KEY(`id`)
);
