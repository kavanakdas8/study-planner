"use client";

import React, { useState } from "react";
import { Compass, ArrowUp } from "lucide-react";
import { SavedPlan } from "@/types/study";

interface ConversationalLandingProps {
  onStartConversation: (initialPrompt: string) => void;
  savedPlans: SavedPlan[];
  activePlanId: string | null;
  onContinueLearning: (planId?: string) => void;
  completedTasksMap: Record<string, boolean>;
}

const SUGGESTED_PROMPTS = [
  "Learn Python",
  "Master Data Structures & Algorithms",
  "Learn Machine Learning",
  "Build full-stack applications",
  "Prepare for exams",
  "Improve programming skills",
];

export function ConversationalLanding({
  onStartConversation,
  savedPlans,
  activePlanId,
  onContinueLearning,
}: ConversationalLandingProps) {
  const [inputGoal, setInputGoal] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputGoal.trim();
    if (!trimmed) return;
    onStartConversation(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    onStartConversation(prompt);
  };

  const activePlan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0] || null;
  const hasExistingPlans = savedPlans.length > 0;

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#0f172a] flex flex-col justify-between relative selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden font-sans">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(16,185,129,0.06), transparent 70%)",
        }}
      />

      {/* Top Header: CuratePlan text and logo at extreme left, Korean text at extreme right */}
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Compass className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            CuratePlan
          </span>
        </div>

        {hasExistingPlans && activePlan && (
          <button
            type="button"
            onClick={() => onContinueLearning(activePlan.id)}
            className="text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
          >
            <span className="truncate max-w-[180px] sm:max-w-[260px]">
              {activePlan.subject}
            </span>
          </button>
        )}
      </header>

      {/* Main Content: Centered ChatGPT-Style Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl w-full mx-auto relative z-10 py-6 sm:py-12">
        {/* Hero Headline & Subtitle */}
        <div className="text-center space-y-2.5 mb-8 max-w-xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            What would you like to learn today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            Tell me your learning goal. I&apos;ll turn it into a personalized roadmap.
          </p>
        </div>

        {/* ChatGPT Iconic Centered Prompt Box */}
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white border border-slate-200/90 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl shadow-sm transition-all duration-200 p-3 sm:p-3.5 relative flex flex-col justify-between gap-3"
          >
            <textarea
              value={inputGoal}
              onChange={(e) => setInputGoal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to learn..."
              rows={2}
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
              autoFocus
            />

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={!inputGoal.trim()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300 text-white flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed shadow-2xs shrink-0"
                title="Submit learning goal"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* Simple Suggestion Chips (clean text, no emojis, no icons) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 hover:text-slate-900 font-medium transition cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
