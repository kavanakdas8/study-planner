"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings2,
  RefreshCw,
  Plus,
  Trash2,
  BookOpen,
  Code2,
  Video,
  X,
  Loader2,
} from "lucide-react";
import { StudyPlan, SavedPlan, OnboardingParams, PeriodSchedule } from "@/types/study";
import { normalizePlanToCurriculum } from "@/lib/curriculumAdapter";

interface CurriculumPreviewProps {
  plan: StudyPlan;
  params: OnboardingParams;
  onStartLearning: (finalPlan: SavedPlan) => void;
  onBackToChat: () => void;
  onRegenerate: (instructions: string) => Promise<void>;
  isRegenerating?: boolean;
}

export function CurriculumPreview({
  plan: initialPlan,
  params,
  onStartLearning,
  onBackToChat,
  onRegenerate,
  isRegenerating = false,
}: CurriculumPreviewProps) {
  const [currentPlan, setCurrentPlan] = useState<StudyPlan>(initialPlan);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({
    0: true, // First module expanded by default
  });

  // Customization modal state
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState("");

  // Edit period state inside customize modal
  const [editingPlan, setEditingPlan] = useState<StudyPlan>(initialPlan);

  // Stats calculation
  const totalPeriods = currentPlan.schedule?.length || 0;
  const totalTasks =
    currentPlan.schedule?.reduce((acc, p) => acc + (p.tasks?.length || 0), 0) || 0;
  const totalMinutes =
    currentPlan.schedule?.reduce(
      (acc, p) =>
        acc +
        (p.tasks?.reduce((tAcc, t) => tAcc + (t.duration_minutes || 0), 0) || 0),
      0
    ) || 0;
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  const toggleExpand = (idx: number) => {
    setExpandedPeriods((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleStart = () => {
    const saved: SavedPlan = {
      ...currentPlan,
      id: `plan_${Date.now()}`,
      createdAt: Date.now(),
      daily_hours: params.daily_hours || 2,
      experience_level: params.experience_level || "Beginner",
    };

    const normalized = normalizePlanToCurriculum(saved);
    onStartLearning(normalized);
  };

  const handleApplyCustomizations = () => {
    setCurrentPlan(editingPlan);
    setIsCustomizeOpen(false);
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenerateInput.trim()) return;
    await onRegenerate(regenerateInput.trim());
    setIsRegenerateOpen(false);
    setRegenerateInput("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      {/* HEADER */}
      <header className="px-4 sm:px-8 py-4 border-b border-[#E2E8F0] bg-white sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToChat}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Back to conversation"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Roadmap Preview
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {currentPlan.subject}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRegenerateOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPlan(JSON.parse(JSON.stringify(currentPlan)));
                setIsCustomizeOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Customize</span>
            </button>

            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN PREVIEW CONTENT */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8 animate-fade-in">
        {/* HERO TITLE & OVERVIEW */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your learning roadmap is ready.
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {currentPlan.overview}
          </p>
        </div>

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Timeframe
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {currentPlan.target_timeframe}
            </div>
            <p className="text-xs text-slate-500">Scheduled duration</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Daily Commitment
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {params.daily_hours || 2} hrs/day
            </div>
            <p className="text-xs text-slate-500">Paced daily schedule</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Curriculum Scope
            </span>
            <div className="text-lg font-bold font-mono text-emerald-700">
              {totalPeriods} modules • {totalTasks} tasks
            </div>
            <p className="text-xs text-slate-500">Sequential milestones</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Estimated Hours
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {totalHours} hrs
            </div>
            <p className="text-xs text-slate-500">{totalMinutes} focused mins</p>
          </div>
        </div>

        {/* CURRICULUM MODULES HIERARCHICAL TREE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Curriculum Modules & Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {totalPeriods} sequential modules
            </span>
          </div>

          <div className="space-y-3">
            {currentPlan.schedule?.map((period, pIdx) => {
              const isExpanded = !!expandedPeriods[pIdx];
              const periodMins =
                period.tasks?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) ||
                0;
              const periodHours = Number((periodMins / 60).toFixed(1));

              return (
                <div
                  key={pIdx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Period Header */}
                  <div
                    onClick={() => toggleExpand(pIdx)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {pIdx + 1}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                            {period.period_label}
                          </h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {period.tasks?.length || 0} tasks
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {period.topic_summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {periodHours} hrs
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Task List */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-2.5">
                      {period.tasks?.map((task, tIdx) => {
                        const Icon =
                          task.resource_type === "Exercise"
                            ? Code2
                            : task.resource_type === "Video"
                            ? Video
                            : BookOpen;

                        return (
                          <div
                            key={tIdx}
                            className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                    {task.title}
                                  </span>
                                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                    {task.resource_type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 sm:self-center font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{task.duration_minutes}m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Ready to begin your study journey?
            </h4>
            <p className="text-xs text-slate-500">
              Loading this curriculum opens the interactive dashboard with the focus timer, analytics, and roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToChat}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Refine in Chat
            </button>

            <button
              type="button"
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs flex items-center gap-2 active:scale-95"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* CUSTOMIZE ROADMAP MODAL */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Customize Roadmap
                </h3>
                <p className="text-xs text-slate-500">
                  Modify module titles, adjust task durations, or reorder curriculum periods.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {editingPlan.schedule?.map((period, pIdx) => (
                <div
                  key={pIdx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={period.period_label}
                      onChange={(e) => {
                        const updated = [...editingPlan.schedule];
                        updated[pIdx].period_label = e.target.value;
                        setEditingPlan({ ...editingPlan, schedule: updated });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingPlan.schedule.filter((_, idx) => idx !== pIdx);
                        setEditingPlan({ ...editingPlan, schedule: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={period.topic_summary}
                    onChange={(e) => {
                      const updated = [...editingPlan.schedule];
                      updated[pIdx].topic_summary = e.target.value;
                      setEditingPlan({ ...editingPlan, schedule: updated });
                    }}
                    placeholder="Module objective"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newPeriod: PeriodSchedule = {
                    period_label: `Module ${editingPlan.schedule.length + 1}`,
                    topic_summary: "New customized curriculum milestone",
                    tasks: [
                      {
                        title: "Hands-on implementation and practice",
                        duration_minutes: 45,
                        description: "Complete practical exercises for this period.",
                        resource_type: "Exercise",
                      },
                    ],
                  };
                  setEditingPlan({
                    ...editingPlan,
                    schedule: [...editingPlan.schedule, newPeriod],
                  });
                }}
                className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomizations}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGENERATE ROADMAP DIALOG */}
      {isRegenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">
                Regenerate Learning Roadmap
              </h3>
              <p className="text-xs text-slate-500">
                Provide instructions to guide the AI in reconstructing your curriculum.
              </p>
            </div>

            <form onSubmit={handleRegenerateSubmit} className="space-y-4">
              <textarea
                value={regenerateInput}
                onChange={(e) => setRegenerateInput(e.target.value)}
                placeholder="e.g. Focus more on building full projects, compress it into 3 weeks, make it intermediate difficulty..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition resize-none"
              />

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegenerateOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!regenerateInput.trim() || isRegenerating}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRegenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Regenerate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
