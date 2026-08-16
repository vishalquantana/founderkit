import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export type WorkshopStatus = "draft" | "live" | "closed";
export type SectionKey =
  | "problem" | "customer" | "value" | "mvp" | "distribution" | "proof";
export type ReadinessStage =
  | "idea_clarity" | "discovery_ready" | "mvp_candidate" | "pilot_ready" | "revenue_ready";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const otpCodes = sqliteTable("otp_codes", {
  id: id(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const workshops = sqliteTable("workshops", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  consentText: text("consent_text").notNull(),
  settings: text("settings", { mode: "json" }).notNull(),
  createdAt: createdAt(),
});

export const participants = sqliteTable("participants", {
  id: id(),
  workshopId: text("workshop_id").notNull().references(() => workshops.id),
  founderName: text("founder_name").notNull(),
  startupName: text("startup_name").notNull(),
  contact: text("contact").notNull(), // email (required)
  mobile: text("mobile"), // optional
  sector: text("sector"),
  stage: text("stage"),
  teamSize: text("team_size"),
  productType: text("product_type"),
  businessModel: text("business_model"),
  consentFollowup: integer("consent_followup", { mode: "boolean" }).notNull().default(false),
  /** Free-text answers for Lean Canvas blocks that aren't backed by a questionnaire section
   *  (e.g. unfairAdvantage, costStructure). Keyed by Lean Canvas block key. */
  canvasExtras: text("canvas_extras", { mode: "json" }).$type<Record<string, string>>(),
  createdAt: createdAt(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  resultEmailedAt: integer("result_emailed_at", { mode: "timestamp" }),
  lockedAt: integer("locked_at", { mode: "timestamp" }),
});

export const responses = sqliteTable("responses", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id),
  section: text("section").notNull(),
  mainAnswer: text("main_answer").notNull(),
  probeQuestion: text("probe_question"),
  probeAnswer: text("probe_answer"),
});

export const results = sqliteTable("results", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id).unique(),
  backendScore: integer("backend_score").notNull(),
  dimensionScores: text("dimension_scores", { mode: "json" }).notNull(),
  readinessStage: text("readiness_stage").notNull(),
  summary: text("summary").notNull(),
  strengths: text("strengths", { mode: "json" }).notNull(),
  assumptions: text("assumptions", { mode: "json" }).notNull(),
  mvpExperiment: text("mvp_experiment").notNull(),
  sevenDayPlan: text("seven_day_plan", { mode: "json" }).notNull(),
  improvedPitch: text("improved_pitch").notNull(),
  reflectionQuestion: text("reflection_question").notNull(),
  sectionFeedback: text("section_feedback", { mode: "json" }).notNull().default("{}"),
  dimensionJustifications: text("dimension_justifications", { mode: "json" }),
  sectionRecommendations: text("section_recommendations", { mode: "json" }),
  aiRaw: text("ai_raw", { mode: "json" }),
  createdAt: createdAt(),
});

export const polls = sqliteTable("polls", {
  id: id(),
  workshopId: text("workshop_id").notNull().references(() => workshops.id),
  question: text("question").notNull(),
  options: text("options", { mode: "json" }).notNull(),
  position: integer("position").notNull(),
  status: text("status").notNull().default("draft"), // "draft" | "active" | "closed"
  createdAt: createdAt(),
});

export const pollVotes = sqliteTable("poll_votes", {
  id: id(),
  pollId: text("poll_id").notNull().references(() => polls.id),
  voterId: text("voter_id").notNull(),
  choiceIndex: integer("choice_index").notNull(),
  createdAt: createdAt(),
}, (table) => ({
  pollVoterIdx: uniqueIndex("poll_votes_poll_id_voter_id_idx").on(table.pollId, table.voterId),
}));

export type Poll = typeof polls.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;

export const chatMessages = sqliteTable("chat_messages", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  intent: text("intent"),
  confidence: integer("confidence"), // 0-100 (int; avoids real-type friction)
  flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
  escalationId: text("escalation_id"),
  createdAt: createdAt(),
});

export const faqs = sqliteTable("faqs", {
  id: id(),
  workshopId: text("workshop_id").references(() => workshops.id), // null = global seed
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  source: text("source").notNull(), // "seed" | "manual" | "human_resolved"
  topic: text("topic"),
  createdAt: createdAt(),
});

export const escalations = sqliteTable("escalations", {
  id: id(),
  workshopId: text("workshop_id").notNull().references(() => workshops.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  questionMessageId: text("question_message_id").notNull().references(() => chatMessages.id),
  question: text("question").notNull(),
  status: text("status").notNull().default("open"), // "open" | "answered"
  presenterReply: text("presenter_reply"),
  answeredBy: text("answered_by").references(() => users.id),
  answeredAt: integer("answered_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type EscalationRow = typeof escalations.$inferSelect;
