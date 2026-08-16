"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  BookOpen,
  Sparkles,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Database,
} from "lucide-react";

interface FaqItem {
  id?: string;
  topic?: string | null;
  question: string;
  answer: string;
  source?: "seed" | "manual" | "human_resolved";
}

interface FaqResponse {
  seedFaqs: FaqItem[];
  workshopFaqs: FaqItem[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function KnowledgeBasePanel({ workshopId }: { workshopId: string }) {
  const { data, mutate } = useSWR<FaqResponse>(
    `/api/workshops/${workshopId}/faqs`,
    fetcher,
    { refreshInterval: 6000 },
  );

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "core">("all");

  // New FAQ form state
  const [adding, setAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const seedFaqs = data?.seedFaqs ?? [];
  const workshopFaqs = data?.workshopFaqs ?? [];

  const combinedFaqs: (FaqItem & { isCustom: boolean })[] = [
    ...workshopFaqs.map((f) => ({ ...f, isCustom: true })),
    ...seedFaqs.map((f, i) => ({ ...f, id: `seed-${i}`, isCustom: false })),
  ];

  const filtered = combinedFaqs.filter((f) => {
    if (activeTab === "custom" && !f.isCustom) return false;
    if (activeTab === "core" && f.isCustom) return false;
    const q = search.toLowerCase();
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      (f.topic && f.topic.toLowerCase().includes(q))
    );
  });

  async function handleCreateFaq() {
    if (!newQuestion.trim() || !newAnswer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          topic: newTopic.trim() || "general",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNewQuestion("");
      setNewAnswer("");
      setNewTopic("");
      setAdding(false);
      await mutate();
    } catch {
      alert("Failed to add FAQ to knowledge base");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editQuestion.trim() || !editAnswer.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id,
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          topic: editTopic.trim() || "general",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      await mutate();
    } catch {
      alert("Failed to update FAQ");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteFaq(id: string) {
    if (!confirm("Are you sure you want to delete this custom knowledge base entry?")) return;
    try {
      const res = await fetch(`/api/workshops/${workshopId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await mutate();
    } catch {
      alert("Failed to delete FAQ");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="pulse-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
            <BookOpen className="h-4 w-4 text-purple-400" />
            Vamshi.AI Knowledge Base
          </h2>
          <p className="mt-1 text-xs text-muted">
            {combinedFaqs.length} active knowledge entries ({workshopFaqs.length} workshop-trained,{" "}
            {seedFaqs.length} core playbook doctrines).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="pulse-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Custom Knowledge / FAQ
        </button>
      </div>

      {/* Add New FAQ Drawer/Form */}
      {adding ? (
        <div className="pulse-card border-2 border-purple-500/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
              Teach Vamshi.AI New Knowledge
            </h3>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted">Topic / Category (Optional)</label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Queen Pineapple, Local Logistics, Grant Timing"
                className="mt-1 w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">Question / Intent</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What founders will ask… (e.g. How do I get government price preference in Tripura?)"
                className="mt-1 w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">Vamshi.AI Answer Doctrine</label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
                placeholder="The exact response Vamshi.AI should provide (include 1 concrete next step)…"
                className="mt-1 w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFaq}
                disabled={!newQuestion.trim() || !newAnswer.trim() || submitting}
                className="pulse-btn px-4 py-2 text-xs font-bold disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save to Knowledge Base"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--pulse-border)] bg-[var(--pulse-surface)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-purple-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            All ({combinedFaqs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "custom"
                ? "bg-purple-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Live Trained ({workshopFaqs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("core")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "core"
                ? "bg-purple-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Core Doctrines ({seedFaqs.length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords…"
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Knowledge Base Entries List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="pulse-card p-8 text-center text-xs text-muted">
            No knowledge base entries matching &quot;{search}&quot;.
          </div>
        ) : (
          filtered.map((item, index) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id || index}
                className={`pulse-card flex flex-col p-4 transition-all ${
                  item.isCustom ? "border-purple-500/40 bg-purple-500/5" : ""
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted">Category</label>
                      <input
                        type="text"
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-purple-500 bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted">Question</label>
                      <input
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-purple-500 bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted">Answer Doctrine</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-purple-500 bg-background p-2 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id!)}
                        disabled={savingEdit || !editQuestion.trim() || !editAnswer.trim()}
                        className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {savingEdit ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.isCustom
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {item.isCustom ? "Workshop Trained" : "Core Doctrine"}
                        </span>
                        {item.topic ? (
                          <span className="rounded-full bg-[var(--pulse-surface-strong)] px-2 py-0.5 text-[10px] font-medium text-muted">
                            #{item.topic}
                          </span>
                        ) : null}
                      </div>

                      {item.isCustom && item.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id!);
                              setEditQuestion(item.question);
                              setEditAnswer(item.answer);
                              setEditTopic(item.topic || "");
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:underline"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(item.id!)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-xs font-bold text-foreground">
                      Q: {item.question}
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
