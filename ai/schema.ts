import { z } from "zod";

export const EvaluationResultSchema = z.object({
  backendScore: z.number().int().min(0).max(100),
  dimensionScores: z.object({
    problemClarity: z.number().int().min(0).max(15),
    customerClarity: z.number().int().min(0).max(15),
    valuePayment: z.number().int().min(0).max(20),
    mvpQuality: z.number().int().min(0).max(15),
    distribution: z.number().int().min(0).max(15),
    validation: z.number().int().min(0).max(10),
    teamStageFit: z.number().int().min(0).max(5),
    cashflow: z.number().int().min(0).max(5),
  }),
  readinessStage: z.enum(["idea_clarity", "discovery_ready", "mvp_candidate", "pilot_ready", "revenue_ready"]),
  summary: z.string(),
  strengths: z.array(z.string()).length(2),
  assumptions: z.array(z.string()).length(2),
  mvpExperiment: z.string(),
  sevenDayPlan: z.array(z.object({ day: z.string(), text: z.string() })).min(1),
  improvedPitch: z.string(),
  reflectionQuestion: z.string(),
  sectionFeedback: z.object({
    problem: z.string(),
    customer: z.string(),
    value: z.string(),
    mvp: z.string(),
    distribution: z.string(),
    proof: z.string(),
  }),
  dimensionJustifications: z
    .object({
      problemClarity: z.string(),
      customerClarity: z.string(),
      valuePayment: z.string(),
      mvpQuality: z.string(),
      distribution: z.string(),
      validation: z.string(),
      teamStageFit: z.string(),
      cashflow: z.string(),
    })
    .optional(),
  sectionRecommendations: z
    .object({
      problem: z.array(z.string()),
      customer: z.array(z.string()),
      value: z.array(z.string()),
      mvp: z.array(z.string()),
      distribution: z.array(z.string()),
      proof: z.array(z.string()),
    })
    .optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
