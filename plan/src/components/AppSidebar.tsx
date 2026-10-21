"use client";

import React, { useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  History,
  Timer,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  FolderGit2,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import { SavedPlan, ActiveTimer } from "@/types/study";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  savedPlans: SavedPlan[];
  activePlanId: string | null;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (planId: string) => void;
  onOpenCreateModal: () => void;
  onOpenHistoryModal: () => void;
  activeTimer: ActiveTimer | null;
  completedTasksMap: Record<string, boolean>;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  savedPlans,
  activePlanId,
  onSelectPlan,
  onDeletePlan,
  onOpenCreateModal,
  onOpenHistoryModal,
  activeTimer,
  completedTasksMap,
}: AppSidebarProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Active plan stats for the sidebar HUD
  const activePlan = savedPlans.find((p) => p.id === activePlanId);
  let activePlanProgress = 0;
  if (activePlan) {
    let total = 0;
    let completed = 0;
    activePlan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((_, tIdx) => {
        total++;
        if (completedTasksMap[`${activePlan.id}_${pIdx}_${tIdx}`]) completed++;
      });
    });
    if (total > 0) activePlanProgress = Math.round((completed / total) * 100);
  }

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D111B] border-r border-slate-800/80 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm shadow-indigo-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-sm font-bold text-white tracking-tight">Study Planner</span>
              <span className="ml-1.5 text-[10px] font-mono text-indigo-400 font-semibold uppercase px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20">
                AI
              </span>
            </div>
          )}
        </div>

        {/* Collapse button on desktop */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
          className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action: Create Plan */}
      <div className="p-3 border-b border-slate-800/60">
        <button
          type="button"
          onClick={() => {
            onOpenCreateModal();
            onCloseMobile();
          }}
          title={`Create New Plan (${shortcutKey})`}
          className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-medium text-xs transition cursor-pointer shadow-sm shadow-indigo-950/40 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
            {!collapsed && <span>New Plan</span>}
          </span>
          {!collapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-950/80 border border-indigo-800/50 rounded text-indigo-300">
              {shortcutKey}
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2 space-y-6 scrollbar-thin">
        {/* Section: My Workspace */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              My Workspace
            </div>
          )}

          {/* Current Dashboard */}
          <button
            type="button"
            onClick={onCloseMobile}
            title="Current Dashboard"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activePlanId
                ? "bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
            {!collapsed && <span className="truncate">Active Curriculum</span>}
          </button>

          {/* Study History */}
          <button
            type="button"
            onClick={() => {
              onOpenHistoryModal();
              onCloseMobile();
            }}
            title="Study History"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <History className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsed && <span>Study History ({savedPlans.length})</span>}
          </button>

          {/* Focus Sessions Pill */}
          <div
            title={activeTimer ? `Timer running: ${activeTimer.taskTitle}` : "No active timer"}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTimer && activeTimer.isRunning
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                : "text-slate-500"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Timer className={`w-4 h-4 shrink-0 ${activeTimer?.isRunning ? "text-amber-400 animate-pulse" : ""}`} />
              {!collapsed && <span>Focus Mode</span>}
            </span>
            {!collapsed && activeTimer && (
              <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Section: Saved Plans List */}
        {!collapsed && (
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Saved Roadmaps</span>
              <span className="font-mono text-slate-400">{savedPlans.length}</span>
            </div>

            {savedPlans.length === 0 ? (
              <div className="px-2.5 py-3 text-[11px] text-slate-500 italic">
                No curricula saved yet.
              </div>
            ) : (
              <div className="space-y-1">
                {savedPlans.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        onSelectPlan(plan);
                        onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                        isActive
                          ? "bg-slate-800/90 text-white font-medium shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                        <span className="truncate">{plan.subject}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500 group-hover:hidden">
                          {plan.target_timeframe}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete plan "${plan.subject}"?`)) {
                              onDeletePlan(plan.id);
                            }
                          }}
                          className="hidden group-hover:flex p-1 text-slate-500 hover:text-red-400 rounded transition"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section: Current Plan Progress Widget */}
        {!collapsed && activePlan && (
          <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Progress
              </span>
              <span className="font-mono text-white">{activePlanProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${activePlanProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {activePlan.subject}
            </div>
          </div>
        )}
      </div>

      {/* Footer Rail */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        {!collapsed ? (
          <>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <span className="font-mono text-[10px] text-slate-400">v1.2.0</span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
            className="w-full flex justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Dialog Modal */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0D111B] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Study Planner Settings</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="font-semibold text-white block mb-0.5">Model Engine</span>
                <span className="text-slate-400">Google Gemini 3.5 Flash / Flash-Lite</span>
              </div>
              <div>
                <span className="font-semibold text-white block mb-0.5">Storage Mode</span>
                <span className="text-slate-400">Client-side LocalStorage (Safe & Private)</span>
              </div>
              <div>
                <span className="font-semibold text-white block mb-0.5">Audio Synthesis</span>
                <span className="text-slate-400">Native Web Audio API oscillators</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 shrink-0 h-screen sticky top-0 z-30 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[80vw] h-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
}
