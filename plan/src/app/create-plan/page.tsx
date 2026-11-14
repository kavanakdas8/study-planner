"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseSelectionPage } from "@/components/landing/CourseSelectionPage";
import { OnboardingSelection, StudyPlan, SavedPlan } from "@/types/study";
import {
  STORAGE_KEY_PLANS,
  STORAGE_KEY_ACTIVE_ID,
  STORAGE_KEY_ONBOARDING,
  normalizePlanToCurriculum,
} from "@/lib/curriculumAdapter";
import { playChime } from "@/lib/utils";

export default function CreatePlanRoute() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [initialSelection] = useState<OnboardingSelection | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ONBOARDING);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleStartLearning = async (selection: OnboardingSelection) => {
    setIsGenerating(true);
    setGenerationError(null);
    playChime("click");

    const dailyHours = Number((selection.dailyMinutes / 60).toFixed(1));
    const payload = {
      topic: selection.subject.trim(),
      timeframe: selection.durationLabel,
      daily_hours: dailyHours,
      experience_level: selection.level || "Beginner",
      goal: `Master ${selection.subject.trim()} (${selection.durationLabel}, ${selection.dailyLabel}/day)`,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.detail ||
            `Server error (${res.status}): Failed to generate curriculum. Ensure the backend is active on port 8000.`
        );
      }

      const planData: StudyPlan = await res.json();
      const newSavedPlan: SavedPlan = {
        ...planData,
        id: `plan_${Date.now()}`,
        createdAt: Date.now(),
        daily_hours: payload.daily_hours,
        experience_level: payload.experience_level,
      };

      const normalized = normalizePlanToCurriculum(newSavedPlan);

      // Persist in localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PLANS);
        const plans: SavedPlan[] = stored ? JSON.parse(stored) : [];
        const updatedPlans = [normalized, ...plans];
        localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updatedPlans));
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, normalized.id);
        localStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(selection));
      } catch (storageErr) {
        console.error("Storage error:", storageErr);
      }

      playChime("complete");
      router.push("/");
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
      initialSelection={initialSelection}
      isGenerating={isGenerating}
      generationError={generationError}
    />
  );
}
