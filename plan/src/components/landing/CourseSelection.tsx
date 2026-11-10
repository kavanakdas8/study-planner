"use client";

import React, { useState } from "react";
import { BookOpen, Clock, Calendar, GraduationCap } from "lucide-react";
import { DifficultyLevel, OnboardingSelection } from "@/types/study";
import { SelectionCard } from "./SelectionCard";
import { LearningSummary } from "./LearningSummary";

interface CourseSelectionProps {
  onStartLearning: (selection: OnboardingSelection) => void;
  initialSelection?: OnboardingSelection | null;
}

const SUGGESTED_SUBJECTS = [
  "Python",
  "Machine Learning",
  "Web Development",
  "Data Structures & Algorithms",
  "Korean",
  "Japanese",
  "Mathematics",
  "Cloud Computing",
];

const DAILY_TIME_OPTIONS = [
  { id: "30m", label: "30 minutes", sublabel: "Light daily habit", minutes: 30 },
  { id: "1h", label: "1 hour", sublabel: "Balanced steady pace", minutes: 60 },
  { id: "1.5h", label: "1.5 hours", sublabel: "Focused progress", minutes: 90 },
  { id: "2h", label: "2 hours", sublabel: "Deep study block", minutes: 120 },
  { id: "3h", label: "3 hours", sublabel: "Intensive mastery", minutes: 180 },
  { id: "custom", label: "Custom", sublabel: "Set hours & minutes", minutes: 0 },
];

const DURATION_OPTIONS = [
  { id: "2w", label: "2 weeks", sublabel: "Sprint goal", days: 14 },
  { id: "1m", label: "1 month", sublabel: "Foundational track", days: 30 },
  { id: "2m", label: "2 months", sublabel: "Structured course", days: 60 },
  { id: "3m", label: "3 months", sublabel: "Deep proficiency", days: 90 },
  { id: "6m", label: "6 months", sublabel: "Full mastery", days: 180 },
  { id: "custom", label: "Custom", sublabel: "Choose duration", days: 0 },
];

const LEVEL_OPTIONS: DifficultyLevel[] = ["Beginner", "Intermediate", "Advanced"];

