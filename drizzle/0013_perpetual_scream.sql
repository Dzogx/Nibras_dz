ALTER TABLE `aiResources` ADD `subject` varchar(128);--> statement-breakpoint
ALTER TABLE `aiResources` ADD `gradeLevel` varchar(128);--> statement-breakpoint
ALTER TABLE `gradebookEntries` DROP COLUMN `behaviorScore`;