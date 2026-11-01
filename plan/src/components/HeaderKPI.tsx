"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Download,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { SavedPlan, ActiveTimer } from "@/types/study";

interface HeaderKPIProps {
  plan: SavedPlan;
  completedCount: number;
  totalCount: number;
  totalMinutes: number;
  activeTimer?: ActiveTimer | null;
  onOpenCreateModal?: () => void;
  onExportMarkdown: () => void;
  selectedPeriodLabel?: string;
  onSelectPeriodLabel?: (label: string) => void;
}

export function HeaderKPI({
  plan,
  completedCount,
  totalCount,
  totalMinutes,
  onExportMarkdown,
  selectedPeriodLabel = "All Periods",
  onSelectPeriodLabel,
}: HeaderKPIProps) {
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingTasks = Math.max(0, totalCount - completedCount);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Velocity Calculation: (remaining estimated minutes) / (rolling 7-day average daily minutes logged)
  const completedMinutes = totalCount > 0 ? Math.round(totalMinutes * (completedCount / totalCount)) : 0;
  const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);
  const targetDailyMinutes = (plan.daily_hours || 2) * 60;
  const daysSincePlanStart = Math.max(
    1,
    Math.min(7, Math.ceil((Date.now() - (plan.createdAt || Date.now() - 86400000 * 2)) / 86400000))
  );
  const rolling7DayAvgMinutes =
    completedMinutes > 0
      ? Math.max(30, Math.round((completedMinutes / daysSincePlanStart) * 0.7 + targetDailyMinutes * 0.3))
      : targetDailyMinutes;

  const daysToFinish = remainingMinutes > 0 ? Math.max(1, Math.ceil(remainingMinutes / rolling7DayAvgMinutes)) : 0;
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + daysToFinish);
  const forecastDateStr =
    percentComplete === 100
      ? "Completed"
      : forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const periodOptions = ["All Periods", ...plan.schedule.map((p) => p.period_label)];

  // Formatted date string for greeting
  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* =========================================================================
          ROW 1: GREETING & CURRICULUM HEADER
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Greeting & Date Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">
                Welcome back, Alex
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentDateFormatted}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Curriculum
              </span>
            </div>

            {/* Title & Overview */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
              {plan.subject}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {plan.overview}
            </p>
          </div>

          {/* Right Action Controls: Filter & Export */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            {/* Period Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedPeriodLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {periodDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs text-slate-700 z-40 animate-fade-in">
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
                          ? "bg-emerald-50 text-emerald-800 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {selectedPeriodLabel === opt && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Markdown Action */}
            <button
              type="button"
              onClick={onExportMarkdown}
              title="Export curriculum to markdown"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: METRIC KPI CARDS (PREMIUM WHITE WITH EMERALD ACCENTS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Curriculum Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 transition-all hover:border-slate-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Curriculum Progress</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {percentComplete}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-500">
                {completedCount} of {totalCount} tasks completed
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                {pendingTasks} remaining
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Total Study Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 transition-all hover:border-slate-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Study Time</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {totalHours} hrs
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                Allocated goal
              </span>
              <span className="text-[11px] text-slate-500">
                ({plan.daily_hours}h / day)
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-2.5">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              <span>Target: {plan.target_timeframe}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 transition-all hover:border-slate-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Tasks</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
              {totalCount}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-500">
                {plan.schedule.length} learning modules
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                {plan.experience_level || "Standard"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2.5">
              Avg ~{totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0}m per task
            </div>
          </div>
        </div>

        {/* Card 4: Study Velocity & Forecast */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 transition-all hover:border-slate-300 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Study Velocity & Forecast</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                {forecastDateStr}
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                {daysToFinish > 0 ? `${daysToFinish}d left` : "Done"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>Pace: {rolling7DayAvgMinutes}m/day</span>
              <span className="text-emerald-700 font-semibold">
                {Math.round((rolling7DayAvgMinutes / targetDailyMinutes) * 100)}% velocity
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2.5">
              Based on active study completion
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
