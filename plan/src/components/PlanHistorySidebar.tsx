"use client";

import React, { useState } from "react";
import {
  History,
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Search,
  BookOpen,
} from "lucide-react";
import { SavedPlan } from "@/types/study";

interface PlanHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: SavedPlan[];
  activePlanId: string | null;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (planId: string) => void;
  onOpenNewPlanModal: () => void;
  completedTasksMap: Record<string, boolean>;
}

export function PlanHistorySidebar({
  isOpen,
  onClose,
  savedPlans,
  activePlanId,
  onSelectPlan,
  onDeletePlan,
  onOpenNewPlanModal,
  completedTasksMap,
}: PlanHistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = savedPlans.filter((p) =>
    (p.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculatePlanProgress = (plan: SavedPlan) => {
    let total = 0;
    let completed = 0;
    plan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((_, tIdx) => {
        total++;
        const key = `${plan.id}_${pIdx}_${tIdx}`;
        if (completedTasksMap[key]) completed++;
      });
    });
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Study Plan History"
      className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-white border-r border-slate-200 h-full flex flex-col shadow-2xl overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Study History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Plan Action */}
        <div className="p-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewPlanModal();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-semibold">Create New Curriculum</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Plans List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No curricula found.
            </div>
          ) : (
            filtered.map((plan) => {
              const isActive = plan.id === activePlanId;
              const progress = calculatePlanProgress(plan);
              const dateStr = plan.createdAt
                ? new Date(plan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    onSelectPlan(plan);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen
                          className={`w-3.5 h-3.5 ${
                            isActive ? "text-emerald-700" : "text-slate-400"
                          }`}
                        />
                        <h3 className="text-xs font-semibold text-slate-900 truncate">
                          {plan.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {plan.target_timeframe}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete curriculum "${plan.subject}"?`)) {
                          onDeletePlan(plan.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition opacity-0 group-hover:opacity-100"
                      title="Delete curriculum"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <div className="flex-1 mr-3 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-600 font-semibold">{progress}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
