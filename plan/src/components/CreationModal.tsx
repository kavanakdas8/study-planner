"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface CreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: {
    topic: string;
    timeframe: string;
    daily_hours: number;
    experience_level: string;
  }) => Promise<void>;
  loading: boolean;
  error: string;
  defaultDifficulty?: string;
  defaultDailyHours?: number;
}

const PRESET_CHIPS = [
  {
    title: "Next.js & Supabase Architecture",
    timeframe: "1 Week",
    daily_hours: 2,
    experience_level: "Intermediate",
  },
  {
    title: "Distributed Systems & Go",
    timeframe: "2 Weeks",
    daily_hours: 3,
    experience_level: "Advanced",
  },
  {
    title: "Docker & Kubernetes Orchestration",
    timeframe: "3 Days",
    daily_hours: 2.5,
    experience_level: "Beginner",
  },
  {
    title: "Deep Learning & PyTorch",
    timeframe: "1 Month",
    daily_hours: 2,
    experience_level: "Intermediate",
  },
];

const DURATION_OPTIONS = ["1 Day", "3 Days", "1 Week", "2 Weeks", "1 Month"];

const REASONING_MESSAGES = [
  "Deconstructing subject prerequisites...",
  "Synthesizing progressive milestone nodes...",
  "Allocating active hands-on coding exercises...",
  "Calibrating sprint velocity and Pomodoro chunks...",
];

export function CreationModal({
  isOpen,
  onClose,
  onGenerate,
  loading,
  error,
  defaultDifficulty = "Intermediate",
  defaultDailyHours = 2,
}: CreationModalProps) {
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("1 Week");
  const [dailyHours, setDailyHours] = useState(defaultDailyHours);
  const [experienceLevel, setExperienceLevel] = useState(defaultDifficulty);
  const [progressMsgIdx, setProgressMsgIdx] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state during render when modal opens (React pattern for adjusting state on prop change)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDailyHours(defaultDailyHours);
      setExperienceLevel(defaultDifficulty);
    }
  }

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Rotate simulated progress messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgressMsgIdx((prev) => (prev + 1) % REASONING_MESSAGES.length);
    }, 2400);
    return () => {
      clearInterval(interval);
      setProgressMsgIdx(0);
    };
  }, [loading]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    onGenerate({
      topic: topic.trim(),
      timeframe,
      daily_hours: dailyHours,
      experience_level: experienceLevel,
    });
  };

  const handleApplyPreset = (preset: (typeof PRESET_CHIPS)[0]) => {
    setTopic(preset.title);
    setTimeframe(preset.timeframe);
    setDailyHours(preset.daily_hours);
    setExperienceLevel(preset.experience_level);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="w-9 h-6" />
            <div>
              <h2 id="modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                Curriculum Planner
              </h2>
              <p className="text-xs text-slate-500">
                Generate an autonomous, milestone-based learning roadmap
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Main Subject Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="topic-input"
              className="text-xs font-semibold text-slate-700 flex items-center justify-between"
            >
              <span>Subject or Skill you want to master</span>
              <span className="text-[10px] text-slate-400 font-normal">e.g. Distributed Consensus in Go</span>
            </label>
            <input
              id="topic-input"
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn?"
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
            />
          </div>

          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Suggested Curricula
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHIPS.map((chip) => (
                <button
                  type="button"
                  key={chip.title}
                  onClick={() => handleApplyPreset(chip)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-xs text-slate-700 hover:text-emerald-800 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{chip.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {chip.timeframe}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Grid: Timeframe, Daily Hours, Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Target Timeframe */}
            <div className="space-y-1.5">
              <label htmlFor="timeframe-select" className="text-xs font-semibold text-slate-700">
                Target Timeframe
              </label>
              <select
                id="timeframe-select"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none transition"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-slate-800">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Hours Commitment */}
            <div className="space-y-1.5">
              <label htmlFor="daily-hours-input" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Daily Study Goal</span>
                <span className="font-mono text-emerald-700 font-semibold">{dailyHours}h</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="daily-hours-input"
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  disabled={loading}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label htmlFor="level-select" className="text-xs font-semibold text-slate-700">
                Experience Level
              </label>
              <select
                id="level-select"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none transition"
              >
                <option value="Beginner" className="bg-white text-slate-800">Beginner (Foundations)</option>
                <option value="Intermediate" className="bg-white text-slate-800">Intermediate (Applied)</option>
                <option value="Advanced" className="bg-white text-slate-800">Advanced (Deep Dive)</option>
              </select>
            </div>
          </div>

          {/* Loading or Error Feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Generation Error</p>
                <p className="mt-0.5 text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
              <Loader2 className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
              <div className="flex-1">
                <p className="font-semibold">{REASONING_MESSAGES[progressMsgIdx]}</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Structuring tasks and resources with curriculum models...
                </p>
              </div>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Generate Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
