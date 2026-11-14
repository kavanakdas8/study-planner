"use client";

import React from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { BackButton } from "@/components/BackButton";
import { OnboardingSelection } from "@/types/study";
import { CourseSelection } from "./CourseSelection";

interface CourseSelectionPageProps {
  onStartLearning: (selection: OnboardingSelection) => void;
  onBackToLanding?: () => void;
  initialSelection?: OnboardingSelection | null;
  isGenerating?: boolean;
  generationError?: string | null;
}

export function CourseSelectionPage({
  onStartLearning,
  onBackToLanding,
  initialSelection,
  isGenerating = false,
  generationError = null,
}: CourseSelectionPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#ECFDF5] selection:text-[#047857]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton onBack={onBackToLanding} />
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <BrandLogo className="w-9 h-6.5" />
              <span className="font-display text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#059669] transition">
                CuratePlan
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Course Selection Experience */}
      <main className="flex-1 pb-16">
        <CourseSelection
          key={initialSelection?.subject || "new-plan"}
          onStartLearning={onStartLearning}
          initialSelection={initialSelection}
          isGenerating={isGenerating}
          generationError={generationError}
        />
      </main>
    </div>
  );
}

