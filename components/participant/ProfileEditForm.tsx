"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Chip } from "@/components/motion/Chip";
import {
  STAGE_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
} from "@/lib/options";
import { updateParticipantProfile } from "@/app/(participant)/w/[code]/actions";

export interface ProfileEditFormValues {
  founderName: string;
  startupName: string;
  sector: string;
  stage: string;
  teamSize: string;
  productType: string;
  businessModel: string;
}

export interface ProfileEditFormProps {
  pid: string;
  initial: ProfileEditFormValues;
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * Compact inline edit form for the founder's profile card. Mirrors the field
 * set from BasicsStep (name, startup, sector, stage, team size, product
 * type, business model) but keeps everything on one condensed surface.
 */
export function ProfileEditForm({ pid, initial, onSaved, onCancel }: ProfileEditFormProps) {
  const [values, setValues] = useState<ProfileEditFormValues>(initial);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = values.founderName.trim().length > 0 && values.startupName.trim().length > 0;

  function update<K extends keyof ProfileEditFormValues>(key: K, value: ProfileEditFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!isValid) return;

    startTransition(async () => {
      try {
        await updateParticipantProfile({
          participantId: pid,
          founderName: values.founderName,
          startupName: values.startupName,
          sector: values.sector,
          stage: values.stage,
          teamSize: values.teamSize,
          productType: values.productType,
          businessModel: values.businessModel,
        });
        onSaved();
      } catch {
        setError("Couldn't save your changes. Please try again.");
      }
    });
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="mt-3 flex flex-col gap-3 overflow-hidden"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Your name</span>
        <input
          type="text"
          value={values.founderName}
          onChange={(e) => update("founderName", e.target.value)}
          placeholder="e.g. Asha Rao"
          className="pulse-input w-full px-3 py-2.5 text-sm outline-none"
        />
        {touched && !values.founderName.trim() && (
          <span className="text-xs text-rose-400">This field is required.</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Startup name</span>
        <input
          type="text"
          value={values.startupName}
          onChange={(e) => update("startupName", e.target.value)}
          placeholder="e.g. KiranaConnect"
          className="pulse-input w-full px-3 py-2.5 text-sm outline-none"
        />
        {touched && !values.startupName.trim() && (
          <span className="text-xs text-rose-400">This field is required.</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Sector (optional)</span>
        <input
          type="text"
          value={values.sector}
          onChange={(e) => update("sector", e.target.value)}
          placeholder="e.g. Fintech, EdTech, Retail"
          className="pulse-input w-full px-3 py-2.5 text-sm outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">Stage</legend>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={values.stage === opt.value}
              onClick={() => update("stage", values.stage === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">Product type</legend>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={values.productType === opt.value}
              onClick={() => update("productType", values.productType === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">Team size</legend>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={values.teamSize === opt.value}
              onClick={() => update("teamSize", values.teamSize === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">Business model</legend>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_MODEL_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={values.businessModel === opt.value}
              onClick={() => update("businessModel", values.businessModel === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {error && <span className="text-xs text-rose-400">{error}</span>}

      <div className="mt-1 flex gap-2">
        <motion.button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          whileTap={{ scale: 0.97 }}
          className="pulse-btn-secondary flex-1 px-4 py-2.5 text-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          disabled={isPending}
          whileTap={{ scale: 0.97 }}
          className="pulse-btn flex-1 px-4 py-2.5 text-sm"
        >
          {isPending ? "Saving…" : "Save"}
        </motion.button>
      </div>
    </motion.form>
  );
}

export default ProfileEditForm;
