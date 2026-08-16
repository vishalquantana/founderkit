CREATE TABLE `growth_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`primary_channel` text NOT NULL,
	`target_segment` text NOT NULL,
	`conversion_goal` text NOT NULL,
	`success_metric_30_day` text NOT NULL,
	`biggest_risk` text NOT NULL,
	`low_hanging_opportunity` text NOT NULL,
	`top_channels` text NOT NULL,
	`plan_30_day` text NOT NULL,
	`plan_60_day` text NOT NULL,
	`plan_90_day` text NOT NULL,
	`metrics_to_track` text NOT NULL,
	`outreach_script` text NOT NULL,
	`avoid_overbuilding_rec` text NOT NULL,
	`checked_tasks` text DEFAULT '[]' NOT NULL,
	`ai_raw` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `growth_plans_participant_id_unique` ON `growth_plans` (`participant_id`);