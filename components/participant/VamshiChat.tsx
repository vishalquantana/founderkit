"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Send, X } from "lucide-react";

export interface VamshiChatProps {
  code: string;
  participantId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  flagged?: boolean;
  createdAt?: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STARTERS = [
  "How do I find my first 10 customers?",
  "How should I price my product?",
  "What should my MVP actually include?",
];

/** Vamshi.AI avatar — the provided portrait, degrading to a Sparkles glyph. */
function Avatar({ size = 40 }: { size?: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "var(--pulse-violet)", color: "#0a0a14" }}
      >
        <Sparkles style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden="true" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vamshi-ai.jpeg"
      alt="Vamshi.AI"
      width={size}
      height={size}
      onError={() => setBroken(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Floating Vamshi.AI advisor. A bubble bottom-right (clear of the founder
 * tab bar) opens a chat panel. History is SWR-polled every 5s so presenter
 * replies (delivered as assistant messages) arrive without a refresh. Sends
 * are optimistic; an abuse lock reloads into the app-wide lock screen.
 */
export function VamshiChat({ code, participantId }: VamshiChatProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<{ messages: ChatMessage[]; locked: boolean }>(
    open ? `/api/w/${code}/chat/history?participantId=${participantId}` : null,
    fetcher,
    { refreshInterval: 5000 },
  );

  const serverMessages = data?.messages ?? [];
  // Drop optimistic rows once the server echoes a matching user message.
  const serverUserContents = new Set(
    serverMessages.filter((m) => m.role === "user").map((m) => m.content),
  );
  const visiblePending = pending.filter((m) => !serverUserContents.has(m.content));
  const messages = [...serverMessages, ...visiblePending];

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    setSending(true);
    setPending((p) => [...p, { id: `tmp-${p.length}-${message.slice(0, 8)}`, role: "user", content: message }]);

    try {
      const res = await fetch(`/api/w/${code}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, message }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { reply?: string; flagged?: boolean; locked?: boolean }
        | null;

      if (payload?.locked) {
        // Abuse lock — the layout's lock screen takes over on reload.
        location.reload();
        return;
      }
      await mutate();
    } catch {
      // Leave the optimistic message; the next poll reconciles.
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Round floating action button (hidden while the panel is open). */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Vamshi.AI"
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-xl ring-2 ring-[var(--pulse-violet)] transition-transform active:scale-90"
          style={{
            bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
            background: "var(--pulse-surface-strong)",
          }}
        >
          <Avatar size={56} />
          <span
            className="pointer-events-none absolute -top-1 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full"
            style={{ background: "var(--pulse-violet)", border: "2px solid var(--background)" }}
            aria-hidden="true"
          >
            <Sparkles className="h-2 w-2" style={{ color: "#0a0a14" }} />
          </span>
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] w-full flex-col rounded-t-2xl sm:inset-x-auto sm:bottom-24 sm:right-4 sm:max-h-[70vh] sm:w-[380px] sm:rounded-2xl"
            style={{ background: "var(--pulse-bg-elevated, var(--background))", border: "1px solid var(--pulse-border)" }}
            role="dialog"
            aria-label="Vamshi.AI chat"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 rounded-t-2xl px-4 py-3"
              style={{ borderBottom: "1px solid var(--pulse-border)" }}
            >
              <Avatar size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--pulse-text)" }}>
                  Vamshi.AI
                </p>
                <p className="text-xs text-muted">Your growth &amp; GTM advisor</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted">
                    Hi, I&apos;m Vamshi.AI. Ask me anything about growth, GTM, pricing, or your next
                    step — I&apos;ll answer from your own canvas.
                  </p>
                  <div className="flex flex-col gap-2">
                    {STARTERS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="pulse-chip rounded-xl px-3 py-2 text-left text-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <Bubble key={m.id} message={m} />)
              )}
              {sending ? (
                <div className="flex items-center gap-2">
                  <Avatar size={28} />
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full"
                        style={{ background: "var(--pulse-violet)", animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex items-center gap-2 px-3 py-3"
              style={{ borderTop: "1px solid var(--pulse-border)" }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask Vamshi…"
                maxLength={2000}
                className="min-w-0 flex-1 rounded-full border border-[var(--pulse-border)] bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-50"
                style={{ background: "var(--pulse-violet)", color: "#0a0a14" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="px-3 pb-2 text-center text-[11px] text-muted">
              AI can make mistakes. Please re-verify facts.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm"
          style={{ background: "var(--pulse-violet)", color: "#0a0a14" }}
        >
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <Avatar size={28} />
      <div className="max-w-[82%]">
        <div
          className="whitespace-pre-wrap rounded-2xl rounded-tl-md px-3.5 py-2 text-sm leading-relaxed"
          style={{ background: "var(--pulse-surface-strong)", color: "var(--pulse-text)" }}
        >
          {message.content}
        </div>
        {message.flagged ? (
          <p className="mt-1 pl-1 text-[11px] text-muted">Vamshi is checking with the team…</p>
        ) : null}
      </div>
    </div>
  );
}

export default VamshiChat;
