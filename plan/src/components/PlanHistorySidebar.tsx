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
  Sparkles,
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
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-[#121316] border-r border-[#1f2128] h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1f2128] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#f97316]" />
            <h2 className="text-sm font-bold text-white tracking-tight">Study History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#181a1f] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Plan Action */}
        <div className="p-3 border-b border-[#1f2128]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewPlanModal();
            }}
            className="w-full bg-[#ea580c]/15 hover:bg-[#ea580c]/25 border border-[#ea580c]/30 hover:border-[#ea580c]/50 text-[#f97316] font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#f97316]" />
            <span className="font-semibold text-white">Create New Curriculum</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#1f2128]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search past roadmaps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#1f2128] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ea580c]"
            />
          </div>
        </div>

        {/* Plans list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 text-[#f97316]" />
              {savedPlans.length === 0
                ? "No saved study plans yet. Create your first one!"
                : "No matching plans found."}
            </div>
          ) : (
            filtered.map((plan) => {
              const progress = calculatePlanProgress(plan);
              const isActive = plan.id === activePlanId;
              const dateStr = new Date(plan.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    onSelectPlan(plan);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#181a1f] border-[#f97316]/50 shadow-sm"
                      : "bg-[#0a0a0c]/60 hover:bg-[#181a1f]/60 border-[#1f2128] hover:border-[#2a2d36]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={`text-xs font-semibold line-clamp-1 ${
                        isActive ? "text-[#f97316]" : "text-white"
                      }`}
                    >
                      {plan.subject}
                    </h4>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete plan "${plan.subject}"?`)) {
                          onDeletePlan(plan.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 rounded hover:bg-[#181a1f] transition"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {plan.target_timeframe}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {plan.daily_hours}h/d
                    </span>
                    <span className="text-slate-500 ml-auto font-mono">{dateStr}</span>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 bg-[#0a0a0c] h-1.5 rounded-full overflow-hidden border border-[#1f2128]">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {progress}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
