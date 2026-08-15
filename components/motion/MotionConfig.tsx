"use client";

import { MotionConfig as FramerMotionConfig } from "motion/react";
import type { ReactNode } from "react";

export interface MotionConfigProps {
  children: ReactNode;
}

/**
 * App-wide motion configuration. Honors the user's OS-level
 * `prefers-reduced-motion` setting via `reducedMotion="user"`.
 */
export function MotionConfig({ children }: MotionConfigProps) {
  return <FramerMotionConfig reducedMotion="user">{children}</FramerMotionConfig>;
}

export default MotionConfig;
