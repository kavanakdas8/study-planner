"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Compass,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { SavedPlan } from "@/types/study";

interface LandingPageProps {
  savedPlans: SavedPlan[];
  activePlan: SavedPlan | null;
  completedTasksMap: Record<string, boolean>;
  onSubmitGoal: (goal: string) => void;
  onContinueLearning: () => void;
  onSelectPlan: (plan: SavedPlan) => void;
}

const SUGGESTED_PROMPTS = [
  "Learn Python from scratch",
  "Master Data Structures and Algorithms",
  "Learn Machine Learning",
  "Become a Full-Stack Developer",
  "Prepare for my semester exams",
  "Learn React and Next.js",
];

export function LandingPage({
  savedPlans,
  activePlan,
  completedTasksMap,
  onSubmitGoal,
  onContinueLearning,
  onSelectPlan,
}: LandingPageProps) {
  const [goal, setGoal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReturningUser = savedPlans.length > 0;

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [goal]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) return;
    onSubmitGoal(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (promptText: string) => {
    setGoal(promptText);
    setTimeout(() => {
      onSubmitGoal(promptText);
    }, 50);
  };

  // Helper to calculate progress for a saved plan
  const getPlanProgress = (plan: SavedPlan) => {
    let total = 0;
    let completed = 0;
    plan.schedule?.forEach((period, pIdx) => {
      period.tasks?.forEach((_, tIdx) => {
        total++;
        if (completedTasksMap[`${plan.id}_${pIdx}_${tIdx}`]) {
          completed++;
        }
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* TOP HEADER */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-base tracking-tight text-slate-900">
              CuratePlan
            </span>
          </div>
        </div>

        {isReturningUser && (
          <button
            type="button"
            onClick={onContinueLearning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs transition border border-emerald-200 cursor-pointer shadow-2xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        )}
      </header>

      {/* MAIN CONVERSATIONAL HERO */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="w-full space-y-8 text-center animate-fade-in">
          {/* HEADLINE & SUBHEAD */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              What would you like to learn today?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              Tell me your learning goal. I&apos;ll turn it into a structured
              roadmap designed around your time, experience, and ambitions.
            </p>
          </div>

          {/* RETURNING USER JUMP-BACK SECTION */}
          {isReturningUser && activePlan && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-left max-w-2xl mx-auto shadow-2xs space-y-3 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-emerald-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Currently Active Curriculum
                </span>
                <span className="font-mono text-slate-400">
                  {activePlan.target_timeframe} • {activePlan.daily_hours}h/day
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {activePlan.subject}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {activePlan.overview}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onContinueLearning}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
                >
                  <span>Continue Learning</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>Curriculum Progress</span>
                  <span className="font-bold text-emerald-700">
                    {getPlanProgress(activePlan)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${getPlanProgress(activePlan)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MAIN PROMPT INPUT BOX */}
          <div className="max-w-2xl mx-auto w-full">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-300 rounded-2xl p-2.5 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all text-left"
            >
              <textarea
                ref={textareaRef}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="I want to learn..."
                rows={1}
                className="w-full px-3 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-100 mt-1">
                <span className="text-[11px] text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">Enter</kbd> to submit, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">Shift+Enter</kbd> for newline
                </span>

                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    goal.trim()
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                  aria-label="Send goal"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* SUGGESTED PROMPT CHIPS */}
          <div className="space-y-2.5 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Popular Learning Paths
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_PROMPTS.map((promptText) => (
                <button
                  type="button"
                  key={promptText}
                  onClick={() => handleChipClick(promptText)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 text-xs font-medium transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span>{promptText}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
          </div>

          {/* RECENTLY ACCESSED CURRICULA (IF RETURNING USER HAS MULTIPLE) */}
          {savedPlans.length > 1 && (
            <div className="pt-6 border-t border-slate-200 max-w-2xl mx-auto text-left space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Your Saved Curricula
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {savedPlans.slice(0, 4).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => onSelectPlan(plan)}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{plan.target_timeframe}</span>
                      <span className="text-emerald-700 font-semibold">
                        {getPlanProgress(plan)}%
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {plan.subject}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/40">
        <span>CuratePlan • Local-first intelligent learning roadmaps • Zero mandatory accounts</span>
      </footer>
    </div>
  );
}
