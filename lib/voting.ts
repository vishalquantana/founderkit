/** Has this poll id already been answered or skipped by the current voter? */
export function hasVoted(votedIds: string[], pollId: string): boolean {
  return votedIds.includes(pollId);
}
