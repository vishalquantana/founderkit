import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

export interface WelcomeViewProps {
  workshopName: string;
  joinCode: string;
  joinUrl: string;
}

/**
 * Idle / "money shot" holding screen for the projector — shown by default
 * while the room fills up. Pure CSS/SVG ambient animation only, no external
 * assets or animation libraries. Freezes under prefers-reduced-motion via
 * the .present-welcome-ring rules in app/globals.css.
 */
export function WelcomeView({ workshopName }: WelcomeViewProps) {
  return (
    <div className="present-welcome relative flex flex-col items-center justify-center gap-10 py-16 text-center">
      <div aria-hidden="true" className="present-welcome-ring">
        <span className="present-welcome-ring-core" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/quantana-logo.svg"
              alt="Quantana"
              width={200}
              height={44}
              className="nav-logo h-10 w-auto sm:h-12"
              priority
            />
            <span
              className="pl-3.5 text-lg font-bold tracking-wide text-[var(--pulse-text-muted)] sm:text-xl"
              style={{ borderLeft: "2px solid var(--pulse-border-strong)" }}
            >
              AI Cofounder
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="pulse-kicker text-lg font-bold tracking-[0.4em] sm:text-xl">Welcome to</p>
            <h1 className="font-display max-w-4xl text-4xl font-black leading-tight tracking-tight text-balance sm:text-5xl md:text-7xl">
              {workshopName}
            </h1>
          </div>

          <p className="max-w-xl text-base text-[var(--pulse-text-muted)] sm:text-lg">
            Build proof before product. Scan the QR code on the right panel to enter your startup and begin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeView;
