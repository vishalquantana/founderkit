export function workshopJoinState(status: string | undefined): "open" | "closed" | "missing" {
  if (status === undefined) return "missing";
  if (status === "closed") return "closed";
  return "open";
}
