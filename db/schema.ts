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

export const growthPlans = sqliteTable("growth_plans", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id).unique(),
  primaryChannel: text("primary_channel").notNull(),
  targetSegment: text("target_segment").notNull(),
  conversionGoal: text("conversion_goal").notNull(),
  successMetric30Day: text("success_metric_30_day").notNull(),
  biggestRisk: text("biggest_risk").notNull(),
  lowHangingOpportunity: text("low_hanging_opportunity").notNull(),
  topChannels: text("top_channels", { mode: "json" }).$type<string[]>().notNull(),
  plan30Day: text("plan_30_day", { mode: "json" }).$type<string[]>().notNull(),
  plan60Day: text("plan_60_day", { mode: "json" }).$type<string[]>().notNull(),
  plan90Day: text("plan_90_day", { mode: "json" }).$type<string[]>().notNull(),
  metricsToTrack: text("metrics_to_track", { mode: "json" }).$type<string[]>().notNull(),
  outreachScript: text("outreach_script").notNull(),
  avoidOverbuildingRec: text("avoid_overbuilding_rec").notNull(),
  checkedTasks: text("checked_tasks", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  aiRaw: text("ai_raw", { mode: "json" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const feedbackSubmissions = sqliteTable("feedback_submissions", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id).unique(),
  q1Usefulness: text("q1_usefulness").notNull(),
  q2MostValuable: text("q2_most_valuable").notNull(),
  q3IdentifiedAssumptions: text("q3_identified_assumptions").notNull(),
  q4AiToolUsefulness: text("q4_ai_tool_usefulness").notNull(),
  q5Next7DaysAction: text("q5_next_7_days_action").notNull(),
  q6Suggestions: text("q6_suggestions"),
  q7FollowupInterest: text("q7_followup_interest").notNull(),
  q7ContactInfo: text("q7_contact_info"),
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
}, (table) => ({
  faqsGlobalQuestionIdx: uniqueIndex("faqs_global_question_idx").on(table.question).where(sql`workshop_id IS NULL`),
}));

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
