export function resultAccessState(input: {
  participant?: { id: string; workshopId: string };
  workshopId?: string;
}): "ok" | "missing" {
  if (!input.participant || !input.workshopId) return "missing";
  return input.participant.workshopId === input.workshopId ? "ok" : "missing";
}
