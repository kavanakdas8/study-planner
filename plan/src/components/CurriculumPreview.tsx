"use client";

import React, { useState } from "react";
import {
  Compass,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { StudyPlan } from "@/types/study";
import { playChime } from "@/lib/utils";

interface CurriculumPreviewProps {
  plan: StudyPlan;
  dailyHours: number;
  timeframe: string;
  onStartLearning: () => void;
  onCustomizeRoadmap: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function CurriculumPreview({
  plan,
  dailyHours,
  timeframe,
  onStartLearning,
  onCustomizeRoadmap,
  onRegenerate,
  isRegenerating = false,
}: CurriculumPreviewProps) {
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({
    0: true, // first module expanded by default
  });

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Calculate totals
  const totalTasks = plan.schedule.reduce(
    (sum, period) => sum + (period.tasks?.length || 0),
    0
  );
  const totalMinutes = plan.schedule.reduce(
    (sum, period) =>
      sum +
      (period.tasks?.reduce((tSum, t) => tSum + (t.duration_minutes || 0), 0) || 0),
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Brand Bar */}
      <header className="h-15 px-4 sm:px-6 bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Compass className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 leading-none block">
              CuratePlan
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Roadmap Preview
            </span>
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playChime("click");
              onCustomizeRoadmap();
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Adjust prompts in conversation"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playChime("click");
              onRegenerate();
            }}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Generate alternative plan"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRegenerating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playChime("complete");
              onStartLearning();
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Roadmap Preview Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {plan.subject}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {plan.overview}
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Timeframe
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                {plan.target_timeframe || timeframe}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Daily Goal
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                {dailyHours} hours / day
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Total Modules
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                {plan.schedule.length} modules
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Planned Content
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                {totalTasks} tasks ({totalHours}h)
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Roadmap Module List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Curriculum Roadmap Modules
            </h2>
            <button
              type="button"
              onClick={() => {
                const allExpanded = plan.schedule.every((_, idx) => expandedModules[idx]);
                const nextState: Record<number, boolean> = {};
                plan.schedule.forEach((_, idx) => {
                  nextState[idx] = !allExpanded;
                });
                setExpandedModules(nextState);
              }}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
            >
              {plan.schedule.every((_, idx) => expandedModules[idx])
                ? "Collapse All"
                : "Expand All"}
            </button>
          </div>

          <div className="space-y-3 relative before:absolute before:left-5 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200 before:hidden sm:before:block">
            {plan.schedule.map((period, idx) => {
              const isExpanded = !!expandedModules[idx];
              const periodMinutes = period.tasks?.reduce(
                (sum, t) => sum + (t.duration_minutes || 0),
                0
              ) || 0;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition sm:ml-10 relative"
                >
                  {/* Step Marker Pill for desktop */}
                  <div className="hidden sm:flex absolute -left-10 top-4 w-7 h-7 rounded-full bg-white border-2 border-emerald-500 items-center justify-center text-[10px] font-bold text-emerald-700 shadow-2xs z-10 -translate-x-1/2">
                    {idx + 1}
                  </div>

                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModule(idx)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                          {period.period_label}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {period.tasks?.length || 0} tasks ({periodMinutes}m)
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {period.topic_summary}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Task Stream */}
                  {isExpanded && period.tasks && period.tasks.length > 0 && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-slate-100 space-y-2.5">
                      <div className="pt-3 space-y-2">
                        {period.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {task.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {task.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                {task.duration_minutes}m
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                {task.resource_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-emerald-950">
              Ready to embark on this curriculum?
            </h3>
            <p className="text-xs text-emerald-800/80 leading-relaxed">
              Click Start Learning to initialize your workspace, enable tracking, and enter the CuratePlan dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                playChime("complete");
                onStartLearning();
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Start Learning</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playChime("click");
                onCustomizeRoadmap();
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-700" />
              <span>Customize in Chat</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

