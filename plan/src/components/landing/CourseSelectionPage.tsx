"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { OnboardingSelection } from "@/types/study";
import { CourseSelection } from "./CourseSelection";

interface CourseSelectionPageProps {
  onStartLearning: (selection: OnboardingSelection) => void;
  onBackToLanding: () => void;
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
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <BrandLogo className="w-9 h-6.5" />
            <span className="font-display text-lg font-bold text-[#0F172A] tracking-tight">
              CuratePlan
            </span>
          </button>
        </div>
      </header>

      {/* Back button < on left below logo */}
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pt-5 -mb-6">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A] hover:text-[#059669] shadow-2xs transition cursor-pointer"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Course Selection Experience */}
      <main className="flex-1 pb-16">
        <CourseSelection
          onStartLearning={onStartLearning}
          initialSelection={initialSelection}
          isGenerating={isGenerating}
          generationError={generationError}
        />
      </main>
    </div>
  );
}

