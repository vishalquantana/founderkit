CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`workshop_id` text NOT NULL,
	`founder_name` text NOT NULL,
	`startup_name` text NOT NULL,
	`contact` text NOT NULL,
	`sector` text,
	`stage` text,
	`team_size` text,
	`product_type` text,
	`business_model` text,
	`consent_followup` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`section` text NOT NULL,
	`main_answer` text NOT NULL,
	`probe_question` text,
	`probe_answer` text,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`backend_score` integer NOT NULL,
	`dimension_scores` text NOT NULL,
	`readiness_stage` text NOT NULL,
	`summary` text NOT NULL,
	`strengths` text NOT NULL,
	`assumptions` text NOT NULL,
	`mvp_experiment` text NOT NULL,
	`seven_day_plan` text NOT NULL,
	`improved_pitch` text NOT NULL,
	`reflection_question` text NOT NULL,
	`ai_raw` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `results_participant_id_unique` ON `results` (`participant_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workshops` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`join_code` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`consent_text` text NOT NULL,
	`settings` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workshops_join_code_unique` ON `workshops` (`join_code`);