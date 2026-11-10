"use client";

import React from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
    <section className="relative bg-[#F8FAFC] pt-14 pb-16 sm:pt-20 sm:pb-24 border-b border-[#E2E8F0] overflow-hidden">
      {/* Very Subtle Top-Center Ambient Accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(5,150,105,0.06), transparent 75%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        {/* Centered Hero Header Stack */}
        <div className="text-center flex flex-col items-center animate-fade-in">
          {/* Geometric Display Heading */}
          <h1 className="font-display font-extrabold text-[#0F172A] text-3xl sm:text-4xl md:text-5xl lg:text-[54px] leading-[1.1] tracking-[-0.025em] max-w-4xl mx-auto">
            Turn What You Want to Learn
            <br className="hidden md:inline" />{" "}
            Into a Plan You Can{" "}
            <span className="text-[#059669]">Actually Follow</span>.
          </h1>

          {/* Supporting Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-[17px] text-[#64748B] leading-relaxed max-w-2xl mx-auto font-normal">
            Build a structured learning roadmap, stay consistent with your daily
            goals, and turn your ambitions into measurable progress.
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={scrollToCourseSelection}
              className="px-5 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
            >
              <span>Build My Learning Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={scrollToFeatures}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] font-semibold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer"
            >
              Explore Features
            </button>
          </div>
        </div>

        {/* Subtle, Screenshot-Style Product Preview */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07)] overflow-hidden">
            {/* Minimal Workspace Frame Header */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandLogo className="w-7 h-5" />
                <span className="text-xs font-semibold text-[#0F172A] truncate">
                  CuratePlan Workspace
                </span>
                <span className="text-[#CBD5E1] hidden sm:inline">/</span>
                <span className="text-xs text-[#64748B] truncate hidden sm:inline">
                  Machine Learning Foundations
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669] text-[11px] font-semibold">
                  64% Complete
                </span>
              </div>
            </div>

            {/* Product Preview Content Grid */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-white">
              {/* Left: Learning Roadmap & Study Tasks */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                    <Layers className="w-4 h-4 text-[#059669]" />
                    <span>Curriculum Roadmap · Week 3</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    Supervised Learning &amp; Evaluation
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Completed Task */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-[#059669] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-[#64748B] line-through truncate">
                        Linear Regression &amp; Gradient Descent Implementation
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-[#64748B] hidden sm:inline">
                        45m
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] font-medium text-[#475569]">
                        Exercise
                      </span>
                    </div>
                  </div>

                  {/* Active Focus Task */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#059669]/40 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 rounded-md border-2 border-[#059669] bg-[#ECFDF5] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-[#0F172A] block truncate">
                          Cross-Validation &amp; Regularization Techniques
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-[#059669] font-semibold">
                        60m
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#D1FAE5] text-[10px] font-semibold text-[#059669]">
                        Today
                      </span>
                    </div>
                  </div>

                  {/* Upcoming Task */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 rounded-md border border-[#CBD5E1] bg-white shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-[#0F172A] truncate">
                        Decision Trees &amp; Random Forest Ensembles
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-[#64748B] hidden sm:inline">
                        40m
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-medium text-[#475569]">
                        Reading
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Progress Indicator & Weekly Study Schedule */}
              <div className="lg:col-span-5 space-y-4">
                {/* Progress Card */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">
                      Course Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-[#059669]">
                      14 / 22 tasks
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full w-[64%] bg-[#059669] rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      On track for target date
                    </span>
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                      <Clock className="w-3 h-3 text-[#059669]" />
                      1.5h / day
                    </span>
                  </div>
                </div>

                {/* Weekly Study Schedule */}
                <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#059669]" />
                      Weekly Study Schedule
                    </span>
                    <span className="text-[11px] font-medium text-[#64748B]">
                      5 of 7 days
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[
                      { day: "Mon", done: true },
                      { day: "Tue", done: true },
                      { day: "Wed", done: true },
                      { day: "Thu", done: true },
                      { day: "Fri", done: true },
                      { day: "Sat", done: false },
                      { day: "Sun", done: false },
                    ].map((item) => (
                      <div
                        key={item.day}
                        className={`py-2 rounded-lg text-center border text-[10px] font-semibold ${
                          item.done
                            ? "bg-[#ECFDF5] border-[#D1FAE5] text-[#059669]"
                            : "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]"
                        }`}
                      >
                        {item.day}
                      </div>
                    ))}
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
