ALTER TABLE `projects` ADD `productPreset` varchar(60) DEFAULT 'keychain-single' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `productSpec` text;