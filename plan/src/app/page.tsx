"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StudyPlan,
  SavedPlan,
  ActiveTimer,
  Task,
  StudySession,
  UserSettings,
  OnboardingParams,
} from "@/types/study";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { HeaderKPI } from "@/components/HeaderKPI";
import { FocusTimer } from "@/components/FocusTimer";
import { CreationModal } from "@/components/CreationModal";
import { PlanHistorySidebar } from "@/components/PlanHistorySidebar";
import { EmptyStateHero } from "@/components/EmptyStateHero";
import { CurriculumRoadmapView } from "@/components/CurriculumRoadmapView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { ExportSyncView } from "@/components/ExportSyncView";
import { SettingsView } from "@/components/SettingsView";
import { LandingPage } from "@/components/LandingPage";
import { ChatInterface } from "@/components/ChatInterface";
import { CurriculumPreview } from "@/components/CurriculumPreview";
import { DashboardAssistant } from "@/components/DashboardAssistant";
import { exportPlanToMarkdown, downloadFile, generateICS, playChime } from "@/lib/utils";
import { exportCurriculumToPDF } from "@/lib/pdfGenerator";
import {
  STORAGE_KEY_PLANS,
  STORAGE_KEY_ACTIVE_ID,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_SIDEBAR_COLLAPSED,
  STORAGE_KEY_ACTIVE_TIMER,
  STORAGE_KEY_SESSIONS,
  STORAGE_KEY_SETTINGS,
  DEFAULT_USER_SETTINGS,
  normalizePlanToCurriculum,
  generateSeedSessions,
} from "@/lib/curriculumAdapter";
import {
  Clock,
  Play,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

type AppViewMode = "landing" | "chat" | "preview" | "dashboard";

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

  // Top-Level App View State: conversational-first landing flow
  const [appView, setAppView] = useState<AppViewMode>("landing");
  const [conversationGoal, setConversationGoal] = useState<string>("");
  const [previewPlan, setPreviewPlan] = useState<StudyPlan | null>(null);
  const [previewParams, setPreviewParams] = useState<OnboardingParams>({});
  const [isRegeneratingPlan, setIsRegeneratingPlan] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // App Shell Navigation State: default to collapsed (only logos shown on open)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("dashboard");

  // Core Data State
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedTasksMap, setCompletedTasksMap] = useState<Record<string, boolean>>({});
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // UI View & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);

  // Drawers & Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Focus Timer State
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Network State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Export PDF State
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Hydration load from localStorage
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedPlans = localStorage.getItem(STORAGE_KEY_PLANS);
        const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        const storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
        const storedTimer = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
        const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

        if (storedPlans) {
          const parsed = JSON.parse(storedPlans) as SavedPlan[];
          const normalized = parsed.map((p) => normalizePlanToCurriculum(p));
          setSavedPlans(normalized);
          if (storedActiveId && normalized.some((p) => p.id === storedActiveId)) {
            setActivePlanId(storedActiveId);
          } else if (normalized.length > 0) {
            setActivePlanId(normalized[0].id);
          }
        } else {
          // First-time visit: Initialize with default enterprise seed plan
          const normalizedSeed = normalizePlanToCurriculum(DEFAULT_SEED_PLAN, DEFAULT_COMPLETED_SEED);
          setSavedPlans([normalizedSeed]);
          setActivePlanId(normalizedSeed.id);
          setCompletedTasksMap(DEFAULT_COMPLETED_SEED);
        }

        if (storedProgress) {
          setCompletedTasksMap(JSON.parse(storedProgress));
        }

        if (storedSessions) {
          setSessions(JSON.parse(storedSessions));
        } else {
          setSessions(generateSeedSessions(DEFAULT_SEED_PLAN.id));
        }

        if (storedSettings) {
          setUserSettings(JSON.parse(storedSettings));
        }

        // Default to collapsed rail (logos only) on open
        setSidebarCollapsed(true);

        if (storedTimer) {
          const parsedTimer = JSON.parse(storedTimer) as ActiveTimer;
          setActiveTimer({
            ...parsedTimer,
            isRunning: false,
          });
        }
      } catch {
        const normalizedSeed = normalizePlanToCurriculum(DEFAULT_SEED_PLAN, DEFAULT_COMPLETED_SEED);
        setSavedPlans([normalizedSeed]);
        setActivePlanId(normalizedSeed.id);
        setSessions(generateSeedSessions(DEFAULT_SEED_PLAN.id));
      } finally {
        setMounted(true);
      }
    });
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
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {}
  }, [sessions, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(userSettings));
    } catch {}
  }, [userSettings, mounted]);

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
    const found = savedPlans.find((p) => p.id === activePlanId);
    if (!found) return null;
    return normalizePlanToCurriculum(found, completedTasksMap);
  }, [savedPlans, activePlanId, completedTasksMap]);

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

  // Next pending tasks for today's schedule and upcoming section
  const pendingTasksList = useMemo(() => {
    if (!activePlan) return [];
    const list: Array<{ task: Task; taskId: string; periodLabel: string; periodIdx: number; taskIdx: number }> = [];
    activePlan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((task, tIdx) => {
        const taskId = `${activePlan.id}_${pIdx}_${tIdx}`;
        if (!completedTasksMap[taskId]) {
          list.push({ task, taskId, periodLabel: period.period_label, periodIdx: pIdx, taskIdx: tIdx });
        }
      });
    });
    return list;
  }, [activePlan, completedTasksMap]);

  // Today's priority task
  const todayPriorityTask = pendingTasksList[0] || null;
  const upcomingTasksSlice = pendingTasksList.slice(1, 5);

  // API Generate Plan Handler (fallback / modal creation)
  const handleGeneratePlan = async (payload: {
    topic: string;
    timeframe: string;
    daily_hours: number;
    experience_level: string;
  }) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-plan", {
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

      const normalized = normalizePlanToCurriculum(newSavedPlan);
      setSavedPlans((prev) => [normalized, ...prev]);
      setActivePlanId(normalized.id);
      setSelectedPeriodIndex(null);
      setIsModalOpen(false);
      setAppView("dashboard");
      playChime("complete");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Conversational Flow Handlers
  const handleStartConversation = (goal: string) => {
    setConversationGoal(goal);
    setAppView("chat");
  };

  const handlePlanGeneratedFromChat = (plan: StudyPlan, params: OnboardingParams) => {
    setPreviewPlan(plan);
    setPreviewParams(params);
    setAppView("preview");
    playChime("complete");
  };

  const handleStartLearning = (finalPlan: SavedPlan) => {
    const normalized = normalizePlanToCurriculum(finalPlan);
    setSavedPlans((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)]);
    setActivePlanId(normalized.id);
    setSelectedPeriodIndex(null);
    setAppView("dashboard");
    playChime("complete");
  };

  const handleRegeneratePreviewPlan = async (instructions: string) => {
    if (!previewPlan) return;
    setIsRegeneratingPlan(true);
    try {
      const dailyHours = previewParams.daily_hours || 2;
      const expLevel = previewParams.experience_level || "Intermediate";
      const combinedTopic = `${previewPlan.subject}. Adjustment request: ${instructions}. Maintain daily study duration around ${dailyHours} hours.`;
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: combinedTopic,
          timeframe: previewParams.timeframe || previewPlan.target_timeframe || "2 Weeks",
          daily_hours: dailyHours,
          experience_level: expLevel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Regeneration returned error status ${res.status}`);
      }

      const updatedPlan: StudyPlan = await res.json();
      setPreviewPlan(updatedPlan);
      playChime("complete");
    } catch (err) {
      console.error("Failed to regenerate plan:", err);
      throw err;
    } finally {
      setIsRegeneratingPlan(false);
    }
  };

  // Modify Plan from In-Dashboard AI Assistant
  const handlePlanModifiedFromAssistant = (updatedPlan: SavedPlan) => {
    const normalized = normalizePlanToCurriculum(updatedPlan, completedTasksMap);
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === normalized.id ? normalized : p))
    );
    playChime("complete");
  };

  // Toggle single task completion
  const handleToggleTask = (taskId: string) => {
    const nextIsDone = !completedTasksMap[taskId];
    setCompletedTasksMap((prev) => ({
      ...prev,
      [taskId]: nextIsDone,
    }));

    if (nextIsDone && activePlan) {
      const newSession: StudySession = {
        id: `session_${Date.now()}`,
        planId: activePlan.id,
        taskId,
        taskTitle: "Curriculum task completed",
        subject: activePlan.subject,
        periodLabel: activePlan.schedule[0]?.period_label || "Active Milestone",
        startedAt: Date.now() - 35 * 60000,
        completedAt: Date.now(),
        durationMinutes: 35,
        mode: "manual",
        completed: true,
      };
      setSessions((prev) => [newSession, ...prev]);
      playChime("complete");
    } else {
      playChime("click");
    }
  };

  // Start Focus Session
  const handleStartFocus = (task: Task, taskId: string, periodLabel: string) => {
    playChime("click");
    const minutes = userSettings.timer.pomodoroDurationMinutes || task.duration_minutes || 25;
    const seconds = minutes * 60;
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

  // Update Plan modifications from CurriculumRoadmapView
  const handleUpdatePlan = (updatedPlan: SavedPlan) => {
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  };

  // Export Plan to Professional PDF Document
  const handleExportPDF = async () => {
    if (!activePlan) return;
    setIsExportingPDF(true);
    setExportFeedback(null);
    playChime("click");
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      exportCurriculumToPDF(activePlan, completedTasksMap);
      playChime("complete");
      const cleanName = (activePlan.subject || "curriculum")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      setExportFeedback({
        type: "success",
        message: `Curriculum report exported successfully as [${cleanName || "curriculum"}_study_plan.pdf]!`,
      });
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (err) {
      console.error("PDF export error:", err);
      setExportFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to generate curriculum PDF. Please try again.",
      });
      setTimeout(() => setExportFeedback(null), 6000);
    } finally {
      setIsExportingPDF(false);
    }
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

  // Restore Backup Archive
  const handleRestoreBackup = (data: {
    plans: SavedPlan[];
    sessions: StudySession[];
    completedTasksMap: Record<string, boolean>;
    settings?: UserSettings;
  }) => {
    if (data.plans.length > 0) {
      const normalized = data.plans.map((p) => normalizePlanToCurriculum(p));
      setSavedPlans(normalized);
      setActivePlanId(normalized[0].id);
    }
    if (data.sessions) {
      setSessions(data.sessions);
    }
    if (data.completedTasksMap) {
      setCompletedTasksMap(data.completedTasksMap);
    }
    if (data.settings) {
      setUserSettings(data.settings);
    }
  };

  // Permanent Data Wipe
  const handleClearAllData = () => {
    try {
      localStorage.clear();
    } catch {}
    setSavedPlans([]);
    setActivePlanId(null);
    setCompletedTasksMap({});
    setSessions([]);
    setUserSettings(DEFAULT_USER_SETTINGS);
    setActiveTimer(null);
    setActiveNavTab("dashboard");
    setAppView("landing");
    playChime("click");
  };

  // Full backup JSON download
  const handleExportFullBackup = () => {
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      generator: "CuratePlan Enterprise",
      plans: savedPlans,
      sessions,
      completedTasksMap,
      settings: userSettings,
    };
    downloadFile(
      `curateplan-backup-${new Date().toISOString().split("T")[0]}.json`,
      JSON.stringify(backup, null, 2),
      "application/json"
    );
    playChime("click");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing CuratePlan Engine...
      </div>
    );
  }

  // 1. CONVERSATIONAL LANDING PAGE VIEW
  if (appView === "landing") {
    return (
      <LandingPage
        savedPlans={savedPlans}
        activePlan={activePlan}
        completedTasksMap={completedTasksMap}
        onSubmitGoal={handleStartConversation}
        onContinueLearning={() => setAppView("dashboard")}
        onSelectPlan={(plan) => {
          setActivePlanId(plan.id);
          setSelectedPeriodIndex(null);
          setAppView("dashboard");
        }}
      />
    );
  }

  // 2. CHAT ONBOARDING INTERFACE VIEW
  if (appView === "chat") {
    return (
      <ChatInterface
        initialGoal={conversationGoal}
        onPlanGenerated={handlePlanGeneratedFromChat}
        onBackToLanding={() => setAppView("landing")}
        onOpenDashboard={() => setAppView("dashboard")}
        hasExistingPlans={savedPlans.length > 0}
      />
    );
  }

  // 3. CURRICULUM PREVIEW & CUSTOMIZATION VIEW
  if (appView === "preview" && previewPlan) {
    return (
      <CurriculumPreview
        plan={previewPlan}
        params={previewParams}
        onStartLearning={handleStartLearning}
        onBackToChat={() => setAppView("chat")}
        onRegenerate={handleRegeneratePreviewPlan}
        isRegenerating={isRegeneratingPlan}
      />
    );
  }

  // 4. MAIN WORKSPACE / DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex selection:bg-emerald-100 selection:text-emerald-900">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(5,150,105,0.06), transparent 70%)",
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
        onSelectPlan={(p) => {
          setActivePlanId(p.id);
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
        onOpenConversationalPlanner={() => setAppView("landing")}
      />

      {/* Main Content Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 overflow-x-hidden">
        {/* Global Top Navbar */}
        <TopBar
          activePlan={activePlan}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateModal={() => {
            setError("");
            setIsModalOpen(true);
          }}
          onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
          onExportPDF={handleExportPDF}
          onExportMarkdown={handleExportMarkdown}
          onExportICS={handleExportICS}
          onClearCompleted={handleClearCompleted}
          onFocusSearch={() => searchInputRef.current?.focus()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
          isAssistantOpen={isAssistantOpen}
          onOpenConversationalPlanner={() => setAppView("landing")}
        />

        {/* Dynamic Section Translation */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* SECTION 1: CURRICULUM ROADMAP */}
          {activeNavTab === "curriculum" && activePlan ? (
            <CurriculumRoadmapView
              plan={activePlan}
              completedTasksMap={completedTasksMap}
              onToggleTask={handleToggleTask}
              onStartFocus={handleStartFocus}
              activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
              onUpdatePlan={handleUpdatePlan}
              userSettings={userSettings}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : activeNavTab === "analytics" ? (
            /* SECTION 2: ANALYTICS & PROGRESS */
            <AnalyticsView
              sessions={sessions}
              plan={activePlan}
              completedTasksMap={completedTasksMap}
              userSettings={userSettings}
              onStartFocus={() => {
                if (activePlan?.schedule[0]?.tasks[0]) {
                  handleStartFocus(
                    activePlan.schedule[0].tasks[0],
                    `${activePlan.id}_0_0`,
                    activePlan.schedule[0].period_label
                  );
                }
              }}
            />
          ) : activeNavTab === "export" ? (
            /* SECTION 3: EXPORT & SYNC */
            <ExportSyncView
              plan={activePlan}
              savedPlans={savedPlans}
              sessions={sessions}
              completedTasksMap={completedTasksMap}
              userSettings={userSettings}
              onRestoreBackup={handleRestoreBackup}
            />
          ) : activeNavTab === "settings" ? (
            /* SECTION 4: SETTINGS */
            <SettingsView
              userSettings={userSettings}
              onUpdateSettings={setUserSettings}
              savedPlans={savedPlans}
              onClearAllData={handleClearAllData}
              onExportFullBackup={handleExportFullBackup}
            />
          ) : activePlan ? (
            /* DEFAULT: DASHBOARD VIEW */
            <div className="space-y-6">
              {/* PDF Export Feedback Alert */}
              {exportFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs transition animate-fade-in ${
                    exportFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {exportFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="font-medium">{exportFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportFeedback(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Header KPI & Metric Cards */}
              <HeaderKPI
                plan={activePlan}
                completedCount={completedCount}
                totalCount={totalCount}
                totalMinutes={totalMinutes}
                onExportPDF={handleExportPDF}
                isExportingPDF={isExportingPDF}
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

              {/* Today's Focus Schedule */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Today&apos;s Focus Schedule
                  </h2>
                </div>

                {todayPriorityTask ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                          Next In Queue • {todayPriorityTask.periodLabel}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {todayPriorityTask.task.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {todayPriorityTask.task.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleStartFocus(
                            todayPriorityTask.task,
                            todayPriorityTask.taskId,
                            todayPriorityTask.periodLabel
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Focus</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {todayPriorityTask.task.duration_minutes} minutes
                      </span>
                      <span>•</span>
                      <span className="text-[11px] font-medium">
                        {todayPriorityTask.task.resource_type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleTask(todayPriorityTask.taskId)}
                        className="ml-auto text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    All scheduled tasks for this curriculum are complete!
                  </div>
                )}

                {/* Upcoming Tasks Section */}
                {upcomingTasksSlice.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Upcoming In Roadmap</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {pendingTasksList.length} total pending
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {upcomingTasksSlice.map((item) => (
                        <div
                          key={item.taskId}
                          className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-200 flex items-center justify-between gap-3 text-xs transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(item.taskId)}
                              className="w-4 h-4 rounded border border-slate-300 hover:border-emerald-500 bg-white flex items-center justify-center transition cursor-pointer shrink-0"
                            >
                              <span className="sr-only">Complete task</span>
                            </button>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 truncate block">
                                {item.task.title}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {item.periodLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {item.task.duration_minutes}m
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleStartFocus(
                                  item.task,
                                  item.taskId,
                                  item.periodLabel
                                )
                              }
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded transition cursor-pointer"
                              title="Start focus"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Hero */
            <EmptyStateHero
              onOpenModal={() => setAppView("landing")}
              onGeneratePreset={(preset) => {
                setConversationGoal(preset.topic);
                setAppView("chat");
              }}
            />
          )}
        </main>
      </div>

      {/* In-Dashboard AI Learning Assistant Companion */}
      <DashboardAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activePlan={activePlan}
        completedTasksMap={completedTasksMap}
        activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
        onPlanModified={handlePlanModifiedFromAssistant}
      />

      {/* Floating Focus Timer Companion */}
      <FocusTimer
        timer={activeTimer}
        onUpdate={setActiveTimer}
        onCompleteTask={(taskId) => {
          handleToggleTask(taskId);
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
