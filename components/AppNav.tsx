"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontSizeControl } from "@/components/FontSizeControl";
import { ThemeControl } from "@/components/ThemeControl";

/**
 * Persistent top bar: Quantana wordmark + product name. Theme-aware
 * (uses --pulse-* tokens); sits above all page content — except the
 * full-screen projected Present Mode view, which has its own header.
 */
export function AppNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/present")) return null;

  const segments = pathname?.split("/").filter(Boolean) ?? [];
  // On a founder route: if a participant id is in the path (/w/{code}/{section}/{pid}),
  // send the logo to that founder's home dashboard; otherwise to the workshop join.
  const logoHref =
    segments[0] === "w" && segments[1]
      ? segments[3]
        ? `/w/${segments[1]}/home/${segments[3]}`
        : `/w/${segments[1]}`
      : "/";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--background) 72%, transparent)",
        borderBottom: "1px solid var(--pulse-border)",
      }}
    >
      <Link href={logoHref} className="flex items-center gap-2.5">
        <Image src="/quantana-logo.svg" alt="Quantana" width={82} height={18} className="nav-logo h-4 w-auto" priority />
        <span
          className="border-l pl-2.5 text-xs font-semibold tracking-wide"
          style={{ borderColor: "var(--pulse-border-strong)", color: "var(--pulse-text-muted)" }}
        >
          AI Cofounder
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <FontSizeControl />
        <ThemeControl />
      </div>
    </header>
  );
}

export default AppNav;
