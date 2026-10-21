"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { StudyPlan, SavedPlan, ActiveTimer, Task } from "@/types/study";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { HeaderKPI } from "@/components/HeaderKPI";
import { FilterBar } from "@/components/FilterBar";
import { TimelineView } from "@/components/TimelineView";
import { KanbanView } from "@/components/KanbanView";
import { FocusTimer } from "@/components/FocusTimer";
import { CreationModal } from "@/components/CreationModal";
import { PlanHistorySidebar } from "@/components/PlanHistorySidebar";
import { EmptyStateHero } from "@/components/EmptyStateHero";
import { exportPlanToMarkdown, downloadFile, generateICS, playChime } from "@/lib/utils";

const STORAGE_KEY_PLANS = "study_planner_saved_plans_v1";
const STORAGE_KEY_ACTIVE_ID = "study_planner_active_plan_id_v1";
const STORAGE_KEY_PROGRESS = "study_planner_completed_tasks_v1";
const STORAGE_KEY_VIEW_MODE = "study_planner_view_mode_v1";
const STORAGE_KEY_SIDEBAR_COLLAPSED = "study_planner_sidebar_collapsed_v1";
const STORAGE_KEY_ACTIVE_TIMER = "study_planner_active_timer_v1";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // App Shell Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data State
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedTasksMap, setCompletedTasksMap] = useState<Record<string, boolean>>({});

  // UI View & Filter State
  const [viewMode, setViewMode] = useState<"timeline" | "kanban">("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("All");

  // Drawers & Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Focus Timer State
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Network State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Hydration load from localStorage
  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(STORAGE_KEY_PLANS);
      const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      const storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
      const storedView = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
      const storedSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
      const storedTimer = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);

      if (storedPlans) {
        const parsed = JSON.parse(storedPlans) as SavedPlan[];
        setSavedPlans(parsed);
        if (storedActiveId && parsed.some((p) => p.id === storedActiveId)) {
          setActivePlanId(storedActiveId);
        } else if (parsed.length > 0) {
          setActivePlanId(parsed[0].id);
        }
      }

      if (storedProgress) {
        setCompletedTasksMap(JSON.parse(storedProgress));
      }

      if (storedView === "timeline" || storedView === "kanban") {
        setViewMode(storedView);
      }

      if (storedSidebar !== null) {
        setSidebarCollapsed(storedSidebar === "true");
      }

      if (storedTimer) {
        const parsedTimer = JSON.parse(storedTimer) as ActiveTimer;
        // Restore timer in paused state to avoid unexpected automatic countdown
        setActiveTimer({
          ...parsedTimer,
          isRunning: false,
        });
      }
    } catch {
      // ignore storage parsing error
    } finally {
      setMounted(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(savedPlans));
    } catch {}
  }, [savedPlans, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (activePlanId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activePlanId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch {}
  }, [activePlanId, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(completedTasksMap));
    } catch {}
  }, [completedTasksMap, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
    } catch {}
  }, [viewMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (activeTimer) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TIMER, JSON.stringify(activeTimer));
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);
      }
    } catch {}
  }, [activeTimer, mounted]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Open creation modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setError("");
        setIsModalOpen((prev) => !prev);
        return;
      }

      // [ or Cmd/Ctrl + B -> Toggle sidebar collapse
      if (
        (e.key === "[" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b")
      ) {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      // / -> Focus search filter
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active Plan Resolution
  const activePlan = useMemo(() => {
    return savedPlans.find((p) => p.id === activePlanId) || null;
  }, [savedPlans, activePlanId]);

  // Aggregate KPI stats for current plan
  const { totalCount, completedCount, totalMinutes } = useMemo(() => {
    if (!activePlan) return { totalCount: 0, completedCount: 0, totalMinutes: 0 };

    let total = 0;
    let completed = 0;
    let minutes = 0;

    activePlan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((task, tIdx) => {
        total++;
        minutes += task.duration_minutes || 0;
        const key = `${activePlan.id}_${pIdx}_${tIdx}`;
        if (completedTasksMap[key]) {
          completed++;
        }
      });
    });

    return { totalCount: total, completedCount: completed, totalMinutes: minutes };
  }, [activePlan, completedTasksMap]);

  // API Generate Plan Handler
  const handleGeneratePlan = async (payload: {
    topic: string;
    timeframe: string;
    daily_hours: number;
    experience_level: string;
  }) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.detail || `Server returned error (${res.status}). Ensure backend is active.`
        );
      }

      const planData: StudyPlan = await res.json();

      const newSavedPlan: SavedPlan = {
        ...planData,
        id: `plan_${Date.now()}`,
        createdAt: Date.now(),
        daily_hours: payload.daily_hours,
        experience_level: payload.experience_level,
      };

      setSavedPlans((prev) => [newSavedPlan, ...prev]);
      setActivePlanId(newSavedPlan.id);
      setIsModalOpen(false);
      playChime("complete");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Toggle single task completion
  const handleToggleTask = (taskId: string) => {
    setCompletedTasksMap((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Start Focus Session
  const handleStartFocus = (task: Task, taskId: string, periodLabel: string) => {
    playChime("click");
    const seconds = (task.duration_minutes || 30) * 60;
    setActiveTimer({
      taskId,
      taskTitle: task.title,
      periodLabel,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
      lastTickAt: Date.now(),
    });
  };

  // Export Plan to Markdown
  const handleExportMarkdown = () => {
    if (!activePlan) return;
    playChime("click");
    const md = exportPlanToMarkdown(activePlan, activePlan.daily_hours, completedTasksMap);
    const safeName = activePlan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(`${safeName}-study-plan.md`, md, "text/markdown;charset=utf-8");
  };

  // Export Plan to ICS Calendar
  const handleExportICS = () => {
    if (!activePlan) return;
    const ics = generateICS(activePlan);
    const safeName = activePlan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(`${safeName}-curriculum.ics`, ics, "text/calendar;charset=utf-8");
  };

  // Reset Completed checkmarks for active plan
  const handleClearCompleted = () => {
    if (!activePlan) return;
    if (confirm("Reset all completed task checkmarks for this study plan?")) {
      playChime("click");
      setCompletedTasksMap((prev) => {
        const next = { ...prev };
        activePlan.schedule.forEach((_, pIdx) => {
          activePlan.schedule[pIdx].tasks.forEach((_, tIdx) => {
            delete next[`${activePlan.id}_${pIdx}_${tIdx}`];
          });
        });
        return next;
      });
    }
  };

  // Delete plan from storage
  const handleDeletePlan = (planId: string) => {
    playChime("click");
    setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
    if (activePlanId === planId) {
      const remaining = savedPlans.filter((p) => p.id !== planId);
      setActivePlanId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center text-slate-500 font-mono text-xs">
        Initializing Study Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A11] text-[#F1F5F9] flex overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle Ambient Radial Lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.18), transparent)",
        }}
      />

      {/* Primary Left Navigation Rail */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={(plan) => setActivePlanId(plan.id)}
        onDeletePlan={handleDeletePlan}
        onOpenCreateModal={() => {
          setError("");
          setIsModalOpen(true);
        }}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        activeTimer={activeTimer}
        completedTasksMap={completedTasksMap}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top Bar with Breadcrumb and Actions */}
        <TopBar
          activePlan={activePlan}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateModal={() => {
            setError("");
            setIsModalOpen(true);
          }}
          onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
          onExportMarkdown={handleExportMarkdown}
          onExportICS={handleExportICS}
          onClearCompleted={handleClearCompleted}
          onFocusSearch={() => searchInputRef.current?.focus()}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
          {activePlan ? (
            <div className="space-y-6">
              {/* Dashboard Header & KPI Metrics */}
              <HeaderKPI
                plan={activePlan}
                completedCount={completedCount}
                totalCount={totalCount}
                totalMinutes={totalMinutes}
                activeTimer={activeTimer}
                onOpenCreateModal={() => {
                  setError("");
                  setIsModalOpen(true);
                }}
              />

              {/* Filter & View Switcher Toolbar */}
              <FilterBar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                resourceFilter={resourceFilter}
                onResourceFilterChange={setResourceFilter}
                searchInputRef={searchInputRef}
              />

              {/* View Modes */}
              {viewMode === "timeline" ? (
                <TimelineView
                  plan={activePlan}
                  completedTasksMap={completedTasksMap}
                  onToggleTask={handleToggleTask}
                  onStartFocus={handleStartFocus}
                  activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
                  searchQuery={searchQuery}
                  resourceFilter={resourceFilter}
                />
              ) : (
                <KanbanView
                  plan={activePlan}
                  completedTasksMap={completedTasksMap}
                  onToggleTask={handleToggleTask}
                  onStartFocus={handleStartFocus}
                  activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
                  searchQuery={searchQuery}
                  resourceFilter={resourceFilter}
                />
              )}
            </div>
          ) : (
            /* Empty State when no active plan */
            <EmptyStateHero
              onOpenModal={() => {
                setError("");
                setIsModalOpen(true);
              }}
              onGeneratePreset={(preset) => {
                setIsModalOpen(true);
                handleGeneratePlan(preset);
              }}
            />
          )}
        </main>
      </div>

      {/* Global Floating Focus Timer Companion */}
      <FocusTimer
        timer={activeTimer}
        onUpdate={setActiveTimer}
        onCompleteTask={(taskId) => {
          handleToggleTask(taskId);
          playChime("complete");
        }}
        onClose={() => setActiveTimer(null)}
      />

      {/* Command Palette Creation Modal */}
      <CreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGeneratePlan}
        loading={loading}
        error={error}
      />

      {/* Slide-out Plan History Drawer */}
      <PlanHistorySidebar
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={(p) => setActivePlanId(p.id)}
        onDeletePlan={handleDeletePlan}
        onOpenNewPlanModal={() => {
          setError("");
          setIsModalOpen(true);
        }}
        completedTasksMap={completedTasksMap}
      />
    </div>
  );
}