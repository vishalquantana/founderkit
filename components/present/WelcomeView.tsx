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
export function WelcomeView({ workshopName, joinCode, joinUrl }: WelcomeViewProps) {
  return (
    <div className="present-welcome relative flex flex-col items-center gap-10 py-6 text-center">
      <div aria-hidden="true" className="present-welcome-ring">
        <span className="present-welcome-ring-core" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/quantana-logo.svg"
              alt="Quantana"
              width={180}
              height={40}
              className="h-8 w-auto invert sm:h-10"
              priority
            />
            <span className="border-l border-white/20 pl-3 text-base font-semibold tracking-wide text-[var(--pulse-text-muted)] sm:text-lg">
              AI Cofounder
            </span>
          </div>
          <p className="pulse-kicker text-base tracking-[0.4em] sm:text-lg">Welcome to</p>
          <h1 className="font-display max-w-4xl text-4xl font-black leading-tight tracking-tight text-balance sm:text-6xl">
            {workshopName}
          </h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="pulse-kicker text-sm tracking-[0.4em] sm:text-base">Join the room</p>
          <div className="rounded-lg bg-white p-2">
            <QRCodeSVG value={joinUrl} size={160} level="M" />
          </div>
          <span className="font-display text-gradient text-[5.5rem] font-black leading-none tracking-[0.28em] sm:text-[8rem]">
            {joinCode}
          </span>
          <p className="text-2xl font-medium text-[var(--pulse-text-muted)] sm:text-3xl">{joinUrl}</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeView;
