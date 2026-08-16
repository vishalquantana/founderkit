/**
 * Instant route-loading skeleton for founder-facing pages under
 * `app/(participant)/w/[code]/*`. Next.js renders this immediately on
 * navigation (via `loading.tsx`) while the server component streams in, so a
 * tap on any nav link gets instant visual feedback instead of feeling dead.
 *
 * Theme-aware (uses Pulse design tokens) and phone-width by default;
 * roughly mirrors the shape of a founder page: a title bar, then a couple
 * of content cards.
 */
export function FounderLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col gap-6 px-4 py-8" aria-hidden="true">
      <div className="flex flex-col gap-3">
        <div className="shimmer h-3 w-24 rounded-full bg-surface" />
        <div className="shimmer h-7 w-3/4 rounded-lg bg-surface" />
        <div className="shimmer h-4 w-1/2 rounded-lg bg-surface" />
      </div>

      <div className="shimmer h-32 w-full rounded-2xl bg-surface" />

      <div className="flex flex-col gap-3">
        <div className="shimmer h-4 w-1/3 rounded-lg bg-surface" />
        <div className="shimmer h-20 w-full rounded-2xl bg-surface" />
        <div className="shimmer h-20 w-full rounded-2xl bg-surface" />
      </div>
    </div>
  );
}

export default FounderLoading;
