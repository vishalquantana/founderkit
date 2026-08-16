import type { ReactNode } from "react";
import { MotionConfig } from "@/components/motion/MotionConfig";
import { FontSizeControl } from "@/components/FontSizeControl";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfig>
      <div className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10 text-[#ECEAF6]">
          {children}
        </div>
        <FontSizeControl />
      </div>
    </MotionConfig>
  );
}
