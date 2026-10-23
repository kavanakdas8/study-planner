"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  ChevronDown,
  Flame,
  Zap,
  Sliders,
} from "lucide-react";
import { SavedPlan, ActiveTimer } from "@/types/study";
import { formatMinutes } from "@/lib/utils";

interface HeaderKPIProps {
  plan: SavedPlan;
  completedCount: number;
  totalCount: number;
  totalMinutes: number;
  activeTimer: ActiveTimer | null;
  onOpenCreateModal: () => void;
  onExportMarkdown: () => void;
  selectedPeriodLabel?: string;
  onSelectPeriodLabel?: (label: string) => void;
}

export function HeaderKPI({
  plan,
  completedCount,
  totalCount,
  totalMinutes,
  activeTimer,
  onOpenCreateModal,
  onExportMarkdown,
  selectedPeriodLabel = "All Periods",
  onSelectPeriodLabel,
}: HeaderKPIProps) {
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingTasks = Math.max(0, totalCount - completedCount);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Curriculum Velocity label derived from daily commitment
  const getVelocity = (hours: number) => {
    if (hours >= 3.5) return { title: "Bootcamp", tag: "High Velocity", color: "text-[#f97316]" };
    if (hours >= 2.0) return { title: "Optimal", tag: "Standard Pace", color: "text-emerald-400" };
    return { title: "Micro-Sprint", tag: "Steady Velocity", color: "text-sky-400" };
  };

  const velocity = getVelocity(plan.daily_hours || 2);

  const periodOptions = ["All Periods", ...plan.schedule.map((p) => p.period_label)];

  return (
    <div className="space-y-5">
      {/* =========================================================================
          ROW 1: SECTION HEADER & ACTION CONTROLS
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        {/* Left: Large Bold Title & Muted Subtitle */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
              Active Curriculum
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-[#121316] border border-[#1f2128] px-2 py-0.5 rounded">
              {plan.target_timeframe}
            </span>
            {plan.experience_level && (
              <span className="text-[11px] font-mono text-slate-400 bg-[#121316] border border-[#1f2128] px-2 py-0.5 rounded">
                {plan.experience_level}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
            {plan.subject}
          </h1>

          <p className="text-xs sm:text-sm text-[#9ca3af] max-w-3xl leading-relaxed">
            {plan.overview}
          </p>
        </div>

        {/* Right-side Controls: Date/Period Dropdown + Secondary Action Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-end">
          {/* Date/Period Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121316] hover:bg-[#181a1f] border border-[#1f2128] text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedPeriodLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#121316] border border-[#1f2128] rounded-xl shadow-2xl py-1 text-xs text-slate-300 z-40 animate-fade-in">
                {periodOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (onSelectPeriodLabel) onSelectPeriodLabel(opt);
                      setPeriodDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left transition cursor-pointer flex items-center justify-between ${
                      selectedPeriodLabel === opt
                        ? "bg-[#ea580c]/15 text-[#f97316] font-semibold"
                        : "hover:bg-[#181a1f] text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedPeriodLabel === opt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Action: Orange Outlined Export Markdown Container */}
          <button
            type="button"
            onClick={onExportMarkdown}
            title="Export full plan to markdown file"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121316] hover:bg-[#ea580c]/10 border border-[#ea580c]/40 text-[#f97316] text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#f97316]" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: 4-COLUMN METRIC KPI CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completion Rate */}
        <div className="bg-[#121316] border border-[#1f2128] hover:border-[#2a2d36] rounded-xl sm:rounded-2xl p-4.5 transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-[#9ca3af]">Completion Rate</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {percentComplete}%
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>+4.2% this sprint</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {completedCount}/{totalCount} done
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Study Time */}
        <div className="bg-[#121316] border border-[#1f2128] hover:border-[#2a2d36] rounded-xl sm:rounded-2xl p-4.5 transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-[#9ca3af]">Total Study Time</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {totalHours} hrs
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-mono text-slate-400 bg-[#0a0a0c] px-2 py-0.5 rounded border border-[#1f2128]">
                vs allocated hours
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({plan.daily_hours}h/day)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="bg-[#121316] border border-[#1f2128] hover:border-[#2a2d36] rounded-xl sm:rounded-2xl p-4.5 transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-[#9ca3af]">Pending Tasks</span>
            <span className="p-1.5 rounded-lg bg-[#ea580c]/10 text-[#f97316] border border-[#ea580c]/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {pendingTasks} {pendingTasks === 1 ? "task" : "tasks"}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 text-[11px] font-mono font-medium">
                <Flame className="w-3 h-3" />
                <span>active today</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                of {totalCount} total
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Curriculum Velocity / Intensity */}
        <div className="bg-[#121316] border border-[#1f2128] hover:border-[#2a2d36] rounded-xl sm:rounded-2xl p-4.5 transition-all shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-[#9ca3af]">Curriculum Velocity</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {velocity.title}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-mono text-slate-400 bg-[#0a0a0c] px-2 py-0.5 rounded border border-[#1f2128]">
                {velocity.tag}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {plan.schedule.length} phases
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
