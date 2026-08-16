"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Chip } from "@/components/motion/Chip";
import {
  STAGE_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
} from "@/lib/options";

export interface BasicsValues {
  founderName: string;
  startupName: string;
  email: string;
  mobile: string;
  sector: string;
  stage: string;
  teamSize: string;
  productType: string;
  businessModel: string;
  consentFollowup: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BasicsStepProps {
  onSubmit: (values: BasicsValues) => void;
  submitting?: boolean;
}

const EMPTY: BasicsValues = {
  founderName: "",
  startupName: "",
  email: "",
  mobile: "",
  sector: "",
  stage: "",
  teamSize: "",
  productType: "",
  businessModel: "",
  consentFollowup: false,
};

/**
 * First step of the wizard: who you are and a few quick classifiers.
 * Only founder name, startup name, and contact are required —
 * everything else is optional context that helps the facilitator.
 */
export function BasicsStep({ onSubmit, submitting }: BasicsStepProps) {
  const [values, setValues] = useState<BasicsValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  const emailValid = EMAIL_RE.test(values.email.trim());
  const isValid =
    values.founderName.trim().length > 0 &&
    values.startupName.trim().length > 0 &&
    emailValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(values);
  }

  function update<K extends keyof BasicsValues>(key: K, value: BasicsValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="flex flex-1 flex-col gap-6"
    >
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-[#ECEAF6]">Let&apos;s start with the basics</h1>
        <p className="text-sm text-[#A9A9C9]">A little about you and your startup.</p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#A9A9C9]">Your name</span>
          <input
            type="text"
            value={values.founderName}
            onChange={(e) => update("founderName", e.target.value)}
            placeholder="e.g. Asha Rao"
            className="pulse-input w-full px-4 py-3 text-sm outline-none"
          />
          {touched && !values.founderName.trim() && (
            <span className="text-xs text-rose-400">This field is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#A9A9C9]">Startup name</span>
          <input
            type="text"
            value={values.startupName}
            onChange={(e) => update("startupName", e.target.value)}
            placeholder="e.g. KiranaConnect"
            className="pulse-input w-full px-4 py-3 text-sm outline-none"
          />
          {touched && !values.startupName.trim() && (
            <span className="text-xs text-rose-400">This field is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#A9A9C9]">Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="So we can send your snapshot"
            className="pulse-input w-full px-4 py-3 text-sm outline-none"
          />
          {touched && !emailValid && (
            <span className="text-xs text-rose-400">A valid email is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#A9A9C9]">Mobile (optional)</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            placeholder="+91…"
            className="pulse-input w-full px-4 py-3 text-sm outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#A9A9C9]">Sector (optional)</span>
          <input
            type="text"
            value={values.sector}
            onChange={(e) => update("sector", e.target.value)}
            placeholder="e.g. Fintech, EdTech, Retail"
            className="pulse-input w-full px-4 py-3 text-sm outline-none"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-[#A9A9C9]">Stage</legend>
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
          <legend className="text-sm font-medium text-[#A9A9C9]">Product type</legend>
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
          <legend className="text-sm font-medium text-[#A9A9C9]">Team size</legend>
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
          <legend className="text-sm font-medium text-[#A9A9C9]">Business model</legend>
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

        <label className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-sm text-[#ECEAF6]">
          <input
            type="checkbox"
            checked={values.consentFollowup}
            onChange={(e) => update("consentFollowup", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-[#8b5cf6] focus:ring-[#8b5cf6]"
          />
          <span>You can follow up with me about my results or upcoming programs.</span>
        </label>
      </div>

      <motion.button
        type="submit"
        disabled={submitting}
        whileTap={{ scale: 0.97 }}
        className="pulse-btn w-full px-5 py-3"
      >
        {submitting ? "Starting…" : "Continue"}
      </motion.button>
    </motion.form>
  );
}

export default BasicsStep;
