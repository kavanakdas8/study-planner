"use client";

import React from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";

interface LandingPageProps {
  onBuildPlan: () => void;
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
  onOpenDashboard?: () => void;
  hasExistingWorkspace?: boolean;
}

const FEATURES = [
  {
    title: "Structured Learning Roadmaps",
    description:
      "Organize complex subjects into clear modules, topics, and sequential milestones with prerequisite tracking.",
  },
  {
    title: "Integrated Focus Timer",
    description:
      "Built-in Pomodoro and deep work timer sessions linked directly to your active curriculum tasks.",
  },
  {
    title: "Actionable Progress Analytics",
    description:
      "Track daily study consistency, time distribution across modules, and completion velocity in real time.",
  },
  {
    title: "Multi-Format Export & Sync",
    description:
      "Export your roadmap to formatted PDF reports, Markdown checklists, or ICS calendar schedules.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Define Your Learning Goal",
    description:
      "Enter any subject, language, or technical skill along with your preferred pace and timeline.",
  },
  {
    step: "02",
    title: "Commit to a Realistic Daily Pace",
    description:
      "Choose a daily study block that fits your routine—whether 30 minutes or 3+ hours a day.",
  },
  {
    step: "03",
    title: "Track Progress Inside Your Workspace",
    description:
      "Enter your CuratePlan dashboard to manage tasks across roadmap, kanban, timeline, and analytics views.",
  },
];

export function LandingPage({
  onBuildPlan,
  onNavigateLogin,
  onNavigateSignup,
  onOpenDashboard,
  hasExistingWorkspace = false,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#ECFDF5] selection:text-[#047857]">
      <LandingNavbar
        onNavigateLogin={onNavigateLogin}
        onNavigateSignup={onNavigateSignup}
        onOpenDashboard={onOpenDashboard}
        hasExistingWorkspace={hasExistingWorkspace}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <LandingHero onBuildPlan={onBuildPlan} />

        {/* Features Section */}
        <section
          id="features"
          className="py-16 sm:py-20 bg-white border-b border-[#E2E8F0]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Everything you need to stay consistent
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 hover:border-[#CBD5E1] transition"
                >
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-20 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center space-y-2 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
                Simple Workflow
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                From ambition to structured execution
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3"
                >
                  <span className="inline-block text-xs font-mono font-bold text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] px-2.5 py-1 rounded-lg">
                    Step {item.step}
                  </span>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="py-16 bg-white border-t border-[#E2E8F0]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center mx-auto">
              <BrandLogo className="w-12 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              Built for focused, self-directed learners
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed max-w-2xl mx-auto">
              CuratePlan bridges the gap between setting an ambitious goal and finishing it.
              With local-first storage, distraction-free focus timers, and transparent progress
              tracking, your study plans stay completely under your control.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-7 h-5" />
            <span className="font-bold text-[#0F172A]">CuratePlan</span>
            <span className="text-[#94A3B8]">· Plan Smarter. Learn Better.</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="hover:text-[#059669] transition cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onNavigateSignup}
              className="hover:text-[#059669] transition cursor-pointer"
            >
              Sign Up
            </button>
            {hasExistingWorkspace && onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="hover:text-[#059669] font-semibold transition cursor-pointer"
              >
                Open Workspace
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

