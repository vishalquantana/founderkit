"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Home, LayoutDashboard, BarChart3 } from "lucide-react";

export interface FounderTabBarProps {
  code: string;
  pid: string;
  active: "home" | "canvas" | "polls";
  canvasUnlocked?: boolean;
  hasResult?: boolean;
}

/** Shrink to icons-only while scrolling down; expand to full size (icons +
 * labels) when scrolling up or near the top. */
function useCondensedOnScroll(): boolean {
  const [condensed, setCondensed] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      if (y < 48) setCondensed(false);
      else if (y > lastY + 6) setCondensed(true);
      else if (y < lastY - 6) setCondensed(false);
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return condensed;
}

interface TabProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  condensed: boolean;
  disabled?: boolean;
  href?: string;
}

function Tab({ icon, label, isActive, condensed, disabled, href }: TabProps) {
  const className = `flex flex-col items-center gap-0.5 text-[10px] transition-transform active:scale-95 ${
    disabled ? "text-muted opacity-50" : isActive ? "font-semibold" : "text-muted"
  }`;
  const style = isActive && !disabled ? { color: "var(--pulse-kicker)" } : undefined;
  const content = (
    <>
      <span aria-hidden className={condensed ? "flex h-5 w-5 items-center justify-center" : "flex h-6 w-6 items-center justify-center"}>
        {icon}
      </span>
      {!condensed && <span>{label}</span>}
    </>
  );
  if (disabled || !href) {
    return (
      <span className={className} aria-label={condensed ? label : undefined}>
        {content}
      </span>
    );
  }
  return (
    <Link href={href} className={className} style={style} aria-label={condensed ? label : undefined}>
      {content}
    </Link>
  );
}

/**
 * The founder's fixed bottom tab bar (Home / Canvas / Polls), shared across
 * founder pages. Condenses to icons-only on scroll-down, expands on scroll-up.
 */
export function FounderTabBar({ code, pid, active, canvasUnlocked, hasResult }: FounderTabBarProps) {
  const condensed = useCondensedOnScroll();
  const canvasHref = hasResult
    ? `/w/${code}/result/${pid}`
    : canvasUnlocked
      ? `/w/${code}/canvas/${pid}`
      : undefined;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 backdrop-blur-md transition-[padding] duration-200 ${
        condensed ? "py-1.5" : "py-3"
      }`}
      style={{
        background: "color-mix(in srgb, var(--background) 88%, transparent)",
        borderColor: "var(--pulse-border)",
      }}
    >
      <Tab
        icon={<Home className="h-full w-full" />}
        label="Home"
        isActive={active === "home"}
        condensed={condensed}
        href={`/w/${code}/home/${pid}`}
      />
      <Tab
        icon={<LayoutDashboard className="h-full w-full" />}
        label="Canvas"
        isActive={active === "canvas"}
        condensed={condensed}
        href={canvasHref}
        disabled={!canvasHref}
      />
      <Tab
        icon={<BarChart3 className="h-full w-full" />}
        label="Polls"
        isActive={active === "polls"}
        condensed={condensed}
        href={`/w/${code}/polls/${pid}`}
      />
    </nav>
  );
}

export default FounderTabBar;
