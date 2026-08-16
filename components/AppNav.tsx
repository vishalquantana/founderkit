"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent top bar: Quantana wordmark + product name. Theme-aware
 * (uses --pulse-* tokens); sits above all page content — except the
 * full-screen projected Present Mode view, which has its own header.
 */
export function AppNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/present")) return null;

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--background) 72%, transparent)",
        borderBottom: "1px solid var(--pulse-border)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/quantana-logo.svg" alt="Quantana" width={82} height={18} className="h-4 w-auto" priority />
        <span
          className="border-l pl-2.5 text-xs font-semibold tracking-wide"
          style={{ borderColor: "var(--pulse-border-strong)", color: "var(--pulse-text-muted)" }}
        >
          AI Cofounder
        </span>
      </Link>
    </header>
  );
}

export default AppNav;
