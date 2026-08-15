export type PresentView = "dashboard" | "wordcloud" | "progression";

export const VIEW_LABELS: Record<PresentView, string> = {
  dashboard: "Aggregate",
  wordcloud: "Word Cloud",
  progression: "Progression",
};

export interface ViewAvailabilitySettings {
  liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean };
  leaderboard: boolean;
}

/**
 * Pure helper: derives the ordered list of enabled present-mode views from
 * workshop settings. Always returns at least ["dashboard"] as a safe
 * default so present mode never renders with nothing to show.
 */
export function availableViews(settings: ViewAvailabilitySettings): PresentView[] {
  const views: PresentView[] = [];

  if (settings.liveViews.dashboard) views.push("dashboard");
  if (settings.liveViews.wordCloud) views.push("wordcloud");
  if (settings.liveViews.progression || settings.leaderboard) views.push("progression");

  return views.length > 0 ? views : ["dashboard"];
}
