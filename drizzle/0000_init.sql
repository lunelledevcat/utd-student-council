CREATE TABLE `academic_years` (
	`year` integer PRIMARY KEY NOT NULL,
	`is_current` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`slug` text,
	`title` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text DEFAULT '' NOT NULL,
	`place` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `academic_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activities_year_idx` ON `activities` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `advisors` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`nickname_en` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`consent_public` integer DEFAULT false NOT NULL,
	`photo_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`role_label` text DEFAULT 'ครูที่ปรึกษา' NOT NULL,
	`role_label_en` text DEFAULT '' NOT NULL,
	`subject_group` text DEFAULT '' NOT NULL,
	`subject_group_en` text DEFAULT '' NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`position_en` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `academic_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `advisors_year_idx` ON `advisors` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`slug` text,
	`title` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`tag` text DEFAULT '' NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`published_on` text NOT NULL,
	`link_url` text,
	`cover_photo_id` text,
	`pinned` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `academic_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `announcements_year_idx` ON `announcements` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` text,
	`actor_email` text,
	`action` text NOT NULL,
	`target_table` text,
	`target_id` text,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`nickname_en` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`consent_public` integer DEFAULT false NOT NULL,
	`photo_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`role_title` text NOT NULL,
	`role_title_en` text DEFAULT '' NOT NULL,
	`term_no` text DEFAULT '' NOT NULL,
	`exec_title` text DEFAULT '' NOT NULL,
	`exec_title_en` text DEFAULT '' NOT NULL,
	`dept` text NOT NULL,
	`dept_en` text DEFAULT '' NOT NULL,
	`party` text DEFAULT '' NOT NULL,
	`party_en` text DEFAULT '' NOT NULL,
	`grade` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `academic_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `members_year_idx` ON `members` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`credit` text,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`blur` text,
	`static_path` text,
	`is_hero` integer DEFAULT false NOT NULL,
	`hero_order` integer DEFAULT 0 NOT NULL,
	`activity_id` text,
	`policy_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`uploaded_by` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photos_activity_idx` ON `photos` (`activity_id`);--> statement-breakpoint
CREATE INDEX `photos_policy_idx` ON `photos` (`policy_id`);--> statement-breakpoint
CREATE INDEX `photos_hero_idx` ON `photos` (`is_hero`,`hero_order`);--> statement-breakpoint
CREATE TABLE `policies` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`summary_en` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`progress_status` text DEFAULT 'planned' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`owner_en` text DEFAULT '' NOT NULL,
	`timeline` text DEFAULT '[]' NOT NULL,
	`cover_photo_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `academic_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policies_slug_uq` ON `policies` (`slug`);--> statement-breakpoint
CREATE INDEX `policies_year_idx` ON `policies` (`year`,`status`);--> statement-breakpoint
CREATE TABLE `rate_hits` (
	`key` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_hits_key_idx` ON `rate_hits` (`key`,`at`);--> statement-breakpoint
CREATE TABLE `role_invites` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`ip_hash` text,
	`user_id` text,
	`path` text,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_created_idx` ON `security_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`role` text,
	`last_login_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `voice_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ref_code` text NOT NULL,
	`category` text NOT NULL,
	`message` text NOT NULL,
	`anonymous` integer DEFAULT true NOT NULL,
	`ip_hash` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_messages_ref_code_unique` ON `voice_messages` (`ref_code`);--> statement-breakpoint
CREATE TABLE `voice_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`voice_id` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_id` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`reason` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`voice_id`) REFERENCES `voice_messages`(`id`) ON UPDATE no action ON DELETE cascade
);
