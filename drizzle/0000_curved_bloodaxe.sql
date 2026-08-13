CREATE TABLE `agentRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stage` int NOT NULL,
	`agentName` varchar(120) NOT NULL,
	`status` enum('RUNNING','COMPLETED','NEEDS_REVIEW','APPROVED','ERROR') NOT NULL DEFAULT 'RUNNING',
	`prompt` text NOT NULL,
	`output` text,
	`reviewInstruction` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `agentRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stage` int,
	`type` varchar(60) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` varchar(16) NOT NULL,
	`snapshot` text NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`productType` varchar(120) NOT NULL,
	`desiredSize` varchar(120),
	`notes` text,
	`economyPreference` varchar(120),
	`instructions` text,
	`referenceUrl` text,
	`referenceKey` text,
	`status` enum('DRAFT','IN_ANALYSIS','IN_DEVELOPMENT','AWAITING_REVIEW','IN_REVISION','APPROVED','FINALIZED','ARCHIVED','ERROR') NOT NULL DEFAULT 'DRAFT',
	`currentStage` int NOT NULL DEFAULT 1,
	`version` varchar(16) NOT NULL DEFAULT '01.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
