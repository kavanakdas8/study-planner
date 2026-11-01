"use client";

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Clock,
  ExternalLink,
  X,
  Target,
  Layers,
} from "lucide-react";
import { SavedPlan, PeriodSchedule } from "@/types/study";
import { formatMinutes } from "@/lib/utils";

interface LearningNodeGraphProps {
  plan: SavedPlan;
  completedTasksMap: Record<string, boolean>;
  selectedPeriodIndex: number | null;
  onSelectPeriodIndex: (idx: number | null) => void;
}

export function LearningNodeGraph({
  plan,
  completedTasksMap,
  selectedPeriodIndex,
  onSelectPeriodIndex,
}: LearningNodeGraphProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.4, prev + 0.15));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.7, prev - 0.15));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Helper to calculate period completion
  const getPeriodStats = (period: PeriodSchedule, pIdx: number) => {
    let completed = 0;
    let totalMinutes = 0;
    period.tasks.forEach((t, tIdx) => {
      totalMinutes += t.duration_minutes || 0;
      if (completedTasksMap[`${plan.id}_${pIdx}_${tIdx}`]) {
        completed++;
      }
    });
    const percent = period.tasks.length > 0 ? Math.round((completed / period.tasks.length) * 100) : 0;
    const isDone = percent === 100 && period.tasks.length > 0;
    const isStarted = completed > 0 && !isDone;

    return { completed, total: period.tasks.length, totalMinutes, percent, isDone, isStarted };
  };

  return (
    <>
      {/* =========================================================================
          INTERACTIVE LEARNING NODE GRAPH
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-2xs select-none">
        {/* Top Header Row with Status Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Green Pulse Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Roadmap Graph</span>
            </div>

            {/* Target Timeframe Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs font-mono font-medium">
              <Target className="w-3 h-3 text-slate-500" />
              <span>Target: {plan.target_timeframe}</span>
            </div>

            {/* Phases Counter */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-mono">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{plan.schedule.length} Modules</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Flow zoom:</span>
            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>

        {/* Visual Node Canvas with Dot-Grid Background */}
        <div className="relative z-10 my-4 bg-slate-50/80 rounded-xl border border-slate-200 bg-dot-grid overflow-hidden min-h-[220px] flex items-center justify-center p-6">
          <div
            className="flex items-center gap-0 overflow-x-auto py-4 px-2 w-full transition-transform duration-200 justify-start md:justify-center scrollbar-thin"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          >
            {plan.schedule.map((period, pIdx) => {
              const stats = getPeriodStats(period, pIdx);
              const isSelected = selectedPeriodIndex === pIdx;
              const isLast = pIdx === plan.schedule.length - 1;

              return (
                <React.Fragment key={pIdx}>
                  {/* Flow Node Card */}
                  <div
                    onClick={() => {
                      onSelectPeriodIndex(isSelected ? null : pIdx);
                    }}
                    className={`relative shrink-0 w-64 rounded-xl p-4 transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? "bg-white border-2 border-emerald-600 shadow-md translate-y-[-2px]"
                        : stats.isDone
                        ? "bg-emerald-50/60 border border-emerald-300 hover:border-emerald-400 shadow-2xs"
                        : "bg-white border border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    {/* Top Phase Header & Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                          NODE 0{pIdx + 1}
                        </span>
                        {stats.isDone && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                            Completed
                          </span>
                        )}
                        {stats.isStarted && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                            In Progress
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-600 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatMinutes(stats.totalMinutes)}
                      </span>
                    </div>

                    {/* Node Title & Subtitle */}
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate group-hover:text-emerald-700 transition">
                      {period.period_label}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {period.topic_summary}
                    </p>

                    {/* Progress Bar & Task Count */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-700 font-medium">
                          {stats.completed}/{stats.total}
                        </span>
                        <span className="text-[10px] text-slate-400">tasks</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              stats.isDone ? "bg-emerald-600" : "bg-emerald-500"
                            }`}
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 font-medium">
                          {stats.percent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Connector Line & Arrow */}
                  {!isLast && (
                    <div className="shrink-0 flex items-center justify-center px-2">
                      <div className="flex items-center">
                        <div
                          className={`h-0.5 w-6 sm:w-10 transition-colors ${
                            stats.isDone ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        <div
                          className={`w-2.5 h-2.5 border-t-2 border-r-2 rotate-45 -ml-1 transition-colors ${
                            stats.isDone ? "border-emerald-500" : "border-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="relative z-10 flex items-center justify-between pt-1">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="px-2 py-0.5 text-[10px] font-mono text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer font-medium"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Full Preview Button */}
          <button
            type="button"
            onClick={() => setIsFullPreviewOpen(true)}
            title="Open expanded roadmap canvas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            <span>Full overview</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Full Preview Modal */}
      {isFullPreviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Curriculum Architecture Canvas
                  </h2>
                  <p className="text-xs text-slate-500">{plan.subject}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-dot-grid bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.schedule.map((period, idx) => {
                  const stats = getPeriodStats(period, idx);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                          Milestone 0{idx + 1}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {formatMinutes(stats.totalMinutes)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{period.period_label}</h4>
                      <p className="text-xs text-slate-500">{period.topic_summary}</p>
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        {period.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-center justify-between text-xs text-slate-600"
                          >
                            <span className="truncate pr-2">• {task.title}</span>
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {task.duration_minutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
