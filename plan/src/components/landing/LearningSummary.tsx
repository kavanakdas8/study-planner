"use client";

import React from "react";
import { ArrowRight, Clock, AlertCircle, BookOpen } from "lucide-react";

interface LearningSummaryProps {
  subject: string;
  dailyLabel: string;
  dailyMinutes: number;
  durationLabel: string;
  durationDays: number;
  level: string;
  validationError: string | null;
  onStartLearning: () => void;
}

export function LearningSummary({
  subject,
  dailyLabel,
  dailyMinutes,
  durationLabel,
  durationDays,
  level,
  validationError,
  onStartLearning,
}: LearningSummaryProps) {
  // Dynamically calculate total available learning time from daily commitment and duration
  const totalHoursRaw = (Math.max(0, dailyMinutes) / 60) * Math.max(0, durationDays);
  const formattedTotalHours =
    totalHoursRaw % 1 === 0
      ? totalHoursRaw.toLocaleString()
      : totalHoursRaw.toFixed(1);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#059669] block">
            Journey Summary
          </span>
          <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
            Your Learning Journey
          </h3>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
      </div>

      {/* Summary Details Table */}
      <div className="divide-y divide-[#E2E8F0] text-sm">
        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-[#475569] font-medium">Subject</span>
          <span
            className={`font-semibold text-right truncate max-w-[190px] ${
              subject.trim() ? "text-[#0F172A]" : "text-[#94A3B8] italic"
            }`}
          >
            {subject.trim() || "Select a subject"}
          </span>
        </div>

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-[#475569] font-medium">Daily commitment</span>
          <span className="font-semibold text-[#0F172A] text-right">
            {dailyMinutes > 0 ? dailyLabel : "Not set"}
          </span>
        </div>

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-[#475569] font-medium">Course duration</span>
          <span className="font-semibold text-[#0F172A] text-right">
            {durationDays > 0 ? durationLabel : "Not set"}
          </span>
        </div>

        <div className="py-3 flex items-center justify-between gap-4">
          <span className="text-[#475569] font-medium">Learning level</span>
          <span
            className={`font-semibold text-right ${
              level ? "text-[#0F172A]" : "text-[#94A3B8]"
            }`}
          >
            {level || "Optional"}
          </span>
        </div>
      </div>

      {/* Visual Estimate of Total Available Learning Time */}
      <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#047857] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Estimated Total Study Time
          </span>
          <span className="text-xs font-mono font-semibold text-[#059669]">
            {durationDays > 0 ? `${durationDays} days` : "0 days"}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-[#0F172A]">
            {formattedTotalHours} hours
          </span>
          <span className="text-xs text-[#475569]">
            available across your plan
          </span>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Primary Start Learning CTA */}
      <button
        type="button"
        onClick={onStartLearning}
        className="w-full py-3.5 px-5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
      >
        <span>Start Learning</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-[11px] text-center text-[#94A3B8] leading-relaxed">
        You can customize your schedule, daily targets, and milestones anytime inside the dashboard.
      </p>
    </div>
  );
}

