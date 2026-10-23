"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Loader2, ArrowRight, Clock, AlertCircle, Flame } from "lucide-react";

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
}

const PRESET_CHIPS = [
  {
    title: "Next.js & Supabase",
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
    title: "Docker & Kubernetes",
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
}: CreationModalProps) {
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("1 Week");
  const [dailyHours, setDailyHours] = useState(2);
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [progressMsgIdx, setProgressMsgIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Rotate simulated progress messages
  useEffect(() => {
    if (!loading) {
      setProgressMsgIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressMsgIdx((prev) => (prev + 1) % REASONING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
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

  const handleApplyPreset = (p: typeof PRESET_CHIPS[0]) => {
    setTopic(p.title);
    setTimeframe(p.timeframe);
    setDailyHours(p.daily_hours);
    setExperienceLevel(p.experience_level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    await onGenerate({
      topic: topic.trim(),
      timeframe,
      daily_hours: dailyHours,
      experience_level: experienceLevel,
    });
  };

  const getPaceTag = (hrs: number) => {
    if (hrs <= 1) return { label: "Micro-Sprint", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (hrs <= 3) return { label: "Standard Pace", color: "text-[#f97316] bg-[#ea580c]/15 border-[#ea580c]/30" };
    return { label: "Bootcamp Intensive", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  };

  const pace = getPaceTag(dailyHours);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="creation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-[#121316] border border-[#1f2128] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#1f2128] bg-[#0d0d11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ea580c]/15 border border-[#ea580c]/30 flex items-center justify-center text-[#f97316]">
              <Flame className="w-4 h-4 fill-[#f97316]" />
            </div>
            <div>
              <h2 id="creation-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                Generate Curriculum Roadmap
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Autonomous AI planner engine powered by Gemini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#181a1f] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin">
          {/* Quick Preset Chips */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Curriculum Tracks
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHIPS.map((chip, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(chip)}
                  disabled={loading}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    topic === chip.title
                      ? "bg-[#ea580c]/20 border-[#ea580c]/60 text-[#f97316] font-semibold"
                      : "bg-[#0a0a0c] border-[#1f2128] text-slate-400 hover:text-white hover:border-[#2a2d36]"
                  }`}
                >
                  {chip.title}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              What subject or technology do you want to master?
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              disabled={loading}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Systems in Go, Next.js Architecture, Kubernetes"
              className="w-full bg-[#0a0a0c] border border-[#1f2128] focus:border-[#ea580c] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
            />
          </div>

          {/* Timeframe Segmented Grid */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5 flex items-center justify-between">
              <span>Target Timeframe</span>
              <span className="text-[10px] text-slate-400 font-mono">Sprint velocity</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-[#0a0a0c] p-1 rounded-xl border border-[#1f2128]">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setTimeframe(opt)}
                  disabled={loading}
                  className={`text-xs py-1.5 px-2 rounded-lg font-medium transition cursor-pointer text-center ${
                    timeframe === opt
                      ? "bg-[#f97316] text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-[#181a1f]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Commitment Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#f97316]" /> Daily Study Hours
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${pace.color}`}>
                  {pace.label}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {dailyHours} {dailyHours === 1 ? "hr" : "hrs"} / day
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.5"
              disabled={loading}
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#0a0a0c] rounded-lg appearance-none cursor-pointer accent-[#f97316] border border-[#1f2128]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0.5h (Sprint)</span>
              <span>2.0h (Standard)</span>
              <span>4.0h+ (Bootcamp)</span>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Beginner", label: "Beginner", desc: "Start from first principles" },
                { id: "Intermediate", label: "Intermediate", desc: "Build on core fundamentals" },
                { id: "Advanced", label: "Advanced", desc: "Production & architecture" },
              ].map((lvl) => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setExperienceLevel(lvl.id)}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    experienceLevel === lvl.id
                      ? "bg-[#ea580c]/15 border-[#ea580c]/70 text-white shadow-sm"
                      : "bg-[#0a0a0c] border-[#1f2128] text-slate-400 hover:text-white hover:border-[#2a2d36]"
                  }`}
                >
                  <div className="text-xs font-semibold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reasoning / Progress Indicator */}
          {loading && (
            <div className="p-4 bg-[#0a0a0c] border border-[#ea580c]/30 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-[#f97316] text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                <span>Gemini Reasoning &amp; Decomposition...</span>
              </div>
              <p className="text-xs text-slate-300 font-mono pl-6 animate-pulse">
                &gt; {REASONING_MESSAGES[progressMsgIdx]}
              </p>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Plan...
                </>
              ) : (
                <>
                  Generate Sprint Plan <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
