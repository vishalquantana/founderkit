"use client";

import { useState, type ReactNode } from "react";

type Section = "submissions" | "polls" | "chats";

const NAV: { key: Section; label: string }[] = [
  { key: "submissions", label: "Submissions" },
  { key: "polls", label: "Poll Questions" },
  { key: "chats", label: "Chats" },
];

export interface WorkshopWorkspaceProps {
  submissions: ReactNode;
  polls: ReactNode;
  chats: ReactNode;
  quickSettings: ReactNode;
}

/**
 * 3-column workspace for the workshop control page: a left nav to switch the
 * main panel between Submissions and Poll Questions, and a persistent right
 * "Quick settings" column (workshop controls) that's always visible.
 */
export function WorkshopWorkspace({ submissions, polls, chats, quickSettings }: WorkshopWorkspaceProps) {
  const [section, setSection] = useState<Section>("submissions");

  const panels: Record<Section, ReactNode> = { submissions, polls, chats };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[190px_minmax(0,1fr)_360px] lg:items-start">
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

      <div className="min-w-0">{panels[section]}</div>

      <aside className="min-w-0 lg:sticky lg:top-20">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Quick settings
        </h2>
        {quickSettings}
      </aside>
    </div>
  );
}

export default WorkshopWorkspace;
