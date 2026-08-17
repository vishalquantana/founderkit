"use client";

import { useState, type ReactNode } from "react";

type Section = "submissions" | "polls" | "chats" | "feedback" | "knowledge_base" | "settings";

const NAV: { key: Section; label: string }[] = [
  { key: "submissions", label: "Submissions" },
  { key: "polls", label: "Poll Questions" },
  { key: "chats", label: "Chats" },
  { key: "feedback", label: "Feedback" },
  { key: "knowledge_base", label: "Knowledge Base" },
  { key: "settings", label: "Settings" },
];

export interface WorkshopWorkspaceProps {
  submissions: ReactNode;
  polls: ReactNode;
  chats: ReactNode;
  feedback: ReactNode;
  knowledgeBase: ReactNode;
  settingsView: ReactNode;
}

/**
 * 2-column workspace for the workshop control page: a left navigation to switch
 * between Submissions, Poll Questions, Chats, Feedback, Knowledge Base, and dedicated Settings.
 */
export function WorkshopWorkspace({
  submissions,
  polls,
  chats,
  feedback,
  knowledgeBase,
  settingsView,
}: WorkshopWorkspaceProps) {
  const [section, setSection] = useState<Section>("submissions");

  const panels: Record<Section, ReactNode> = {
    submissions,
    polls,
    chats,
    feedback,
    knowledge_base: knowledgeBase,
    settings: settingsView,
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
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
              "shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors",
              section === item.key
                ? "bg-surface-strong text-foreground shadow-sm"
                : "text-muted hover:bg-surface hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <div className="min-w-0">{panels[section]}</div>
    </div>
  );
}

export default WorkshopWorkspace;
