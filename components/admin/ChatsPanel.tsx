"use client";

import { useState } from "react";
import useSWR from "swr";
import { MessageSquare, HelpCircle, ChevronDown, Send, Plus } from "lucide-react";
import {
  presenterSendChatMessageAction,
  presenterEditChatMessageAction,
  presenterDeleteChatMessageAction,
} from "@/app/(admin)/workshops/[id]/chat-actions";

export interface ChatsPanelProps {
  workshopId: string;
}

interface EscalationItem {
  id: string;
  participantId: string;
  question: string;
  createdAt: number;
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  flagged: boolean;
  createdAt: number;
}

interface Conversation {
  participant: { id: string; founderName: string; startupName: string };
  messages: ConversationMessage[];
}

interface ChatsResponse {
  escalations: EscalationItem[];
  conversations: Conversation[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Presenter "Chats" section. Top: the queue of blocked questions Vamshi.AI
 * couldn't confidently answer — the presenter replies inline, and each reply
 * is delivered back to the founder AND written to the workshop FAQ (so the
 * next founder who asks gets it instantly). Below: every founder's transcript.
 */
export function ChatsPanel({ workshopId }: ChatsPanelProps) {
  const { data, mutate } = useSWR<ChatsResponse>(
    `/api/workshops/${workshopId}/chats`,
    fetcher,
    { refreshInterval: 5000 },
  );

  const escalations = data?.escalations ?? [];
  const conversations = data?.conversations ?? [];

  const nameFor = (participantId: string) =>
    conversations.find((c) => c.participant.id === participantId)?.participant;

  return (
    <div className="flex flex-col gap-8">
      <AddFaqCard workshopId={workshopId} />

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <HelpCircle className="h-4 w-4" />
          Needs your answer
          {escalations.length > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-500">
              {escalations.length}
            </span>
          ) : null}
        </h2>

        {escalations.length === 0 ? (
          <div className="pulse-card p-4">
            <p className="text-sm text-muted">
              No blocked questions right now. When Vamshi.AI can&apos;t answer something, it appears
              here for you to reply — your answer reaches the founder and trains the bot.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {escalations.map((e) => (
              <EscalationCard
                key={e.id}
                workshopId={workshopId}
                escalation={e}
                who={nameFor(e.participantId)}
                onAnswered={() => mutate()}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <MessageSquare className="h-4 w-4" />
          All conversations
        </h2>
        {conversations.length === 0 ? (
          <div className="pulse-card p-4">
            <p className="text-sm text-muted">No founder has chatted with Vamshi.AI yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversations.map((c) => (
              <ConversationCard
                key={c.participant.id}
                workshopId={workshopId}
                conversation={c}
                onRefresh={() => mutate()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AddFaqCard({ workshopId }: { workshopId: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!question.trim() || !answer.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setQuestion("");
      setAnswer("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pulse-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Plus className="h-4 w-4" />
          Add a FAQ for Vamshi.AI
        </span>
        <ChevronDown className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question founders might ask…"
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="The answer Vamshi.AI should give…"
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            {saved ? <span className="text-xs font-semibold text-green-500">Saved ✓</span> : null}
            <button
              type="button"
              onClick={submit}
              disabled={!question.trim() || !answer.trim() || submitting}
              className="pulse-btn px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save FAQ"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EscalationCard({
  workshopId,
  escalation,
  who,
  onAnswered,
}: {
  workshopId: string;
  escalation: EscalationItem;
  who?: { founderName: string; startupName: string };
  onAnswered: () => void;
}) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const presenterReply = reply.trim();
    if (!presenterReply || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workshops/${workshopId}/escalations/${escalation.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presenterReply }),
        },
      );
      if (!res.ok) throw new Error("failed");
      setReply("");
      onAnswered();
    } catch {
      setError("Couldn't send — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pulse-card p-4">
      <p className="text-xs font-semibold text-muted">
        {who ? `${who.founderName} · ${who.startupName}` : "A founder"} asked
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{escalation.question}</p>
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Reply as Vamshi — this reaches the founder and trains the bot…"
          className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!reply.trim() || submitting}
            className="pulse-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending…" : "Send answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationCard({
  workshopId,
  conversation,
  onRefresh,
}: {
  workshopId: string;
  conversation: Conversation;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { participant, messages } = conversation;
  const last = messages[messages.length - 1];

  async function handleSendReply() {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await presenterSendChatMessageAction({
        workshopId,
        participantId: participant.id,
        content: text,
      });
      setReplyText("");
      onRefresh();
    } catch {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveEdit(messageId: string) {
    const text = editText.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      await presenterEditChatMessageAction({
        workshopId,
        messageId,
        content: text,
      });
      setEditingId(null);
      onRefresh();
    } catch {
      alert("Failed to edit message");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(messageId: string) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await presenterDeleteChatMessageAction({
        workshopId,
        messageId,
      });
      onRefresh();
    } catch {
      alert("Failed to delete message");
    }
  }

  return (
    <div className="pulse-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {participant.founderName} · {participant.startupName}
          </p>
          <p className="truncate text-xs text-muted">
            {messages.length} message{messages.length === 1 ? "" : "s"}
            {last ? ` · ${last.content.slice(0, 60)}` : ""}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-[var(--pulse-border)] px-4 py-3">
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="group relative max-w-[85%] rounded-xl px-3 py-2 text-sm"
                  style={
                    m.role === "user"
                      ? { background: "var(--pulse-violet)", color: "#0a0a14" }
                      : { background: "var(--pulse-surface-strong)", color: "var(--pulse-text)" }
                  }
                >
                  {editingId === m.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-purple-500 bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded px-2 py-1 text-[11px] font-semibold text-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={savingEdit || !editText.trim()}
                          className="rounded bg-purple-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>{m.content}</div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-60">
                        <span>{m.role === "user" ? "Founder" : "Vamshi.AI / Presenter"}</span>
                        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(m.id);
                              setEditText(m.content);
                            }}
                            className="hover:underline"
                          >
                            Edit
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="hover:underline text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Presenter direct reply box */}
          <div className="mt-2 flex gap-2 border-t border-[var(--pulse-border)] pt-3">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder={`Reply directly to ${participant.founderName} as Vamshi.AI…`}
              className="flex-1 rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="pulse-btn inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ChatsPanel;
