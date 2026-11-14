"use client";

import React from "react";
import { BrandLogo } from "./BrandLogo";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About CuratePlan"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-8 h-6" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">CuratePlan</h2>
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Plan Smarter. Learn Better.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            CuratePlan is a focused, autonomous study curriculum planner and deep work platform. It transforms broad learning subjects into structured, milestone-driven daily roadmaps.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">AI Curriculum Generation</span>
              <span className="text-[11px] text-slate-500">Autonomous curriculum generation powered by Google Gemini and FastAPI.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Deep Focus Mode</span>
              <span className="text-[11px] text-slate-500">Integrated Pomodoro timer with interval chime alerts and task session tracking.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Study History & Roadmaps</span>
              <span className="text-[11px] text-slate-500">Organize, rename, archive, and manage multiple learning curricula seamlessly.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block">Local-First & Privacy Preserving</span>
              <span className="text-[11px] text-slate-500">All data stays in your browser. No mandatory account, no telemetry, zero vendor lock-in.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
