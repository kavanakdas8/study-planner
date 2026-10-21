"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Timer,
  Play,
  Pause,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import { SavedPlan, ActiveTimer } from "@/types/study";
import { formatMinutes, formatTimeSeconds } from "@/lib/utils";

interface HeaderKPIProps {
  plan: SavedPlan;
  completedCount: number;
  totalCount: number;
  totalMinutes: number;
  activeTimer: ActiveTimer | null;
  onOpenCreateModal: () => void;
  onResumeTimer?: () => void;
}

export function HeaderKPI({
  plan,
  completedCount,
  totalCount,
  totalMinutes,
  activeTimer,
  onOpenCreateModal,
  onResumeTimer,
}: HeaderKPIProps) {
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const periodsCount = plan.schedule.length;

  return (
    <div className="space-y-4">
      {/* Active Study Plan Banner Header */}
      <div className="bg-[#0D111B] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -top-12 left-1/4 w-96 h-28 opacity-25"
          style={{
            background: "radial-gradient(ellipse at center, rgba(99,102,241,0.5), transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            {/* Status Badge & Metadata Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Active Study Plan
              </span>

              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {plan.target_timeframe}
              </span>

              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {plan.daily_hours}h / day
              </span>

              {plan.experience_level && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50 flex items-center gap-1">
                  <Award className="w-3 h-3 text-slate-500" />
                  {plan.experience_level}
                </span>
              )}
            </div>

            {/* Subject Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {plan.subject}
            </h1>

            {/* Overview description */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
              {plan.overview}
            </p>
          </div>

          {/* Regenerate / Reconfigure Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Customize Goal</span>
          </button>
        </div>

        {/* 3 Compact Analytics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-4 border-t border-slate-800/80">
          {/* Panel 1: Total Study Time */}
          <div className="p-3.5 rounded-xl bg-[#111827]/70 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Scheduled Study Time
              </div>
              <div className="font-mono text-base font-bold text-white mt-0.5">
                {formatMinutes(totalMinutes)}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{totalCount} micro-tasks</span>
                <span>•</span>
                <span>{periodsCount} {periodsCount === 1 ? "period" : "periods"}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Learning Progress */}
          <div className="p-3.5 rounded-xl bg-[#111827]/70 border border-slate-800/80 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Curriculum Progress</span>
                <span className="font-mono text-emerald-400 font-bold">{percentComplete}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 shadow-sm shadow-emerald-500/30"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {completedCount} of {totalCount} tasks completed
              </div>
            </div>
          </div>

          {/* Panel 3: Focus Status */}
          <div className="p-3.5 rounded-xl bg-[#111827]/70 border border-slate-800/80 flex items-center gap-3.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                activeTimer && activeTimer.isRunning
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                  : "bg-slate-800/70 border-slate-700/60 text-slate-400"
              }`}
            >
              <Timer className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Focus Session
              </div>
              {activeTimer ? (
                <div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-base font-bold text-amber-400">
                      {formatTimeSeconds(activeTimer.remainingSeconds)}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      ({activeTimer.isRunning ? "Running" : "Paused"})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {activeTimer.taskTitle}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-1">
                  Click &quot;Focus&quot; on any task to start
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
