"use client";

import { useState, useTransition } from "react";
import type { Poll } from "@/db/queries/polls";
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  activatePollAction,
  closePollAction,
} from "@/app/(admin)/workshops/[id]/poll-actions";

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
  const [isPending, startTransition] = useTransition();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    startTransition(async () => {
      if (pollId) {
        await updatePollAction(workshopId, pollId, question, options);
      } else {
        await createPollAction(workshopId, question, options);
      }
      setEditor(null);
    });
  }

  function handleActivate(pollId: string) {
    startTransition(async () => {
      await activatePollAction(workshopId, pollId);
    });
  }

  function handleClose(pollId: string) {
    startTransition(async () => {
      await closePollAction(workshopId, pollId);
    });
  }

  function handleDeleteClick(pollId: string) {
    if (confirmDeleteId === pollId) {
      startTransition(async () => {
        await deletePollAction(workshopId, pollId);
        setConfirmDeleteId(null);
      });
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
              isPending={isPending}
              onChange={setEditor}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          );
        }

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
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isActive ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleClose(poll.id)}
                    className="pulse-btn-secondary px-3 py-1.5 text-xs"
                  >
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleActivate(poll.id)}
                    className="pulse-btn px-3 py-1.5 text-xs"
                  >
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startEdit(poll)}
                  className="pulse-btn-secondary px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={isPending}
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
          isPending={isPending}
          onChange={setEditor}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      ) : (
        <button
          type="button"
          disabled={isPending}
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
