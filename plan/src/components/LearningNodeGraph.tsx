"use client";

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
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
          ROW 3: INTERACTIVE LEARNING NODE GRAPH (VISUAL NODE CANVAS)
          ========================================================================= */}
      <div className="bg-[#121316] border border-[#1f2128] rounded-xl sm:rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-xl select-none">
        {/* Subtle Ambient Center Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.08), transparent 70%)",
          }}
        />

        {/* Top Header Row with Status Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f2128]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Green Pulse Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Active Sprint</span>
            </div>

            {/* Industrial Orange Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 text-xs font-mono font-medium">
              <Target className="w-3 h-3 text-[#f97316]" />
              <span>Target: {plan.target_timeframe}</span>
            </div>

            {/* Phases Counter */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0a0c] text-slate-400 border border-[#1f2128] text-xs font-mono">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>{plan.schedule.length} Milestone Nodes</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
            <span className="hidden sm:inline">Interactive Roadmap Flow</span>
            <span className="font-mono text-[10px] text-slate-500 bg-[#0a0a0c] px-2 py-0.5 rounded border border-[#1f2128]">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>

        {/* Visual Node Canvas with Dot-Grid Background */}
        <div className="relative z-10 my-4 bg-[#0a0a0c]/80 rounded-xl border border-[#1f2128] bg-dot-grid overflow-hidden min-h-[220px] flex items-center justify-center p-6">
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
                    className={`relative shrink-0 w-64 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg group ${
                      isSelected
                        ? "bg-[#181a1f] border-2 border-[#f97316] shadow-orange-950/40 translate-y-[-2px]"
                        : stats.isDone
                        ? "bg-[#121316] border border-emerald-500/40 hover:border-emerald-500/70"
                        : "bg-[#121316] border border-[#1f2128] hover:border-[#ea580c]/60 hover:bg-[#181a1f]"
                    }`}
                  >
                    {/* Top Phase Header & Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                          NODE 0{pIdx + 1}
                        </span>
                        {stats.isDone && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Done
                          </span>
                        )}
                        {stats.isStarted && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30">
                            In Progress
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-[#1f2128]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatMinutes(stats.totalMinutes)}
                      </span>
                    </div>

                    {/* Node Title & Subtitle */}
                    <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-[#f97316] transition">
                      {period.period_label}
                    </h3>
                    <p className="text-xs text-[#9ca3af] truncate mt-0.5">
                      {period.topic_summary}
                    </p>

                    {/* Progress Bar & Task Count */}
                    <div className="mt-3 pt-2.5 border-t border-[#1f2128]/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300">
                          {stats.completed}/{stats.total}
                        </span>
                        <span className="text-[10px] text-slate-500">tasks</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0a0a0c] h-1.5 rounded-full overflow-hidden border border-[#1f2128]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              stats.isDone ? "bg-emerald-500" : "bg-[#f97316]"
                            }`}
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
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
                            stats.isDone ? "bg-emerald-500/60" : "bg-[#2a2d36]"
                          }`}
                        />
                        <div
                          className={`w-2.5 h-2.5 border-t-2 border-r-2 rotate-45 -ml-1 transition-colors ${
                            stats.isDone ? "border-emerald-500/80" : "border-[#2a2d36]"
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

        {/* Canvas Controls: Floating Bottom-Left and Bottom-Right */}
        <div className="relative z-10 flex items-center justify-between pt-1">
          {/* Zoom Controls (Bottom Left) */}
          <div className="flex items-center gap-1 bg-[#0a0a0c]/90 border border-[#1f2128] rounded-lg p-1 shadow-md">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#181a1f] transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white rounded hover:bg-[#181a1f] transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#181a1f] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Full Preview Button (Bottom Right) */}
          <button
            type="button"
            onClick={() => setIsFullPreviewOpen(true)}
            title="Open expanded roadmap canvas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a0c]/90 hover:bg-[#181a1f] border border-[#1f2128] hover:border-[#2a2d36] text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer shadow-md"
          >
            <span>Full preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#f97316]" />
          </button>
        </div>
      </div>

      {/* Full Preview Modal */}
      {isFullPreviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] bg-[#121316] border border-[#1f2128] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#1f2128] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ea580c]/15 border border-[#ea580c]/30 flex items-center justify-center text-[#f97316]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Full Curriculum Architecture Canvas
                  </h2>
                  <p className="text-xs text-[#9ca3af]">{plan.subject}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#181a1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-dot-grid bg-[#0a0a0c]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.schedule.map((period, idx) => {
                  const stats = getPeriodStats(period, idx);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#121316] border border-[#1f2128] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#f97316] uppercase">
                          Milestone 0{idx + 1}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {formatMinutes(stats.totalMinutes)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{period.period_label}</h4>
                      <p className="text-xs text-slate-400">{period.topic_summary}</p>
                      <div className="space-y-1.5 pt-2 border-t border-[#1f2128]">
                        {period.tasks.map((task, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-center justify-between text-xs text-slate-300"
                          >
                            <span className="truncate pr-2">• {task.title}</span>
                            <span className="font-mono text-[10px] text-slate-500 shrink-0">
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
