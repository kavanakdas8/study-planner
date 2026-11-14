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
  Pencil,
  Check,
  Archive,
} from "lucide-react";
import { SavedPlan } from "@/types/study";

interface PlanHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: SavedPlan[];
  activePlanId: string | null;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (planId: string) => void;
  onRenamePlan?: (planId: string, newSubject: string) => void;
  onToggleArchivePlan?: (planId: string) => void;
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
  onRenamePlan,
  onToggleArchivePlan,
  onOpenNewPlanModal,
  completedTasksMap,
}: PlanHistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">("all");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (!isOpen) return null;

  const filtered = savedPlans.filter((p) => {
    const matchesSearch = (p.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "active") return !p.isArchived;
    if (activeTab === "archived") return !!p.isArchived;
    return true;
  });

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

  const handleStartRename = (plan: SavedPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlanId(plan.id);
    setEditTitle(plan.subject);
  };

  const handleSaveRename = (planId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim() && onRenamePlan) {
      onRenamePlan(planId, editTitle.trim());
    }
    setEditingPlanId(null);
  };

  const handleArchiveToggle = (plan: SavedPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = plan.isArchived ? "Unarchive" : "Archive";
    if (confirm(`${action} curriculum "${plan.subject}"?`)) {
      if (onToggleArchivePlan) {
        onToggleArchivePlan(plan.id);
      }
    }
  };

  const handleDelete = (plan: SavedPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete "${plan.subject}"? This action cannot be undone.`)) {
      onDeletePlan(plan.id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Study History"
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

        {/* Filter Tabs & Search */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              All ({savedPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                activeTab === "active"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Active ({savedPlans.filter((p) => !p.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={`flex-1 py-1 rounded-md transition cursor-pointer ${
                activeTab === "archived"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Archived ({savedPlans.filter((p) => p.isArchived).length})
            </button>
          </div>

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
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No curricula found.
            </div>
          ) : (
            filtered.map((plan) => {
              const isActive = plan.id === activePlanId;
              const isEditing = editingPlanId === plan.id;
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
                    if (!isEditing) {
                      onSelectPlan(plan);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? "bg-emerald-50/70 border-emerald-300 shadow-2xs"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  } ${plan.isArchived ? "opacity-75" : ""}`}
                >
                  {/* Top Bar: Title or Edit Form + Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveRename(plan.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 mb-1"
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            className="flex-1 px-2 py-1 text-xs border border-emerald-500 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 transition cursor-pointer"
                            title="Save name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlanId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookOpen
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? "text-emerald-700" : "text-slate-400"
                            }`}
                          />
                          <h3 className="text-xs font-semibold text-slate-900 truncate">
                            {plan.subject}
                          </h3>
                          {plan.isArchived && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                              Archived
                            </span>
                          )}
                        </div>
                      )}

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

                    {/* Action Buttons: Rename, Archive, Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {onRenamePlan && (
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(plan, e)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition cursor-pointer opacity-75 group-hover:opacity-100"
                            title="Rename curriculum"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {onToggleArchivePlan && (
                          <button
                            type="button"
                            onClick={(e) => handleArchiveToggle(plan, e)}
                            className={`p-1 rounded transition cursor-pointer opacity-75 group-hover:opacity-100 ${
                              plan.isArchived
                                ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title={plan.isArchived ? "Unarchive curriculum" : "Archive curriculum"}
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(plan, e)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer opacity-75 group-hover:opacity-100"
                          title="Delete curriculum"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
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
