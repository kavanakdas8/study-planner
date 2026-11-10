"use client";

import React from "react";
import {
  ArrowRight,
  Code2,
  Container,
  Cpu,
  BrainCircuit,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
    subtitle: "Modern fullstack SaaS application engineering",
    timeframe: "1 Week",
    daily_hours: 2,
    experience_level: "Intermediate",
  },
  {
    icon: Cpu,
    title: "Distributed Systems & Go",
    subtitle: "Consensus, Raft protocol, and RPC networks",
    timeframe: "2 Weeks",
    daily_hours: 3,
    experience_level: "Advanced",
  },
  {
    icon: Container,
    title: "Docker & Kubernetes Orchestration",
    subtitle: "Cloud-native infrastructure and container pipelines",
    timeframe: "3 Days",
    daily_hours: 2.5,
    experience_level: "Beginner",
  },
  {
    icon: BrainCircuit,
    title: "Deep Learning & PyTorch",
    subtitle: "Neural network foundations to transformer fine-tuning",
    timeframe: "1 Month",
    daily_hours: 2,
    experience_level: "Intermediate",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <BrandLogo className="w-5 h-3.5" />
          <span>CuratePlan Curriculum Architect</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Plan Smarter. Learn Better. <br className="hidden sm:inline" />
          <span className="text-emerald-600">
            High-velocity study roadmaps.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Deconstruct complex topics into structured milestones, practice with time-boxed daily sprints, and track real progress in an enterprise workspace.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={onOpenModal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01] cursor-pointer"
          >
            <span>Create Custom Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={scrollToPresets}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition cursor-pointer shadow-2xs"
          >
            Explore Curriculum Templates
          </button>
        </div>
      </div>

      {/* Suggested Curricula Grid */}
      <div id="quick-starts" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Suggested Curricula
          </h2>
          <span className="text-xs text-slate-500">1-click roadmap generation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESET_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() =>
                  onGeneratePreset({
                    topic: card.title,
                    timeframe: card.timeframe,
                    daily_hours: card.daily_hours,
                    experience_level: card.experience_level,
                  })
                }
                className="group p-4.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {card.timeframe}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {card.daily_hours} hrs/day • {card.experience_level}
                  </span>
                  <span className="text-emerald-600 font-medium group-hover:translate-x-0.5 transition flex items-center gap-1">
                    Start <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
