import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { getResult } from "@/db/queries/results";
import { getParticipantPollAnswers } from "@/db/queries/polls";
import { SECTIONS } from "@/lib/sections";
import { STAGE_META } from "@/lib/readiness";

const MAX_CONTEXT_CHARS = 1500;
const MAX_ANSWER_CHARS = 220;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Builds a compact, plain-text context block describing a single founder for
 * the Vamshi.AI chat prompt: their startup metadata, Lean Canvas / questionnaire
 * answers, any free-text canvas extras, and their readiness result summary if
 * one exists yet.
 *
 * Data-leakage constraint: this reads only the ONE participant identified by
 * `participantId` — never any other founder's data. Returns "" if the
 * participant doesn't exist or has no data to show yet.
 */
export async function buildFounderContext(participantId: string): Promise<string> {
  const participant = await getParticipant(participantId);
  if (!participant) return "";

  const lines: string[] = [];
  lines.push(`Founder: ${participant.founderName} · Startup: ${participant.startupName}`);

  const meta = [
    participant.sector && `Sector: ${participant.sector}`,
    participant.stage && `Stage: ${participant.stage}`,
    participant.teamSize && `Team size: ${participant.teamSize}`,
    participant.productType && `Product: ${participant.productType}`,
    participant.businessModel && `Business model: ${participant.businessModel}`,
  ].filter((v): v is string => Boolean(v));
  if (meta.length > 0) lines.push(meta.join(" | "));

  const responses = await getResponses(participantId);
  if (responses.length > 0) {
    const canvasLines: string[] = [];
    for (const section of SECTIONS) {
      const response = responses.find((r) => r.section === section.key);
      if (response?.mainAnswer?.trim()) {
        canvasLines.push(`- ${section.heading}: ${truncate(response.mainAnswer, MAX_ANSWER_CHARS)}`);
      }
    }
    if (canvasLines.length > 0) {
      lines.push("", "Canvas answers:", ...canvasLines);
    }
  }

  const extras = participant.canvasExtras;
  if (extras && Object.keys(extras).length > 0) {
    lines.push(
      "",
      "Extra canvas notes:",
      ...Object.entries(extras).map(([key, value]) => `- ${key}: ${truncate(value, MAX_ANSWER_CHARS)}`),
    );
  }

  const result = await getResult(participantId);
  if (result) {
    const stageLabel = STAGE_META[result.readinessStage]?.label ?? result.readinessStage;
    lines.push(
      "",
      "Readiness result:",
      `Stage: ${stageLabel} (score ${result.backendScore}/100)`,
      `Summary: ${truncate(result.summary, MAX_ANSWER_CHARS)}`,
    );
  }

  const pollAnswers = await getParticipantPollAnswers(participantId, participant.workshopId);
  if (pollAnswers.length > 0) {
    lines.push(
      "",
      "Poll answers:",
      ...pollAnswers.map((p) => `- ${truncate(p.question, 120)} → ${p.answer}`),
    );
  }

  const block = lines.join("\n").trim();
  if (block.length === 0) return "";
  return block.length > MAX_CONTEXT_CHARS ? `${block.slice(0, MAX_CONTEXT_CHARS - 1).trimEnd()}…` : block;
}
