import type { ReactNode } from "react";
import { MotionConfig } from "@/components/motion/MotionConfig";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfig>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/60 to-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
          {children}
        </div>
      </div>
    </MotionConfig>
  );
}
