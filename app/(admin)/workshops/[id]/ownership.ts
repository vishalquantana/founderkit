/**
 * Access gate for workshop admin/presenter surfaces. Every user in this app
 * is an admin, and admins share access to ALL workshops — so access is
 * granted to any authenticated user for any existing workshop. (Kept named
 * `assertOwnership` so its many call sites stay unchanged; `ownerId` is
 * retained on the record for creation/attribution, not access control.)
 */
export function assertOwnership(
  userId: string | undefined,
  workshop?: { ownerId: string },
): boolean {
  return !!userId && !!workshop;
}
