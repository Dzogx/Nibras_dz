ALTER TABLE `gradebookEntries` MODIFY COLUMN `continuousScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` MODIFY COLUMN `quizScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` MODIFY COLUMN `assessmentScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` ADD `attendanceScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` ADD `behaviorScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` ADD `activityScore` double;--> statement-breakpoint
ALTER TABLE `gradebookEntries` DROP COLUMN `disciplineScore`;--> statement-breakpoint
ALTER TABLE `gradebookEntries` DROP COLUMN `participationScore`;--> statement-breakpoint
ALTER TABLE `gradebookEntries` DROP COLUMN `homeworkScore`;--> statement-breakpoint
ALTER TABLE `gradebookEntries` DROP COLUMN `activitiesScore`;