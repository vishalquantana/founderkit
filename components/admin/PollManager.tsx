"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, useReducedMotion } from "motion/react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { Poll } from "@/db/queries/polls";
import { optionColor } from "@/lib/poll-colors";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  activatePollAction,
  closePollAction,
  resetPollVotesAction,
  resetAllPollsAction,
  reorderPollsAction,
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
        const color = optionColor(i);
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-5 shrink-0 text-xs font-semibold"
              style={{ color }}
            >
              {label}
            </span>
            <span className="w-24 shrink-0 truncate text-xs text-foreground" title={option}>
              {option}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
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
  onSave: () => Promise<void>;
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
        <ActionButton
          type="button"
          disabled={isPending || !editor.question.trim() || editor.options.some((o) => !o.trim())}
          onAction={onSave}
          pendingChildren="Saving…"
          className="pulse-btn px-4 py-1.5 text-sm"
        >
          Save
        </ActionButton>
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
  // single form, never more than one in flight at a time. The Save button
  // itself is an ActionButton (instant disable on click); this flag also
  // disables the Cancel button and the field-validity check while saving.
  const [editorPending, setEditorPending] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localPolls, setLocalPolls] = useState<Poll[]>(() =>
    [...polls].sort((a, b) => a.position - b.position),
  );

  useEffect(() => {
    setLocalPolls([...polls].sort((a, b) => a.position - b.position));
  }, [polls]);

  const { data: pollResults } = useSWR<PollResultsResponse>(
    `/api/workshops/${workshopId}/poll-results`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: false },
  );

  async function handleReorder(newOrder: Poll[]) {
    setLocalPolls(newOrder);
    try {
      await reorderPollsAction(
        workshopId,
        newOrder.map((p) => p.id),
      );
    } catch (err) {
      console.error("Failed to reorder polls:", err);
      setLocalPolls([...polls].sort((a, b) => a.position - b.position));
    }
  }

  function movePoll(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= localPolls.length || fromIndex === toIndex) return;
    const reordered = [...localPolls];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    handleReorder(reordered);
  }

  function startEdit(poll: Poll) {
    setConfirmDeleteId(null);
    setConfirmResetId(null);
    setConfirmResetAll(false);
    setEditor({
      pollId: poll.id,
      question: poll.question,
      options: [...(poll.options as string[])],
    });
  }

  function startCreate() {
    setConfirmDeleteId(null);
    setConfirmResetId(null);
    setConfirmResetAll(false);
    setEditor({ pollId: null, question: "", options: ["", ""] });
  }

  function cancelEdit() {
    setEditor(null);
  }

  async function saveEdit() {
    if (!editor) return;
    const question = editor.question.trim();
    const options = editor.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question || options.length === 0) return;

    const pollId = editor.pollId;
    setEditorPending(true);
    try {
      if (pollId) {
        await updatePollAction(workshopId, pollId, question, options);
      } else {
        await createPollAction(workshopId, question, options);
      }
      setEditor(null);
    } finally {
      setEditorPending(false);
    }
  }

  async function handleActivate(pollId: string) {
    await activatePollAction(workshopId, pollId);
  }

  async function handleClose(pollId: string) {
    await closePollAction(workshopId, pollId);
  }

  async function handleResetClick(pollId: string) {
    if (confirmResetId === pollId) {
      await resetPollVotesAction(workshopId, pollId);
      setConfirmResetId(null);
    } else {
      setConfirmDeleteId(null);
      setConfirmResetAll(false);
      setConfirmResetId(pollId);
    }
  }

  async function handleResetAllClick() {
    if (confirmResetAll) {
      await resetAllPollsAction(workshopId);
      setConfirmResetAll(false);
    } else {
      setConfirmDeleteId(null);
      setConfirmResetId(null);
      setConfirmResetAll(true);
    }
  }

  async function handleDeleteClick(pollId: string) {
    if (confirmDeleteId === pollId) {
      await deletePollAction(workshopId, pollId);
      setConfirmDeleteId(null);
    } else {
      setConfirmResetId(null);
      setConfirmResetAll(false);
      setConfirmDeleteId(pollId);
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--pulse-border)] bg-surface p-3 sm:px-4">
        <div className="flex items-center gap-2">
          {!editor && (
            <button
              type="button"
              disabled={editorPending}
              onClick={startCreate}
              className="pulse-btn px-3.5 py-1.5 text-xs font-bold"
            >
              + Add Question
            </button>
          )}
          {localPolls.length > 1 && (
            <span className="hidden sm:inline text-xs text-muted">
              Tip: Drag cards or use ↑↓ arrows to reorder questions
            </span>
          )}
        </div>

        {localPolls.length > 0 && (
          <div className="flex items-center gap-2">
            <ActionButton
              type="button"
              onAction={handleResetAllClick}
              pendingChildren="Resetting all…"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                confirmResetAll
                  ? "bg-amber-500 text-white hover:bg-amber-400"
                  : "pulse-btn-secondary"
              }`}
            >
              {confirmResetAll ? "Confirm Reset All Polls?" : "Reset All Poll Responses"}
            </ActionButton>
          </div>
        )}
      </div>

      {localPolls.length === 0 && !editor ? (
        <div className="pulse-card border-dashed p-8 text-center text-sm text-muted">
          No poll questions yet. Add one to get started.
        </div>
      ) : null}

      {localPolls.map((poll, index) => {
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

        const showTally = isActive && pollResults?.poll?.id === poll.id;
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={poll.id}
            draggable
            onDragStart={(e) => {
              setDraggedIndex(index);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", `${index}`);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverIndex !== index) {
                setDragOverIndex(index);
              }
            }}
            onDragLeave={() => {
              if (dragOverIndex === index) {
                setDragOverIndex(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedIndex !== null && draggedIndex !== index) {
                movePoll(draggedIndex, index);
              }
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            className={`pulse-card relative flex items-start gap-3 p-4 transition-all duration-150 ${
              isActive ? "border-emerald-500/50" : ""
            } ${isDragging ? "opacity-40 scale-[0.98] border-dashed border-purple-500" : ""} ${
              isDragOver && !isDragging
                ? "border-t-2 border-t-purple-500 bg-purple-500/5 shadow-md"
                : ""
            }`}
          >
            {/* Drag Handle & Up/Down Arrows */}
            <div className="flex flex-col items-center gap-1 self-stretch justify-center pr-1 border-r border-[var(--pulse-border)]">
              <div
                title="Drag to reorder"
                className="cursor-grab active:cursor-grabbing p-1 text-muted hover:text-foreground rounded transition"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => movePoll(index, index - 1)}
                  title="Move up"
                  className="rounded p-0.5 text-muted hover:text-foreground hover:bg-surface-strong disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === localPolls.length - 1}
                  onClick={() => movePoll(index, index + 1)}
                  title="Move down"
                  className="rounded p-0.5 text-muted hover:text-foreground hover:bg-surface-strong disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Poll Content & Actions */}
            <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted">
                    #{index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[poll.status]}`}
                  >
                    {STATUS_LABELS[poll.status]}
                  </span>
                </div>
                <p className="mt-2 font-medium text-foreground">{poll.question}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {(poll.options as string[]).map((option, optIdx) => (
                    <li key={optIdx} className="text-sm text-muted">
                      <span className="mr-1.5 font-semibold">{OPTION_LABELS[optIdx] ?? optIdx + 1}.</span>
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
                  <ActionButton
                    type="button"
                    onAction={() => handleClose(poll.id)}
                    pendingChildren="Disabling…"
                    className="pulse-btn-secondary px-3 py-1.5 text-xs"
                    title="Stop projecting this poll to founders"
                  >
                    Disable (stop projecting)
                  </ActionButton>
                ) : (
                  <ActionButton
                    type="button"
                    onAction={() => handleActivate(poll.id)}
                    pendingChildren="Activating…"
                    className="pulse-btn px-3 py-1.5 text-xs"
                  >
                    Activate
                  </ActionButton>
                )}
                <ActionButton
                  type="button"
                  onAction={() => handleResetClick(poll.id)}
                  pendingChildren={confirmResetId === poll.id ? "Resetting…" : undefined}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    confirmResetId === poll.id
                      ? "rounded-full bg-amber-500 text-white hover:bg-amber-400"
                      : "pulse-btn-secondary"
                  }`}
                >
                  {confirmResetId === poll.id ? "Confirm reset?" : "Reset responses"}
                </ActionButton>
                <button
                  type="button"
                  onClick={() => startEdit(poll)}
                  className="pulse-btn-secondary px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <ActionButton
                  type="button"
                  onAction={() => handleDeleteClick(poll.id)}
                  pendingChildren={confirmDeleteId === poll.id ? "Deleting…" : undefined}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    confirmDeleteId === poll.id
                      ? "rounded-full bg-red-500 text-white hover:bg-red-400"
                      : "pulse-btn-secondary"
                  }`}
                >
                  {confirmDeleteId === poll.id ? "Confirm delete?" : "Delete"}
                </ActionButton>
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
