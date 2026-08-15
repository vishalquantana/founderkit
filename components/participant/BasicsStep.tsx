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
  contact: string;
  sector: string;
  stage: string;
  teamSize: string;
  productType: string;
  businessModel: string;
  consentFollowup: boolean;
}

export interface BasicsStepProps {
  onSubmit: (values: BasicsValues) => void;
  submitting?: boolean;
}

const EMPTY: BasicsValues = {
  founderName: "",
  startupName: "",
  contact: "",
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

  const isValid =
    values.founderName.trim().length > 0 &&
    values.startupName.trim().length > 0 &&
    values.contact.trim().length > 0;

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
        <h1 className="text-xl font-semibold text-slate-800">Let&apos;s start with the basics</h1>
        <p className="text-sm text-slate-500">A little about you and your startup.</p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Your name</span>
          <input
            type="text"
            value={values.founderName}
            onChange={(e) => update("founderName", e.target.value)}
            placeholder="e.g. Asha Rao"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {touched && !values.founderName.trim() && (
            <span className="text-xs text-rose-500">This field is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Startup name</span>
          <input
            type="text"
            value={values.startupName}
            onChange={(e) => update("startupName", e.target.value)}
            placeholder="e.g. KiranaConnect"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {touched && !values.startupName.trim() && (
            <span className="text-xs text-rose-500">This field is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Phone or email</span>
          <input
            type="text"
            value={values.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="So we can send your snapshot"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          {touched && !values.contact.trim() && (
            <span className="text-xs text-rose-500">This field is required.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Sector (optional)</span>
          <input
            type="text"
            value={values.sector}
            onChange={(e) => update("sector", e.target.value)}
            placeholder="e.g. Fintech, EdTech, Retail"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-600">Stage</legend>
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
          <legend className="text-sm font-medium text-slate-600">Product type</legend>
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
          <legend className="text-sm font-medium text-slate-600">Team size</legend>
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
          <legend className="text-sm font-medium text-slate-600">Business model</legend>
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

        <label className="flex items-start gap-3 rounded-xl bg-white/60 p-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={values.consentFollowup}
            onChange={(e) => update("consentFollowup", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
          />
          <span>You can follow up with me about my results or upcoming programs.</span>
        </label>
      </div>

      <motion.button
        type="submit"
        disabled={submitting}
        whileTap={{ scale: 0.97 }}
        className="w-full rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        {submitting ? "Starting…" : "Continue"}
      </motion.button>
    </motion.form>
  );
}

export default BasicsStep;
