import type { WorkshopSettings } from "@/db/queries/workshops";

export const DEFAULT_SETTINGS: WorkshopSettings = {
  liveViews: { dashboard: true, wordCloud: true, progression: false },
  leaderboard: false,
  probeEnabled: true,
  canvasUnlocked: false,
};

export const DEFAULT_CONSENT_TEXT =
  "By continuing, you agree that your responses will be used to generate an AI-assisted startup readiness snapshot. This is a directional learning tool, not investment, legal, financial, or business guarantee advice. Please avoid sharing confidential information.";
