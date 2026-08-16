"use client";

import { useState, type ReactNode } from "react";

type Section = "submissions" | "polls" | "settings";

const NAV: { key: Section; label: string }[] = [
  { key: "submissions", label: "Submissions" },
  { key: "polls", label: "Poll Questions" },
  { key: "settings", label: "Settings" },
];

export interface WorkshopWorkspaceProps {
  submissions: ReactNode;
  polls: ReactNode;
  settings: ReactNode;
}

/**
 * Left-nav workspace for the workshop control page: a sidebar to switch the
 * main panel between Submissions, Poll Questions, and Settings.
 */
export function WorkshopWorkspace({ submissions, polls, settings }: WorkshopWorkspaceProps) {
  const [section, setSection] = useState<Section>("submissions");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start">
      <aside
        className="flex flex-row gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
        aria-label="Workshop sections"
      >
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            aria-current={section === item.key ? "page" : undefined}
            className={[
              "shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-colors",
              section === item.key
                ? "bg-surface-strong text-foreground"
                : "text-muted hover:bg-surface hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <div className="min-w-0">
        {section === "submissions" ? submissions : section === "polls" ? polls : settings}
      </div>
    </div>
  );
}

export default WorkshopWorkspace;
