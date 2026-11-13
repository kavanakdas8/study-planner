"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  Settings,
  ChevronLeft,
  Plus,
  BookOpen,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import { SavedPlan, ActiveTimer } from "@/types/study";
import { BrandLogo } from "@/components/BrandLogo";

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
  onOpenHistoryModal?: () => void;
  onReturnHome?: () => void;
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
  onReturnHome,
  activeTimer,
  completedTasksMap,
  activeNavTab = "dashboard",
  onSelectNavTab,
}: AppSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;
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
    onCloseMobile();
  };

  const workspaceNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "curriculum", label: "Curriculum Roadmap", icon: MapPin },
    { id: "analytics", label: "Analytics & Progress", icon: BarChart3 },
  ];

  const manageNavItems = [
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700 select-none transition-all duration-200">
      {/* Brand & Workspace Header */}
      <div
        className={`h-15 flex items-center border-b border-slate-200 shrink-0 ${isExpanded ? "justify-between px-4" : "justify-center px-2"
          }`}
      >
        <div
          onClick={onReturnHome}
          className={`flex items-center gap-2.5 overflow-hidden ${onReturnHome ? "cursor-pointer group hover:opacity-90 transition" : ""
            }`}
          title="Return to Home"
        >
          {/* Brand Logo */}
          <BrandLogo className="w-9 h-6" />

          {isExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-none truncate whitespace-nowrap group-hover:text-emerald-700 transition">
                CuratePlan
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5 whitespace-nowrap">
                Plan Smarter. Learn Better.
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action Button: Create / Generate Plan */}
      <div className="p-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            onOpenCreateModal();
            onCloseMobile();
          }}
          title={`Create Plan (${shortcutKey})`}
          className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-xs cursor-pointer ${!isExpanded ? "justify-center px-0" : ""
            }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            {isExpanded && <span className="font-semibold text-white whitespace-nowrap">Create Plan</span>}
          </span>
          {isExpanded && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-700/60 border border-emerald-500/40 rounded text-emerald-100">
              {shortcutKey}
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-5 scrollbar-thin">
        {/* Section: WORKSPACE */}
        <div className="space-y-0.5">
          {isExpanded && (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Workspace
            </div>
          )}

          {workspaceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition cursor-pointer ${isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/70"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                  } ${!isExpanded ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                />
                {isExpanded && <span className="truncate whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Section: MANAGE */}
        <div className="space-y-0.5 pt-2 border-t border-slate-100">
          {isExpanded && (
            <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Manage
            </div>
          )}

          {manageNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition cursor-pointer ${isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/70"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                  } ${!isExpanded ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                />
                {isExpanded && <span className="truncate whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Section: Study History */}
        {isExpanded && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Study History</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-500 font-semibold">
                {savedPlans.length}
              </span>
            </div>

            {savedPlans.length === 0 ? (
              <div className="px-2.5 py-3 text-[11px] text-slate-400 italic">
                No study history yet.
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                {savedPlans.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        onSelectPlan(plan);
                        onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer border ${isActive
                        ? "bg-emerald-50/60 text-emerald-800 border-emerald-200 font-semibold shadow-xs"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <BookOpen
                          className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"
                            }`}
                        />
                        <span className="truncate">{plan.subject}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 group-hover:hidden">
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
                          className="hidden group-hover:flex p-1 text-slate-400 hover:text-red-600 rounded transition"
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
        {activeTimer && isExpanded && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>Active Focus Session</span>
              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                {activeTimer.isRunning ? "Running" : "Paused"}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium truncate">
              {activeTimer.taskTitle}
            </p>
          </div>
        )}

        {/* Active Plan Progress Mini Gauge */}
        {isExpanded && activePlan && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Curriculum Progress
              </span>
              <span className="font-mono text-emerald-700 font-bold">
                {activePlanProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${activePlanProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 truncate font-medium">
              {activePlan.subject}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile & Workspace Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        {isExpanded ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate whitespace-nowrap">Alex Developer</div>
                <div className="text-[10px] text-slate-500 truncate whitespace-nowrap">Personal Workspace</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden md:flex p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              title="Alex Developer (Personal Workspace)"
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
            >
              AD
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Rail - Fixed to viewport so it never scrolls away */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block transition-all duration-300 ease-in-out h-screen fixed top-0 left-0 z-40 ${isExpanded ? "w-64" : "w-16"
          }`}
      >
        {sidebarContent}
      </aside>

      {/* Structural Spacer: preserves layout flow beside fixed sidebar */}
      <div
        aria-hidden="true"
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-16"
          }`}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-xs flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[80vw] h-full shadow-xl animate-fade-in"
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
