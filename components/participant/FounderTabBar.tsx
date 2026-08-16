import Link from "next/link";

export interface FounderTabBarProps {
  code: string;
  pid: string;
  active: "home" | "canvas" | "polls";
  canvasUnlocked?: boolean;
  hasResult?: boolean;
}

function activeStyle(isActive: boolean): React.CSSProperties {
  return isActive ? { color: "var(--pulse-kicker)" } : {};
}

function activeClassName(isActive: boolean): string {
  return `flex flex-col items-center gap-1 text-[10px] active:scale-95 ${
    isActive ? "font-semibold" : "text-muted"
  }`;
}

/**
 * The founder's fixed bottom tab bar (Home / Canvas / Polls), shared
 * across the founder dashboard and polls page so navigation is consistent.
 * Canvas's enable rules mirror the original inline nav in FounderHome: once
 * results exist it always links to the result page (which now folds the
 * 7-day plan straight into the canvas); before that, Canvas is enabled only
 * when the presenter has unlocked it.
 */
export function FounderTabBar({ code, pid, active, canvasUnlocked, hasResult }: FounderTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 py-3 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--background) 88%, transparent)",
        borderColor: "var(--pulse-border)",
      }}
    >
      <Link
        href={`/w/${code}/home/${pid}`}
        className={activeClassName(active === "home")}
        style={activeStyle(active === "home")}
      >
        <span aria-hidden="true" className="h-6 w-6 text-2xl leading-6">⌂</span>
        Home
      </Link>

      {hasResult ? (
        <Link
          href={`/w/${code}/result/${pid}`}
          className={activeClassName(active === "canvas")}
          style={activeStyle(active === "canvas")}
        >
          <span aria-hidden="true" className="h-6 w-6 text-2xl leading-6">◱</span>
          Canvas
        </Link>
      ) : canvasUnlocked ? (
        <Link
          href={`/w/${code}/canvas/${pid}`}
          className={activeClassName(active === "canvas")}
          style={activeStyle(active === "canvas")}
        >
          <span aria-hidden="true" className="h-6 w-6 text-2xl leading-6">◱</span>
          Canvas
        </Link>
      ) : (
        <span className="flex flex-col items-center gap-1 text-[10px] text-muted opacity-50">
          <span aria-hidden="true" className="h-6 w-6 text-2xl leading-6">◱</span>
          Canvas
        </span>
      )}

      <Link
        href={`/w/${code}/polls/${pid}`}
        className={activeClassName(active === "polls")}
        style={activeStyle(active === "polls")}
      >
        <span aria-hidden="true" className="h-6 w-6 text-2xl leading-6">📊</span>
        Polls
      </Link>
    </nav>
  );
}

export default FounderTabBar;
