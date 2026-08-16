"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConsentGate } from "@/components/participant/ConsentGate";
import { BasicsStep, type BasicsValues } from "@/components/participant/BasicsStep";
import { SectionStep } from "@/components/participant/SectionStep";
import { ProgressBar } from "@/components/motion/ProgressBar";
import { StepTransition } from "@/components/motion/StepTransition";
import { SECTIONS } from "@/lib/sections";
import {
  startParticipant,
  saveSectionAnswer,
  finishParticipant,
} from "@/app/(participant)/w/[code]/actions";

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

type Step = "consent" | "basics" | number; // number = SECTIONS index (0-based)

/**
 * The full founder flow: consent -> basics -> six sections -> finish.
 * Keeps a lightweight step machine in component state; each section
 * autosaves on blur and persists again on "Next"/"Finish" so nothing is
 * lost if the participant closes the tab mid-answer.
 */
export function ParticipantWizard({ workshop }: ParticipantWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("consent");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const STORAGE_KEY = `mrs-progress-${workshop.joinCode}`;

  // Restore in-progress state on mount so a refresh / lost connection resumes
  // where the founder left off. The httpOnly mrs_pid cookie survives the refresh
  // too, so autosave stays authorized.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { step?: Step; participantId?: string; answers?: Record<string, string> };
        if (s.participantId) {
          setParticipantId(s.participantId);
          setAnswers(s.answers ?? {});
          setStep(typeof s.step === "number" ? s.step : "basics");
        }
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  // Persist progress whenever it changes (only once we're past basics).
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (participantId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, participantId, answers }));
      }
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [hydrated, step, participantId, answers, STORAGE_KEY]);

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
      setParticipantId(id);
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAutosave(sectionKey: (typeof SECTIONS)[number]["key"], value: string) {
    if (!participantId) return;
    setAnswers((a) => ({ ...a, [sectionKey]: value }));
    void saveSectionAnswer({ participantId, section: sectionKey, mainAnswer: value });
  }

  // The main answer (and, if the coach probes, the follow-up Q&A) is
  // already persisted by SectionStep before this fires — this only moves
  // the step machine forward (or finishes the wizard).
  async function handleSectionAdvance(sectionIndex: number, value: string) {
    if (!participantId) return;
    const section = SECTIONS[sectionIndex];
    setAnswers((a) => ({ ...a, [section.key]: value }));

    const isLast = sectionIndex === SECTIONS.length - 1;
    if (isLast) {
      await finishParticipant(participantId);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/w/${workshop.joinCode}/result/${participantId}`);
      return;
    }
    setStep(sectionIndex + 1);
  }

  if (step === "consent") {
    return <ConsentGate consentText={workshop.consentText} onStart={() => setStep("basics")} />;
  }

  if (step === "basics") {
    return <BasicsStep onSubmit={handleBasicsSubmit} submitting={submitting} />;
  }

  const sectionIndex = step;
  const section = SECTIONS[sectionIndex];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ProgressBar current={section.step} total={SECTIONS.length} />
      <StepTransition stepKey={section.key} direction="forward" className="flex flex-1 flex-col">
        <SectionStep
          section={section}
          initialValue={answers[section.key]}
          isLast={sectionIndex === SECTIONS.length - 1}
          participantId={participantId!}
          probeEnabled={workshop.probeEnabled}
          onAdvance={(value) => handleSectionAdvance(sectionIndex, value)}
          onAutosave={(value) => handleAutosave(section.key, value)}
        />
      </StepTransition>
    </div>
  );
}

export default ParticipantWizard;
