export type PresentView = "welcome" | "dashboard" | "wordcloud" | "progression" | "quiz";

export const VIEW_LABELS: Record<PresentView, string> = {
  welcome: "Welcome",
  dashboard: "Canvas Statistics",
  wordcloud: "Word Cloud",
  progression: "Progression",
  quiz: "AI Quiz Results",
};

export interface ViewAvailabilitySettings {
  liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean; quiz?: boolean };
  leaderboard: boolean;
}

/**
 * Pure helper: derives the ordered list of enabled present-mode views from
 * workshop settings. "welcome" is always available and always first — it's
 * the idle/holding screen for the projector. Falls back to
 * ["welcome", "dashboard"] as a safe default so present mode never renders
 * with nothing else to show.
 */
export function availableViews(settings: ViewAvailabilitySettings): PresentView[] {
  const views: PresentView[] = ["welcome"];

  if (settings.liveViews.dashboard) views.push("dashboard");
  if (settings.liveViews.wordCloud) views.push("wordcloud");
  if (settings.liveViews.progression || settings.leaderboard) views.push("progression");
  if (settings.liveViews.quiz !== false) views.push("quiz");

  return views.length > 1 ? views : ["welcome", "dashboard"];
}
