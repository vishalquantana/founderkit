"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionStep } from "@/components/participant/SectionStep";
import { AnalyzingScreen } from "@/components/participant/AnalyzingScreen";
import { ProgressBar } from "@/components/motion/ProgressBar";
import { StepTransition } from "@/components/motion/StepTransition";
import { SECTIONS } from "@/lib/sections";
import { saveSectionAnswer, finishParticipant } from "@/app/(participant)/w/[code]/actions";
import type { SectionKey } from "@/db/schema";

export interface CanvasWizardWorkshop {
  joinCode: string;
  probeEnabled: boolean;
}

export interface CanvasWizardProps {
  workshop: CanvasWizardWorkshop;
  participantId: string;
  initialAnswers?: Partial<Record<SectionKey, string>>;
}

/**
 * The 6-section Lean Canvas questionnaire, extracted from ParticipantWizard.
 * Each section autosaves on blur and persists again on "Next"/"Finish"; on
 * the last section it marks the participant complete and returns them to
 * their dashboard.
 */
export function CanvasWizard({ workshop, participantId, initialAnswers }: CanvasWizardProps) {
  const router = useRouter();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [finishing, setFinishing] = useState(false);

  function handleAutosave(sectionKey: (typeof SECTIONS)[number]["key"], value: string) {
    setAnswers((a) => ({ ...a, [sectionKey]: value }));
    void saveSectionAnswer({ participantId, section: sectionKey, mainAnswer: value });
  }

  // The main answer (and, if the coach probes, the follow-up Q&A) is
  // already persisted by SectionStep before this fires — this only moves
  // the step machine forward (or finishes the wizard).
  async function handleSectionAdvance(index: number, value: string) {
    const section = SECTIONS[index];
    setAnswers((a) => ({ ...a, [section.key]: value }));

    const isLast = index === SECTIONS.length - 1;
    if (isLast) {
      setFinishing(true);
      try {
        await finishParticipant(participantId);
      } finally {
        router.push(`/w/${workshop.joinCode}/home/${participantId}`);
      }
      return;
    }
    setSectionIndex(index + 1);
  }

  const section = SECTIONS[sectionIndex];

  if (finishing) {
    return <AnalyzingScreen />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ProgressBar current={section.step} total={SECTIONS.length} />
      <StepTransition stepKey={section.key} direction="forward" className="flex flex-1 flex-col">
        <SectionStep
          section={section}
          initialValue={answers[section.key]}
          isLast={sectionIndex === SECTIONS.length - 1}
          participantId={participantId}
          probeEnabled={workshop.probeEnabled}
          onAdvance={(value) => handleSectionAdvance(sectionIndex, value)}
          onAutosave={(value) => handleAutosave(section.key, value)}
        />
      </StepTransition>
    </div>
  );
}

export default CanvasWizard;