export function CourseSelection({
  onStartLearning,
  initialSelection,
}: CourseSelectionProps) {
  const [subject, setSubject] = useState(initialSelection?.subject || "");
  const [dailyOptionId, setDailyOptionId] = useState<string>("1h");
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<number>(15);

  const [durationOptionId, setDurationOptionId] = useState<string>("1m");
  const [customDurationValue, setCustomDurationValue] = useState<number>(6);
  const [customDurationUnit, setCustomDurationUnit] = useState<"weeks" | "months">("weeks");

  const [level, setLevel] = useState<DifficultyLevel | "">(
    initialSelection?.level || ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Resolve daily commitment in minutes & readable label
  const selectedDailyPreset = DAILY_TIME_OPTIONS.find((o) => o.id === dailyOptionId);
  const resolvedDailyMinutes =
    dailyOptionId === "custom"
      ? Math.max(0, Number(customHours) || 0) * 60 + Math.max(0, Number(customMinutes) || 0)
      : selectedDailyPreset?.minutes || 60;

  const formatCustomDailyLabel = (hrs: number, mins: number) => {
    const parts: string[] = [];
    if (hrs > 0) parts.push(`${hrs} ${hrs === 1 ? "hour" : "hours"}`);
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`);
    return parts.length > 0 ? parts.join(" ") : "0 minutes";
  };

  const resolvedDailyLabel =
    dailyOptionId === "custom"
      ? formatCustomDailyLabel(Number(customHours) || 0, Number(customMinutes) || 0)
      : selectedDailyPreset?.label || "1 hour";

  // Resolve course duration in days & readable label
  const selectedDurationPreset = DURATION_OPTIONS.find((o) => o.id === durationOptionId);
  const resolvedDurationDays =
    durationOptionId === "custom"
      ? Math.max(0, Number(customDurationValue) || 0) *
        (customDurationUnit === "weeks" ? 7 : 30)
      : selectedDurationPreset?.days || 30;

  const resolvedDurationLabel =
    durationOptionId === "custom"
      ? `${Math.max(0, Number(customDurationValue) || 0)} ${
          Number(customDurationValue) === 1
            ? customDurationUnit.slice(0, -1)
            : customDurationUnit
        }`
      : selectedDurationPreset?.label || "1 month";

  const handleConfirmStartLearning = () => {
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setValidationError("Please enter or choose a subject you would like to learn.");
      document.getElementById("subject-input")?.focus();
      return;
    }

    if (resolvedDailyMinutes <= 0) {
      setValidationError("Please specify a daily study commitment greater than 0 minutes.");
      return;
    }

    if (resolvedDurationDays <= 0) {
      setValidationError("Please specify a valid course duration.");
      return;
    }

    setValidationError(null);

    const totalEstimatedHours = Number(
      ((resolvedDailyMinutes / 60) * resolvedDurationDays).toFixed(1)
    );

    onStartLearning({
      subject: trimmedSubject,
      dailyMinutes: resolvedDailyMinutes,
      dailyLabel: resolvedDailyLabel,
      durationDays: resolvedDurationDays,
      durationLabel: resolvedDurationLabel,
      level,
      totalEstimatedHours,
      selectedAt: Date.now(),
    });
  };

  return (
    <section
      id="course-selection"
      className="py-16 sm:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12 sm:mb-14">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            What do you want to study today?
          </h2>
          <p className="text-sm sm:text-base text-[#475569]">
            Choose your learning goal. We&apos;ll help you structure your journey.
          </p>
        </div>

        {/* Two-Column Builder + Summary Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Course Configuration Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Subject / Course */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <label
                  htmlFor="subject-input"
                  className="text-base font-bold text-[#0F172A]"
                >
                  What would you like to learn?
                </label>
              </div>

              <input
                id="subject-input"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Machine Learning, Korean, Data Structures, Web Development..."
                className="w-full px-4 py-3.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition"
              />

              {/* Suggested Subject Shortcut Chips */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-[#475569] block">
                  Popular subjects (or type any subject above):
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SUBJECTS.map((item) => {
                    const isSelected =
                      subject.trim().toLowerCase() === item.toLowerCase();
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSubject(item);
                          if (validationError) setValidationError(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? "bg-[#ECFDF5] border-[#059669] text-[#059669] font-semibold"
                            : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Daily Study Time */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  How much time can you dedicate daily?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAILY_TIME_OPTIONS.map((option) => (
                  <SelectionCard
                    key={option.id}
                    label={option.label}
                    sublabel={option.sublabel}
                    selected={dailyOptionId === option.id}
                    onClick={() => {
                      setDailyOptionId(option.id);
                      if (validationError) setValidationError(null);
                    }}
                  />
                ))}
              </div>

              {/* Custom Daily Time Inputs */}
              {dailyOptionId === "custom" && (
                <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label
                      htmlFor="custom-hours"
                      className="text-xs font-semibold text-[#475569] block mb-1.5"
                    >
                      Hours per day
                    </label>
                    <input
                      id="custom-hours"
                      type="number"
                      min={0}
                      max={16}
                      value={customHours}
                      onChange={(e) =>
                        setCustomHours(Math.max(0, Math.min(16, Number(e.target.value))))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] focus:border-[#059669] focus:outline-none text-sm font-semibold text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-minutes"
                      className="text-xs font-semibold text-[#475569] block mb-1.5"
                    >
                      Minutes
                    </label>
                    <input
                      id="custom-minutes"
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={customMinutes}
                      onChange={(e) =>
                        setCustomMinutes(Math.max(0, Math.min(59, Number(e.target.value))))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] focus:border-[#059669] focus:outline-none text-sm font-semibold text-[#0F172A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Total Course Duration */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  How long do you want to study?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <SelectionCard
                    key={option.id}
                    label={option.label}
                    sublabel={option.sublabel}
                    selected={durationOptionId === option.id}
                    onClick={() => {
                      setDurationOptionId(option.id);
                      if (validationError) setValidationError(null);
                    }}
                  />
                ))}
              </div>

              {/* Custom Course Duration Inputs */}
              {durationOptionId === "custom" && (
                <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label
                      htmlFor="custom-duration-val"
                      className="text-xs font-semibold text-[#475569] block mb-1.5"
                    >
                      Duration length
                    </label>
                    <input
                      id="custom-duration-val"
                      type="number"
                      min={1}
                      max={52}
                      value={customDurationValue}
                      onChange={(e) =>
                        setCustomDurationValue(Math.max(1, Math.min(52, Number(e.target.value))))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] focus:border-[#059669] focus:outline-none text-sm font-semibold text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-duration-unit"
                      className="text-xs font-semibold text-[#475569] block mb-1.5"
                    >
                      Unit
                    </label>
                    <select
                      id="custom-duration-unit"
                      value={customDurationUnit}
                      onChange={(e) =>
                        setCustomDurationUnit(e.target.value as "weeks" | "months")
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] focus:border-[#059669] focus:outline-none text-sm font-semibold text-[#0F172A]"
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Optional Learning Level */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Select your current level
                  </h3>
                </div>
                <span className="text-xs font-medium text-[#94A3B8] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVEL_OPTIONS.map((lvl) => (
                  <SelectionCard
                    key={lvl}
                    label={lvl}
                    selected={level === lvl}
                    onClick={() => setLevel((prev) => (prev === lvl ? "" : lvl))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Selection Summary */}
          <div className="lg:col-span-5">
            <LearningSummary
              subject={subject}
              dailyLabel={resolvedDailyLabel}
              dailyMinutes={resolvedDailyMinutes}
              durationLabel={resolvedDurationLabel}
              durationDays={resolvedDurationDays}
              level={level}
              validationError={validationError}
              onStartLearning={handleConfirmStartLearning}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

