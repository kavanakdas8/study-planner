"use client";

import React from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Target,
  TrendingUp,
} from "lucide-react";

export function LandingHero() {
  const scrollToCourseSelection = () => {
    const el = document.getElementById("course-selection");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-[#E2E8F0]">
      {/* Subtle Light Ambient Gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 10%, rgba(5,150,105,0.06), transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Expressive Hero Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Structured Learning Workspace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12]">
              Make Every Day Count.{" "}
              <span className="text-[#059669]">
                Learn Something That Matters.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl">
              Your goals deserve a plan. Build a structured learning roadmap, stay
              consistent, and turn your ambitions into real progress.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToCourseSelection}
                className="px-6 py-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <span>Start Your Learning Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={scrollToFeatures}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] font-semibold text-sm flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Subtle Key Value Points */}
            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#475569]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Custom curriculum pacing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Built-in focus timer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Progress analytics</span>
              </div>
            </div>
          </div>

          {/* Right Column: Polished EdTech Dashboard & Roadmap Illustration */}
          <div className="lg:col-span-6 relative">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-5 sm:p-6 space-y-5 relative z-10">
              {/* Mock Course Card Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] text-[10px] font-bold uppercase tracking-wider">
                      Active Track
                    </span>
                    <span className="text-xs text-[#94A3B8] font-medium">
                      12 Weeks · 1.5h / day
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    Machine Learning Engineering
                  </h2>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-extrabold text-[#059669]">
                    68%
                  </span>
                  <span className="block text-[10px] font-medium text-[#94A3B8]">
                    Roadmap Progress
                  </span>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full w-[68%] bg-[#059669] rounded-full" />
                </div>
              </div>

              {/* Structured Weekly Curriculum Milestones */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#059669]" />
                    Curriculum Roadmap
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Module 3 of 4
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Completed Module */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          Week 1–2 · Python & Linear Algebra Foundations
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          8/8 sessions completed
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded shrink-0">
                      Done
                    </span>
                  </div>

                  {/* Active Module */}
                  <div className="p-3 rounded-xl bg-white border-2 border-[#059669]/40 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        3
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          Week 3–6 · Supervised Learning & Evaluation
                        </p>
                        <p className="text-[11px] text-[#475569]">
                          Next: Gradient Descent & Cross-Validation (45m)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#059669]" />
                      In Progress
                    </span>
                  </div>

                  {/* Upcoming Module */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 opacity-80">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] flex items-center justify-center text-[11px] font-bold shrink-0">
                        4
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          Week 7–12 · Neural Networks & Capstone Project
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Scheduled milestone · 6 modules
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Weekly Study Schedule & Consistency Strip */}
              <div className="pt-3 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#475569] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                      Weekly Schedule
                    </span>
                    <span className="text-[10px] font-mono text-[#059669] font-semibold">
                      5/7 days
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { day: "M", active: true },
                      { day: "T", active: true },
                      { day: "W", active: true },
                      { day: "T", active: true },
                      { day: "F", active: true },
                      { day: "S", active: false },
                      { day: "S", active: false },
                    ].map((d, i) => (
                      <div
                        key={i}
                        className={`h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          d.active
                            ? "bg-[#059669] text-white"
                            : "bg-white border border-[#E2E8F0] text-[#94A3B8]"
                        }`}
                      >
                        {d.day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#D1FAE5] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                      Study Velocity
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-extrabold text-[#0F172A]">
                      10.5 hrs
                    </span>
                    <span className="text-[11px] text-[#475569] block">
                      logged this week · on target
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

