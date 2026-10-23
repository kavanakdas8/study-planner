"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  BookOpen,
  Trash2,
  X,
  Sparkles,
  Layers,
  Flame,
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
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
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
  activeNavTab = "dashboard",
  onSelectNavTab,
}: AppSidebarProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Active plan stats for the sidebar
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

  const handleNavClick = (tabId: string) => {
    if (onSelectNavTab) {
      onSelectNavTab(tabId);
    }
    if (tabId === "history") {
      onOpenHistoryModal();
    } else if (tabId === "settings") {
      setShowSettingsModal(true);
    }
    onCloseMobile();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "curriculum", label: "Curriculum Roadmap", icon: MapPin },
    { id: "analytics", label: "Analytics & Progress", icon: BarChart3 },
    { id: "export", label: "Export & Sync", icon: Share2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#121316] border-r border-[#1f2128] text-slate-300 select-none">
      {/* Brand & Workspace Switcher Row */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1f2128] shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Stylized Logo with Industrial Orange Accent */}
          <div className="w-8 h-8 rounded-lg bg-[#ea580c]/15 border border-[#ea580c]/30 flex items-center justify-center text-[#f97316] shrink-0 shadow-sm shadow-orange-950/40">
            <Flame className="w-4 h-4 fill-[#f97316]" />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight truncate">
                  AI Study Planner
                </span>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30">
                  SaaS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="text-[11px] text-[#9ca3af] hover:text-white flex items-center gap-1 transition text-left cursor-pointer truncate"
              >
                <span className="truncate">Sprint Workspace</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
          className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#181a1f] border border-transparent hover:border-[#1f2128] transition cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#181a1f] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action Button: New Sprint / Generate Plan */}
      <div className="p-3 border-b border-[#1f2128]">
        <button
          type="button"
          onClick={() => {
            onOpenCreateModal();
            onCloseMobile();
          }}
          title={`Generate Plan (${shortcutKey})`}
          className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl bg-[#ea580c]/15 hover:bg-[#ea580c]/25 border border-[#ea580c]/35 hover:border-[#ea580c]/50 text-[#f97316] font-medium text-xs transition cursor-pointer shadow-sm shadow-orange-950/20 ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-[#f97316] group-hover:scale-110 transition" />
            {!collapsed && <span className="font-semibold text-white">Generate Plan</span>}
          </span>
          {!collapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#0a0a0c] border border-[#1f2128] rounded text-[#9ca3af]">
              {shortcutKey}
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-6 scrollbar-thin">
        {/* Section: Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-[#181a1f]"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#f97316]" : "text-slate-400 group-hover:text-white"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Section: Saved Roadmaps / Curricula */}
        {!collapsed && (
          <div className="space-y-1.5 pt-3 border-t border-[#1f2128]">
            <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Saved Roadmaps</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#0a0a0c] border border-[#1f2128] text-slate-400">
                {savedPlans.length}
              </span>
            </div>

            {savedPlans.length === 0 ? (
              <div className="px-2.5 py-3 text-[11px] text-slate-500 italic">
                No curricula saved yet.
              </div>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                {savedPlans.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        onSelectPlan(plan);
                        onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer border ${
                        isActive
                          ? "bg-[#181a1f] text-white border-[#2a2d36] font-medium shadow-sm"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#181a1f]/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <BookOpen
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-[#f97316]" : "text-slate-500"
                          }`}
                        />
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

        {/* Active Focus Mode Card Widget */}
        {activeTimer && !collapsed && (
          <div className="p-3 bg-[#0a0a0c] border border-[#ea580c]/30 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#f97316]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
                Active Focus Session
              </span>
              <span className="font-mono text-[10px] bg-[#ea580c]/15 px-1.5 py-0.5 rounded text-[#f97316]">
                {activeTimer.isRunning ? "Running" : "Paused"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">
              {activeTimer.taskTitle}
            </p>
          </div>
        )}

        {/* Active Plan Progress Mini Gauge */}
        {!collapsed && activePlan && (
          <div className="p-3 bg-[#0a0a0c] border border-[#1f2128] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sprint Progress
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {activePlanProgress}%
              </span>
            </div>
            <div className="w-full bg-[#181a1f] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 shadow-sm shadow-emerald-500/30"
                style={{ width: `${activePlanProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {activePlan.subject}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#1f2128] bg-[#0d0d11]/80">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-[#1f2128] border border-[#2a2d36] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Alex Chen</div>
              <div className="text-[11px] text-slate-500 truncate">alex.chen@study.dev</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              title="Alex Chen (alex.chen@study.dev)"
              className="w-8 h-8 rounded-full bg-[#1f2128] border border-[#2a2d36] flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer"
            >
              AC
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#121316] border border-[#1f2128] rounded-2xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1f2128] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Settings className="w-4 h-4 text-[#f97316]" />
                <span>Enterprise Dashboard Settings</span>
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
                <span className="font-semibold text-white block mb-0.5">Design System</span>
                <span className="text-[#9ca3af]">Obsidian / Dark Glassmorphism SaaS</span>
              </div>
              <div>
                <span className="font-semibold text-white block mb-0.5">AI Engine</span>
                <span className="text-[#9ca3af]">Google Gemini 3.5 Flash Model</span>
              </div>
              <div>
                <span className="font-semibold text-white block mb-0.5">Local State</span>
                <span className="text-[#9ca3af]">Encrypted LocalStorage persistence</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2 bg-[#181a1f] hover:bg-[#1e2027] text-white border border-[#1f2128] rounded-lg text-xs font-semibold transition"
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
      {/* Desktop Persistent Rail */}
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
          className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex"
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
