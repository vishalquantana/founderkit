/**
 * Instant route-loading skeleton for admin/presenter pages under
 * `app/(admin)/*`. Next.js renders this immediately on navigation (via
 * `loading.tsx`) while the server component streams in, so navigating into
 * a workshop or the dashboard gets instant visual feedback instead of a
 * blank pause.
 *
 * Theme-aware (uses Pulse design tokens), full-width to match the admin
 * shell's max-width container: a header bar followed by a couple of
 * shimmering card blocks.
 */
export function AdminLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 sm:p-10"
      aria-hidden="true"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="shimmer h-3 w-32 rounded-full bg-surface" />
          <div className="shimmer h-7 w-56 rounded-lg bg-surface" />
          <div className="shimmer h-4 w-72 rounded-lg bg-surface" />
        </div>
        <div className="shimmer h-9 w-24 rounded-full bg-surface" />
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="shimmer h-32 w-full rounded-2xl bg-surface" />
        <div className="shimmer h-32 w-full rounded-2xl bg-surface" />
        <div className="shimmer h-32 w-full rounded-2xl bg-surface" />
      </div>
    </main>
  );
}

export default AdminLoading;
