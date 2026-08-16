CREATE TABLE `feedback_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`q1_usefulness` text NOT NULL,
	`q2_most_valuable` text NOT NULL,
	`q3_identified_assumptions` text NOT NULL,
	`q4_ai_tool_usefulness` text NOT NULL,
	`q5_next_7_days_action` text NOT NULL,
	`q6_suggestions` text,
	`q7_followup_interest` text NOT NULL,
	`q7_contact_info` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_submissions_participant_id_unique` ON `feedback_submissions` (`participant_id`);