"use client";
import { useState, type ReactNode, type ButtonHTMLAttributes } from "react";

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onAction: () => Promise<unknown> | unknown;
  children: ReactNode;
  pendingChildren?: ReactNode;
}

/** A button that disables itself the instant it's clicked and stays disabled
 * until its async action resolves — so a slow server round-trip never looks
 * dead and double-taps are impossible. */
export function ActionButton({ onAction, children, pendingChildren, disabled, ...rest }: ActionButtonProps) {
  const [pending, setPending] = useState(false);
  return (
    <button
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          await onAction();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending && pendingChildren ? pendingChildren : children}
    </button>
  );
}
export default ActionButton;
