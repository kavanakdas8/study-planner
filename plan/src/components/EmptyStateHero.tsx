"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  Code2,
  Container,
  Cpu,
  BrainCircuit,
  Target,
  Clock,
  Timer,
  Compass,
} from "lucide-react";

interface EmptyStateHeroProps {
  onOpenModal: () => void;
  onGeneratePreset: (preset: {
    topic: string;
    timeframe: string;
    daily_hours: number;
    experience_level: string;
  }) => void;
}

const PRESET_CARDS = [
  {
    icon: Code2,
    title: "Next.js & Supabase",
    subtitle: "Modern Fullstack Architecture",
    timeframe: "1 Week",
    daily_hours: 2,
    experience_level: "Intermediate",
    accent: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  },
  {
    icon: Container,
    title: "Docker & Kubernetes",
    subtitle: "Cloud-Native Containerization",
    timeframe: "3 Days",
    daily_hours: 3,
    experience_level: "Beginner",
    accent: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  },
  {
    icon: Cpu,
    title: "System Design",
    subtitle: "Large-Scale Distributed Systems",
    timeframe: "2 Weeks",
    daily_hours: 2.5,
    experience_level: "Intermediate",
    accent: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  {
    icon: BrainCircuit,
    title: "Machine Learning & PyTorch",
    subtitle: "From Neural Nets to Transformers",
    timeframe: "1 Month",
    daily_hours: 2,
    experience_level: "Beginner",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
];

export function EmptyStateHero({
  onOpenModal,
  onGeneratePreset,
}: EmptyStateHeroProps) {
  const scrollToPresets = () => {
    const el = document.getElementById("quick-starts");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="py-8 sm:py-14 space-y-12 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Curriculum Architect</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Turn any learning goal into a <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-300 bg-clip-text text-transparent">
            clear, actionable roadmap.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Build a personalized curriculum, practice with focused sprints, and track your progress from first principles to real-world projects.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={onOpenModal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.01] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Create your study plan</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={scrollToPresets}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0D111B] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition cursor-pointer"
          >
            Explore quick starts
          </button>
        </div>
      </div>

      {/* Abstract CSS Roadmap Graphic */}
      <div className="relative py-4 px-6 bg-[#0D111B]/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-3">
          <span>01. Pedagogy Decomposition</span>
          <span className="text-indigo-400 font-semibold">&gt;&gt; Time-Boxed Daily Sprints</span>
          <span>03. Mastery</span>
        </div>

        {/* Stepper bar */}
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800" />
          <div className="relative z-10 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
            1
          </div>
          <div className="relative z-10 w-7 h-7 rounded-full bg-slate-800 border border-indigo-500/50 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
            2
          </div>
          <div className="relative z-10 w-7 h-7 rounded-full bg-slate-850 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-bold font-mono">
            3
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-2">
          <span>Define Skill Boundary</span>
          <span>70% Hands-on Practice</span>
          <span>Deliver Capstone</span>
        </div>
      </div>

      {/* 4 Preset Cards */}
      <div id="quick-starts" className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Featured Curriculums
          </span>
          <span className="text-xs text-slate-500">1-click instant load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PRESET_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() =>
                  onGeneratePreset({
                    topic: card.title,
                    timeframe: card.timeframe,
                    daily_hours: card.daily_hours,
                    experience_level: card.experience_level,
                  })
                }
                className="group relative p-4 rounded-xl bg-[#0D111B] hover:bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${card.accent}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400">{card.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                </div>

                <div className="flex items-center gap-2 mt-3.5 text-[11px] font-mono text-slate-400">
                  <span className="bg-[#070A11] border border-slate-800/80 px-2 py-0.5 rounded">
                    {card.timeframe}
                  </span>
                  <span>•</span>
                  <span className="bg-[#070A11] border border-slate-800/80 px-2 py-0.5 rounded">
                    {card.daily_hours}h / day
                  </span>
                  <span>•</span>
                  <span>{card.experience_level}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Understated Value Propositions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-left">
        <div className="p-4 rounded-xl bg-[#0D111B]/60 border border-slate-800/60">
          <Target className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-200">Practice-first learning</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            70% coding exercises and active debugging; 30% conceptual foundation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D111B]/60 border border-slate-800/60">
          <Clock className="w-4 h-4 text-indigo-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-200">Time-boxed study sessions</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Strict task durations conform to your available schedule to eliminate burnout.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D111B]/60 border border-slate-800/60">
          <Timer className="w-4 h-4 text-amber-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-200">Built-in focus tracking</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Launch embedded Pomodoro timers with native Web Audio chime alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
