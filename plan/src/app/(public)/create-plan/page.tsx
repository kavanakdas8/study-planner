"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseSelectionPage } from "@/components/landing/CourseSelectionPage";
import { OnboardingSelection } from "@/types/study";
import { curriculumStorage } from "@/services/curriculumStorage";
import { generateCurriculumPlan } from "@/services/curriculumApi";
import { playChime } from "@/lib/utils";

export default function CreatePlanRoute() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [initialSelection] = useState<OnboardingSelection | null>(() => {
    return curriculumStorage.getOnboardingSelection();
  });

  const handleStartLearning = async (selection: OnboardingSelection) => {
    setIsGenerating(true);
    setGenerationError(null);
    playChime("click");

    try {
      const newPlan = await generateCurriculumPlan(selection);
      const existingPlans = curriculumStorage.getPlans();
      const updatedPlans = [
        newPlan,
        ...existingPlans.filter((p) => p.id !== newPlan.id),
      ];

      curriculumStorage.savePlans(updatedPlans);
      curriculumStorage.setActivePlanId(newPlan.id);
      curriculumStorage.saveOnboardingSelection(selection);

      playChime("complete");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating your plan.";
      console.error("[CuratePlan] Plan generation failed:", msg);
      setGenerationError(msg);
      playChime("click");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CourseSelectionPage
      onStartLearning={handleStartLearning}
      onBackToLanding={() => router.push("/")}
      initialSelection={initialSelection}
      isGenerating={isGenerating}
      generationError={generationError}
    />
  );
}
