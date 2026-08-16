"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { motion, useReducedMotion } from "motion/react";
import type { Poll } from "@/db/queries/polls";
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  activatePollAction,
  closePollAction,
} from "@/app/(admin)/workshops/[id]/poll-actions";

interface PollResultsResponse {
  poll: { id: string; question: string; options: string[] } | null;
  tally: { counts: number[]; total: number } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function percentFor(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

interface PollTallyProps {
  options: string[];
  counts: number[];
  total: number;
}

function PollTally({ options, counts, total }: PollTallyProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border-strong pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Live responses · <span className="tabular-nums">{total}</span> total
      </p>
      {options.map((option, i) => {
        const count = counts[i] ?? 0;
        const pct = percentFor(count, total);
        const label = String.fromCharCode(65 + i);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs font-semibold text-muted">{label}</span>
            <span className="w-24 shrink-0 truncate text-xs text-foreground" title={option}>
              {option}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--pulse-gradient)" }}
                initial={shouldReduceMotion ? { width: `${pct}%` } : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 24 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-muted">
              {count} ({Math.round(pct)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface PollManagerProps {
  workshopId: string;
  polls: Poll[];
  className?: string;
}

const OPTION_LABELS = "ABCDEFGHIJ";

const STATUS_STYLES: Record<Poll["status"], string> = {
  draft: "border-border-strong bg-surface-strong text-muted",
  active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
  closed: "border-border-strong bg-surface-strong text-muted",
};

const STATUS_LABELS: Record<Poll["status"], string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

interface EditorState {
  pollId: string | null; // null = new poll
  question: string;
  options: string[];
}

interface PollEditorProps {
  editor: EditorState;
  isPending: boolean;
  onChange: (next: EditorState) => void;
  onSave: () => void;
  onCancel: () => void;
}

function PollEditor({ editor, isPending, onChange, onSave, onCancel }: PollEditorProps) {
  function updateOption(index: number, value: string) {
    const options = [...editor.options];
    options[index] = value;
    onChange({ ...editor, options });
  }

  function addOption() {
    onChange({ ...editor, options: [...editor.options, ""] });
  }

  function removeOption(index: number) {
    onChange({ ...editor, options: editor.options.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-strong bg-surface p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Question
        </label>
        <input
          type="text"
          value={editor.question}
          onChange={(e) => onChange({ ...editor, question: e.target.value })}
          placeholder="What should we ask?"
          className="pulse-input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Options
        </label>
        <div className="flex flex-col gap-2">
          {editor.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-sm font-semibold text-muted">
                {OPTION_LABELS[index] ?? index + 1}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="pulse-input w-full"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={editor.options.length <= 1}
                className="shrink-0 text-xs font-medium text-muted transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 text-xs font-medium text-accent hover:underline"
        >
          + Add option
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isPending || !editor.question.trim() || editor.options.some((o) => !o.trim())}
          onClick={onSave}
          className="pulse-btn px-4 py-1.5 text-sm"
        >
          Save
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="pulse-btn-secondary px-4 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Presenter-facing poll manager: list, edit, add, delete, and activate/close
 * the workshop's live poll questions. Only one poll is active at a time —
 * enforced server-side by `activatePoll`.
 */
export function PollManager({ workshopId, polls, className }: PollManagerProps) {
  // Editor save/cancel (create + update) has its own pending flag — it's a
  // single form, never more than one in flight at a time.
  const [editorPending, startEditorTransition] = useTransition();
  // Row-level actions (activate/close/delete) are keyed to the specific poll
  // id so clicking one row's button doesn't visually disable every other row.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: pollResults } = useSWR<PollResultsResponse>(
    `/api/workshops/${workshopId}/poll-results`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: false },
  );

  const sortedPolls = [...polls].sort((a, b) => a.position - b.position);

  function startEdit(poll: Poll) {
    setConfirmDeleteId(null);
    setEditor({
      pollId: poll.id,
      question: poll.question,
      options: [...(poll.options as string[])],
    });
  }

  function startCreate() {
    setConfirmDeleteId(null);
    setEditor({ pollId: null, question: "", options: ["", ""] });
  }

  function cancelEdit() {
    setEditor(null);
  }

  function saveEdit() {
    if (!editor) return;
    const question = editor.question.trim();
    const options = editor.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question || options.length === 0) return;

    const pollId = editor.pollId;
    startEditorTransition(async () => {
      if (pollId) {
        await updatePollAction(workshopId, pollId, question, options);
      } else {
        await createPollAction(workshopId, question, options);
      }
      setEditor(null);
    });
  }

  async function handleActivate(pollId: string) {
    setPendingId(pollId);
    try {
      await activatePollAction(workshopId, pollId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleClose(pollId: string) {
    setPendingId(pollId);
    try {
      await closePollAction(workshopId, pollId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDeleteClick(pollId: string) {
    if (confirmDeleteId === pollId) {
      setPendingId(pollId);
      try {
        await deletePollAction(workshopId, pollId);
        setConfirmDeleteId(null);
      } finally {
        setPendingId(null);
      }
    } else {
      setConfirmDeleteId(pollId);
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {sortedPolls.length === 0 && !editor ? (
        <div className="pulse-card border-dashed p-8 text-center text-sm text-muted">
          No poll questions yet. Add one to get started.
        </div>
      ) : null}

      {sortedPolls.map((poll) => {
        const isActive = poll.status === "active";
        const isEditingThis = editor?.pollId === poll.id;

        if (isEditingThis && editor) {
          return (
            <PollEditor
              key={poll.id}
              editor={editor}
              isPending={editorPending}
              onChange={setEditor}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          );
        }

        const rowPending = pendingId === poll.id;
        const showTally = isActive && pollResults?.poll?.id === poll.id;

        return (
          <div
            key={poll.id}
            className={`pulse-card p-4 ${isActive ? "border-emerald-500/50" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[poll.status]}`}
                  >
                    {STATUS_LABELS[poll.status]}
                  </span>
                </div>
                <p className="mt-2 font-medium text-foreground">{poll.question}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {(poll.options as string[]).map((option, index) => (
                    <li key={index} className="text-sm text-muted">
                      <span className="mr-1.5 font-semibold">{OPTION_LABELS[index] ?? index + 1}.</span>
                      {option}
                    </li>
                  ))}
                </ul>
                {showTally && pollResults?.poll ? (
                  <PollTally
                    options={pollResults.poll.options}
                    counts={pollResults.tally?.counts ?? []}
                    total={pollResults.tally?.total ?? 0}
                  />
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isActive ? (
                  <button
                    type="button"
                    disabled={rowPending}
                    onClick={() => handleClose(poll.id)}
                    className="pulse-btn-secondary px-3 py-1.5 text-xs"
                  >
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={rowPending}
                    onClick={() => handleActivate(poll.id)}
                    className="pulse-btn px-3 py-1.5 text-xs"
                  >
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  disabled={rowPending}
                  onClick={() => startEdit(poll)}
                  className="pulse-btn-secondary px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={rowPending}
                  onClick={() => handleDeleteClick(poll.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    confirmDeleteId === poll.id
                      ? "rounded-full bg-red-500 text-white hover:bg-red-400"
                      : "pulse-btn-secondary"
                  }`}
                >
                  {confirmDeleteId === poll.id ? "Confirm delete?" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {editor && editor.pollId === null ? (
        <PollEditor
          editor={editor}
          isPending={editorPending}
          onChange={setEditor}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      ) : (
        <button
          type="button"
          disabled={editorPending}
          onClick={startCreate}
          className="pulse-btn-secondary self-start px-4 py-2 text-sm"
        >
          + Add question
        </button>
      )}
    </div>
  );
}

export default PollManager;
