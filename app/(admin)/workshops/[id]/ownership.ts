export function assertOwnership(
  ownerId: string | undefined,
  workshop?: { ownerId: string },
): boolean {
  return !!ownerId && !!workshop && ownerId === workshop.ownerId;
}
