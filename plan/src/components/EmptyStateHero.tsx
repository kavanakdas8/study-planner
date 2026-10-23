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
  Flame,
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
    title: "Next.js & Supabase Architecture",
    subtitle: "Enterprise fullstack SaaS roadmap",
    timeframe: "1 Week",
    daily_hours: 2,
    experience_level: "Intermediate",
    accent: "text-[#f97316] border-[#ea580c]/30 bg-[#ea580c]/10",
  },
  {
    icon: Cpu,
    title: "Distributed Systems & Go",
    subtitle: "Consensus, Raft, and RPC engineering",
    timeframe: "2 Weeks",
    daily_hours: 3,
    experience_level: "Advanced",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    icon: Container,
    title: "Docker & Kubernetes Orchestration",
    subtitle: "Cloud-native infrastructure and deployments",
    timeframe: "3 Days",
    daily_hours: 2.5,
    experience_level: "Beginner",
    accent: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  },
  {
    icon: BrainCircuit,
    title: "Deep Learning & PyTorch",
    subtitle: "From Neural Networks to LLM Fine-Tuning",
    timeframe: "1 Month",
    daily_hours: 2,
    experience_level: "Intermediate",
    accent: "text-purple-400 border-purple-500/30 bg-purple-500/10",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ea580c]/15 border border-[#ea580c]/30 text-[#f97316] text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 fill-[#f97316]" />
          <span>Intelligent Curriculum Architect</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Turn any learning goal into a <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
            clear, high-velocity roadmap.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#9ca3af] max-w-2xl mx-auto leading-relaxed">
          Deconstruct complex engineering topics into connected milestones, practice with time-boxed daily sprints, and track real progress in an enterprise workspace.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={onOpenModal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition hover:scale-[1.01] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Generate Study Plan</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={scrollToPresets}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#121316] hover:bg-[#181a1f] border border-[#1f2128] text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition cursor-pointer"
          >
            Explore Featured Tracks
          </button>
        </div>
      </div>

      {/* Featured Preset Tracks */}
      <div id="quick-starts" className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Featured Curriculums
          </span>
          <span className="text-xs text-slate-500 font-mono">1-click instant load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="group relative p-4 rounded-xl bg-[#121316] hover:bg-[#181a1f] border border-[#1f2128] hover:border-[#ea580c]/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-orange-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${card.accent}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#f97316] transition">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#9ca3af]">{card.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>

                <div className="flex items-center gap-2 mt-3.5 text-[11px] font-mono text-slate-400">
                  <span className="bg-[#0a0a0c] border border-[#1f2128] px-2 py-0.5 rounded">
                    {card.timeframe}
                  </span>
                  <span>•</span>
                  <span className="bg-[#0a0a0c] border border-[#1f2128] px-2 py-0.5 rounded">
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

      {/* 3 Value Propositions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 border-t border-[#1f2128] text-left">
        <div className="p-4 rounded-xl bg-[#121316] border border-[#1f2128]">
          <Target className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-white">Practice-First Learning</h4>
          <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
            70% coding exercises and active debugging; 30% conceptual foundation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#121316] border border-[#1f2128]">
          <Clock className="w-4 h-4 text-[#f97316] mb-2" />
          <h4 className="text-xs font-bold text-white">Time-Boxed Sprints</h4>
          <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
            Strict task durations conform to your available schedule to eliminate burnout.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#121316] border border-[#1f2128]">
          <Timer className="w-4 h-4 text-amber-400 mb-2" />
          <h4 className="text-xs font-bold text-white">Built-in Focus Tracking</h4>
          <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
            Launch embedded Pomodoro timers with native Web Audio chime alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
