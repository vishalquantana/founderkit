"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConsentGate } from "@/components/participant/ConsentGate";
import { BasicsStep, type BasicsValues } from "@/components/participant/BasicsStep";
import { startParticipant } from "@/app/(participant)/w/[code]/actions";

export interface WizardWorkshop {
  id: string;
  joinCode: string;
  name: string;
  consentText: string;
  probeEnabled: boolean;
}

export interface ParticipantWizardProps {
  workshop: WizardWorkshop;
}

type Step = "consent" | "basics";

/**
 * The founder signup flow: consent -> basics -> redirect to the dashboard.
 * The 6-section Lean Canvas questionnaire lives at /w/[code]/canvas/[pid]
 * (see CanvasWizard) and is unlocked separately by the presenter.
 */
export function ParticipantWizard({ workshop }: ParticipantWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("consent");
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const STORAGE_KEY = `mrs-progress-${workshop.joinCode}`;

  // If we already have a participant recorded locally, resume straight to
  // their dashboard rather than showing the signup form again.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { participantId?: string };
        if (s.participantId) {
          router.replace(`/w/${workshop.joinCode}/home/${s.participantId}`);
          return;
        }
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  async function handleBasicsSubmit(values: BasicsValues) {
    setSubmitting(true);
    try {
      const { participantId: id } = await startParticipant({
        workshopId: workshop.id,
        founderName: values.founderName,
        startupName: values.startupName,
        contact: values.email,
        mobile: values.mobile || undefined,
        sector: values.sector || undefined,
        stage: values.stage || undefined,
        teamSize: values.teamSize || undefined,
        productType: values.productType || undefined,
        businessModel: values.businessModel || undefined,
        consentFollowup: values.consentFollowup,
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ participantId: id }));
      } catch {
        /* storage full / unavailable — non-fatal */
      }
      router.push(`/w/${workshop.joinCode}/home/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  if (step === "consent") {
    return <ConsentGate consentText={workshop.consentText} onStart={() => setStep("basics")} />;
  }

  return <BasicsStep onSubmit={handleBasicsSubmit} submitting={submitting} />;
}

export default ParticipantWizard;
