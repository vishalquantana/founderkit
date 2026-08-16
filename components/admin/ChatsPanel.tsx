"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import {
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Send,
  Plus,
  Search,
  User,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
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

export function ChatsPanel({ workshopId }: ChatsPanelProps) {
  const { data, mutate } = useSWR<ChatsResponse>(
    `/api/workshops/${workshopId}/chats`,
    fetcher,
    { refreshInterval: 4000 },
  );

  const escalations = data?.escalations ?? [];
  const conversations = data?.conversations ?? [];

  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Default select first conversation if none selected
  const activeConversation =
    conversations.find((c) => c.participant.id === selectedPid) ||
    conversations[0] ||
    null;

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.participant.founderName.toLowerCase().includes(q) ||
      c.participant.startupName.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const nameFor = (participantId: string) =>
    conversations.find((c) => c.participant.id === participantId)?.participant;

  return (
    <div className="flex flex-col gap-6">
      {/* Top action cards: Add FAQ & Open Escalation alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AddFaqCard workshopId={workshopId} />

        <div className="pulse-card flex flex-col p-4">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <HelpCircle className="h-4 w-4 text-amber-500" />
            Unanswered Escalations
            {escalations.length > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                {escalations.length} new
              </span>
            ) : null}
          </h2>

          {escalations.length === 0 ? (
            <p className="text-xs text-muted">
              All founder questions handled smoothly. When Vamshi.AI escalates a question, it appears here for instant one-click resolution.
            </p>
          ) : (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
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
        </div>
      </div>

      {/* WhatsApp Web 2-Column Chat Layout */}
      <div className="pulse-card overflow-hidden border border-[var(--pulse-border)]">
        <div className="grid h-[620px] grid-cols-1 md:grid-cols-12">
          {/* Left Column: Founder List (WhatsApp Sidebar) */}
          <div className="flex flex-col border-b border-[var(--pulse-border)] bg-[var(--pulse-surface)] md:col-span-4 md:border-b-0 md:border-r">
            {/* Sidebar Header & Search */}
            <div className="flex flex-col gap-2 border-b border-[var(--pulse-border)] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Active Chats ({conversations.length})
                  </span>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search founder or message…"
                  className="w-full rounded-lg border border-[var(--pulse-border)] bg-background py-1.5 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--pulse-border)]/40">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  {conversations.length === 0
                    ? "No founders have messaged Vamshi.AI yet."
                    : "No matching conversations found."}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = activeConversation?.participant.id === c.participant.id;
                  const lastMessage = c.messages[c.messages.length - 1];
                  const unreadOrLast = lastMessage ? lastMessage.content : "Started conversation";

                  return (
                    <button
                      key={c.participant.id}
                      type="button"
                      onClick={() => setSelectedPid(c.participant.id)}
                      className={`flex w-full items-start gap-3 p-3 text-left transition-colors ${
                        isSelected
                          ? "bg-purple-500/15 border-l-4 border-purple-500"
                          : "hover:bg-[var(--pulse-surface-strong)]"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                        {c.participant.founderName ? c.participant.founderName[0].toUpperCase() : "F"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {c.participant.founderName || "Anonymous Founder"}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted">
                            {c.messages.length} msg{c.messages.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="truncate text-[11px] font-medium text-purple-400">
                          {c.participant.startupName || "Startup"}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {lastMessage?.role === "assistant" ? "Vamshi: " : "Founder: "}
                          {unreadOrLast}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat History & Reply Area (WhatsApp Main Pane) */}
          <div className="flex flex-col bg-background md:col-span-8">
            {activeConversation ? (
              <ChatPane
                key={activeConversation.participant.id}
                workshopId={workshopId}
                conversation={activeConversation}
                onRefresh={() => mutate()}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">No Chat Selected</h3>
                <p className="mt-1 max-w-sm text-xs text-muted">
                  Select a founder on the left sidebar to view their full chat history with Vamshi.AI and reply or edit messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPane({
  workshopId,
  conversation,
  onRefresh,
}: {
  workshopId: string;
  conversation: Conversation;
  onRefresh: () => void;
}) {
  const { participant, messages } = conversation;
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
    <div className="flex h-full flex-col">
      {/* Chat Pane Header */}
      <div className="flex items-center justify-between border-b border-[var(--pulse-border)] bg-[var(--pulse-surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
            {participant.founderName ? participant.founderName[0].toUpperCase() : "F"}
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {participant.founderName || "Founder"}
            </h3>
            <p className="text-[11px] text-purple-400 font-medium">{participant.startupName}</p>
          </div>
        </div>
        <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300">
          Live Session
        </span>
      </div>

      {/* Messages Thread (Scroll Area) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--pulse-bg)]/40">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No messages exchanged yet.
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            const isEditing = editingId === m.id;

            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm transition-all ${
                    isUser
                      ? "rounded-tr-xs bg-purple-600 text-white"
                      : "rounded-tl-xs border border-[var(--pulse-border)] bg-[var(--pulse-surface-strong)] text-foreground"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[240px]">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-purple-400 bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-muted hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={savingEdit || !editText.trim()}
                          className="flex items-center gap-1 rounded bg-purple-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-purple-600 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" /> {savingEdit ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      <div
                        className={`mt-1 flex items-center justify-between gap-4 text-[10px] ${
                          isUser ? "text-purple-200/70" : "text-muted"
                        }`}
                      >
                        <span className="font-semibold">
                          {isUser ? "Founder" : "Vamshi.AI (Presenter)"}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(m.id);
                              setEditText(m.content);
                            }}
                            className="flex items-center gap-0.5 hover:underline"
                          >
                            <Edit2 className="h-2.5 w-2.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="flex items-center gap-0.5 text-red-400 hover:underline"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Fixed Reply Box */}
      <div className="border-t border-[var(--pulse-border)] bg-[var(--pulse-surface)] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendReply();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${participant.founderName || "founder"} as Vamshi.AI… (Press Enter)`}
            className="flex-1 rounded-xl border border-[var(--pulse-border)] bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="pulse-btn inline-flex h-9 items-center gap-1.5 px-4 text-xs font-bold disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
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
      setError("Couldn't save FAQ — try again.");
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
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Train Vamshi.AI (Add Live FAQ)
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question founders might ask…"
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            placeholder="The answer Vamshi.AI should give…"
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            {saved ? <span className="text-xs font-semibold text-green-500">Saved ✓</span> : null}
            <button
              type="button"
              onClick={submit}
              disabled={!question.trim() || !answer.trim() || submitting}
              className="pulse-btn px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save to Knowledge Base"}
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
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-amber-400">
          {who ? `${who.founderName} · ${who.startupName}` : "Founder"}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-foreground">&quot;{escalation.question}&quot;</p>
      <div className="mt-2 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply as Vamshi & train FAQ…"
          className="flex-1 rounded-lg border border-[var(--pulse-border)] bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!reply.trim() || submitting}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "…" : "Reply"}
        </button>
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-400">{error}</p> : null}
    </div>
  );
}

export default ChatsPanel;
