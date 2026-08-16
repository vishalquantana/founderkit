"use client";

import { useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { createWorkshopAction } from "@/app/(admin)/dashboard/actions";

export function CreateWorkshopForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createWorkshopAction(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create workshop.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="pulse-card flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-muted">
          New workshop name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Founders Sprint — August"
          className="pulse-input w-full px-3 py-2 text-sm outline-none"
        />
      </div>
      <motion.button
        type="submit"
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        whileHover={isPending ? undefined : { scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="pulse-btn inline-flex items-center justify-center px-4 py-2 text-sm disabled:cursor-not-allowed"
      >
        {isPending ? "Creating…" : "Create workshop"}
      </motion.button>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-400 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

export default CreateWorkshopForm;
