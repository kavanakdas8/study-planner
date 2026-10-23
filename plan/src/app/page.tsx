"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { StudyPlan, SavedPlan, ActiveTimer, Task } from "@/types/study";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { HeaderKPI } from "@/components/HeaderKPI";
import { TaskStreamTable } from "@/components/TaskStreamTable";
import { FilterBar, ViewMode } from "@/components/FilterBar";
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

const DEFAULT_SEED_PLAN: SavedPlan = {
  id: "plan_seed_enterprise_01",
  subject: "Full-Stack Distributed Systems Architecture",
  target_timeframe: "2 Weeks",
  daily_hours: 2.5,
  experience_level: "Advanced",
  createdAt: Date.now() - 86400000 * 2,
  overview:
    "An enterprise curriculum covering consensus protocols, RPC transport pipelines, distributed state replication, and production observability.",
  schedule: [
    {
      period_label: "Foundations & Protocol Buffers",
      topic_summary: "Core concurrency models and binary serialization protocols",
      tasks: [
        {
          title: "Implement gRPC schema and binary serializer",
          duration_minutes: 45,
          description:
            "Define Protobuf IDL contracts for distributed RPC calls. Implement client stubs and test network latency.",
          resource_type: "Exercise",
        },
        {
          title: "Review Raft protocol paper and state machine safety",
          duration_minutes: 30,
          description:
            "Deep-dive into Ongaro & Ousterhout Raft paper sections 5.1-5.4 focusing on leader election invariants.",
          resource_type: "Documentation",
        },
        {
          title: "Setup concurrent worker thread pool",
          duration_minutes: 40,
          description:
            "Construct non-blocking worker queue with backpressure signaling and mutex-free ring buffers.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Deep Dive: Consensus & Replication",
      topic_summary: "Leader election, heartbeat timers, and log quorum replication",
      tasks: [
        {
          title: "Build distributed leader election heartbeat loop",
          duration_minutes: 50,
          description:
            "Implement randomized election timeout clocks and handle split-brain vote partition edge cases.",
          resource_type: "Exercise",
        },
        {
          title: "Examine consensus failure modes in Jepsen tests",
          duration_minutes: 35,
          description:
            "Analyze Jepsen network partition logs and verify linearizability guarantees during split brain.",
          resource_type: "Reading",
        },
        {
          title: "Implement append entries RPC with rollback verification",
          duration_minutes: 45,
          description:
            "Construct log entry verification and term matching logic between leader and follower nodes.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Project Implementation: Storage Engine",
      topic_summary: "LSM tree compaction, Write-Ahead Logs, and MemTable flushing",
      tasks: [
        {
          title: "Design Write-Ahead Log (WAL) disk persistence",
          duration_minutes: 60,
          description:
            "Implement sequential append-only WAL with CRC32 checksum validation and crash-recovery replay.",
          resource_type: "Exercise",
        },
        {
          title: "Watch storage engine architecture teardown",
          duration_minutes: 30,
          description:
            "Lecture on LevelDB and RocksDB SSTable bloom filters and multi-level compaction strategies.",
          resource_type: "Video",
        },
        {
          title: "Build concurrent skiplist MemTable with lock-free reads",
          duration_minutes: 45,
          description:
            "Implement memory table backed by skiplist data structure with concurrent read/write isolation.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Review & Production Polish",
      topic_summary: "Distributed tracing, chaos testing, and benchmark suites",
      tasks: [
        {
          title: "Instrument OpenTelemetry spans across RPC boundaries",
          duration_minutes: 40,
          description:
            "Add trace propagation headers and measure p99 tail latency across multi-node cluster.",
          resource_type: "Exercise",
        },
        {
          title: "Run Chaos Mesh network partition simulations",
          duration_minutes: 45,
          description:
            "Inject 100ms jitter and 20% packet drop into follower communication to verify quorum stability.",
          resource_type: "Exercise",
        },
        {
          title: "Conduct architectural sprint retrospective & synthesis",
          duration_minutes: 30,
          description:
            "Consolidate benchmark performance metrics and review edge-case recovery logs.",
          resource_type: "Reading",
        },
      ],
    },
  ],
};

const DEFAULT_COMPLETED_SEED: Record<string, boolean> = {
  "plan_seed_enterprise_01_0_0": true,
  "plan_seed_enterprise_01_0_1": true,
  "plan_seed_enterprise_01_0_2": true,
  "plan_seed_enterprise_01_1_0": true,
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // App Shell Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("dashboard");

  // Core Data State
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedTasksMap, setCompletedTasksMap] = useState<Record<string, boolean>>({});

  // UI View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("All");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);

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
      const storedView = localStorage.getItem(STORAGE_KEY_VIEW_MODE) as ViewMode;
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
      } else {
        // First-time visit: Initialize with default enterprise seed plan
        setSavedPlans([DEFAULT_SEED_PLAN]);
        setActivePlanId(DEFAULT_SEED_PLAN.id);
        setCompletedTasksMap(DEFAULT_COMPLETED_SEED);
      }

      if (storedProgress) {
        setCompletedTasksMap(JSON.parse(storedProgress));
      }

      if (storedView === "table" || storedView === "timeline" || storedView === "kanban") {
        setViewMode(storedView);
      } else {
        setViewMode("table");
      }

      if (storedSidebar !== null) {
        setSidebarCollapsed(storedSidebar === "true");
      }

      if (storedTimer) {
        const parsedTimer = JSON.parse(storedTimer) as ActiveTimer;
        setActiveTimer({
          ...parsedTimer,
          isRunning: false,
        });
      }
    } catch {
      // Fallback to seed plan if parsing fails
      setSavedPlans([DEFAULT_SEED_PLAN]);
      setActivePlanId(DEFAULT_SEED_PLAN.id);
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

      // / -> Focus search
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
      setSelectedPeriodIndex(null);
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
    if (confirm("Reset all completed task checkmarks for this curriculum?")) {
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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-slate-500 font-mono text-xs">
        Initializing Study Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 flex overflow-x-hidden selection:bg-[#ea580c]/30 selection:text-orange-200">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(249,115,22,0.08), transparent 70%)",
        }}
      />

      {/* Primary Fixed Left Rail Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={(plan) => {
          setActivePlanId(plan.id);
          setSelectedPeriodIndex(null);
        }}
        onDeletePlan={handleDeletePlan}
        onOpenCreateModal={() => {
          setError("");
          setIsModalOpen(true);
        }}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        activeTimer={activeTimer}
        completedTasksMap={completedTasksMap}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
      />

      {/* Main Content Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Global Top Navbar */}
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
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dashboard Content Translation */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activePlan ? (
            <div className="space-y-6">
              {/* ROW 1 & ROW 2: Header KPI & Metric Cards */}
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
                onExportMarkdown={handleExportMarkdown}
                selectedPeriodLabel={
                  selectedPeriodIndex !== null
                    ? activePlan.schedule[selectedPeriodIndex]?.period_label
                    : "All Periods"
                }
                onSelectPeriodLabel={(label) => {
                  if (label === "All Periods") {
                    setSelectedPeriodIndex(null);
                  } else {
                    const idx = activePlan.schedule.findIndex((p) => p.period_label === label);
                    if (idx !== -1) setSelectedPeriodIndex(idx);
                  }
                }}
              />

              {/* Filter Bar & View Switcher */}
              <FilterBar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                resourceFilter={resourceFilter}
                onResourceFilterChange={setResourceFilter}
                searchInputRef={searchInputRef}
              />

              {/* ROW 4: Detailed Task Execution Stream */}
              {viewMode === "table" ? (
                <TaskStreamTable
                  plan={activePlan}
                  completedTasksMap={completedTasksMap}
                  onToggleTask={handleToggleTask}
                  onStartFocus={handleStartFocus}
                  activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
                  searchQuery={searchQuery}
                  resourceFilter={resourceFilter}
                  selectedPeriodIndex={selectedPeriodIndex}
                  onClearPeriodFilter={() => setSelectedPeriodIndex(null)}
                  onViewAllClick={() => {
                    setSelectedPeriodIndex(null);
                    setResourceFilter("All");
                    setSearchQuery("");
                  }}
                />
              ) : viewMode === "timeline" ? (
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
            /* Empty State Hero */
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

      {/* Floating Focus Timer Companion */}
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
        onSelectPlan={(p) => {
          setActivePlanId(p.id);
          setSelectedPeriodIndex(null);
        }}
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