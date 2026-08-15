type NotLiveState = "closed" | "missing";

const COPY: Record<NotLiveState, { title: string; body: string }> = {
  missing: {
    title: "We couldn't find that workshop",
    body: "Double-check the link or QR code with your facilitator — it may have been typed incorrectly.",
  },
  closed: {
    title: "This workshop has wrapped up",
    body: "Thanks for stopping by! This session is no longer accepting new snapshots. Ask your facilitator if another session is planned.",
  },
};

export function NotLive({ state }: { state: NotLiveState }) {
  const { title, body } = COPY[state];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 text-[#f472b6]"
          aria-hidden="true"
        >
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-extrabold tracking-tight text-[#ECEAF6]">{title}</h1>
      <p className="max-w-xs text-sm leading-relaxed text-[#A9A9C9]">{body}</p>
    </main>
  );
}

export default NotLive;
