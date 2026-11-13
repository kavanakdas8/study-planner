"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { StudyPlan, SavedPlan, ActiveTimer, Task, StudySession, UserSettings, AppViewMode, OnboardingSelection } from "@/types/study";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { HeaderKPI } from "@/components/HeaderKPI";
import { FocusTimer } from "@/components/FocusTimer";
import { CreationModal } from "@/components/CreationModal";
import { PlanHistorySidebar } from "@/components/PlanHistorySidebar";
import { EmptyStateHero } from "@/components/EmptyStateHero";
import { CurriculumRoadmapView } from "@/components/CurriculumRoadmapView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { UnsavedChangesModal } from "@/components/UnsavedChangesModal";
import { LandingPage } from "@/components/landing/LandingPage";
import { CourseSelectionPage } from "@/components/landing/CourseSelectionPage";
import { LoginPage } from "@/components/auth/LoginPage";
import { SignupPage } from "@/components/auth/SignupPage";
import { exportPlanToMarkdown, downloadFile, generateICS, playChime } from "@/lib/utils";
import { exportCurriculumToPDF } from "@/lib/pdfGenerator";
import {
  STORAGE_KEY_ACTIVE_ID,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_SIDEBAR_COLLAPSED,
  STORAGE_KEY_ACTIVE_TIMER,
  STORAGE_KEY_SESSIONS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_VIEW_MODE,
  STORAGE_KEY_ONBOARDING,
  DEFAULT_USER_SETTINGS,
  normalizePlanToCurriculum,
  generateSeedSessions,
  loadSavedPlans,
  saveSavedPlans,
  saveCurriculum,
  clearCurriculum,
  checkCurriculumDirty,
} from "@/lib/curriculumAdapter";
import {
  Clock,
  Play,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";

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

  // Editable Working Draft & Manual Save State
  const [draftPlan, setDraftPlan] = useState<SavedPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Unsaved Changes Protection Modal State
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingActionContext, setPendingActionContext] = useState<string>("");

  // UI View & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);

  // Drawers & Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Focus Timer State
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Landing & Onboarding Flow State
  const [viewMode, setViewMode] = useState<AppViewMode>("landing");
  const [onboardingSelection, setOnboardingSelection] = useState<OnboardingSelection | null>(null);
  const [isOnboardingGenerating, setIsOnboardingGenerating] = useState(false);
  const [onboardingGenerationError, setOnboardingGenerationError] = useState<string | null>(null);

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
        const storedPlans = loadSavedPlans();
        const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        const storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
        const storedTimer = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
        const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        const storedOnboarding = localStorage.getItem(STORAGE_KEY_ONBOARDING);
        const sessionViewMode = sessionStorage.getItem(STORAGE_KEY_VIEW_MODE) as AppViewMode | null;

        if (storedPlans.length > 0) {
          setSavedPlans(storedPlans);
          const initialPlan =
            (storedActiveId && storedPlans.find((p) => p.id === storedActiveId)) ||
            storedPlans[0];
          setActivePlanId(initialPlan.id);
          setDraftPlan(JSON.parse(JSON.stringify(initialPlan)));
        } else {
          // First-time visit: Initialize with default enterprise seed plan
          const normalizedSeed = normalizePlanToCurriculum(DEFAULT_SEED_PLAN, DEFAULT_COMPLETED_SEED);
          setSavedPlans([normalizedSeed]);
          saveSavedPlans([normalizedSeed]);
          setActivePlanId(normalizedSeed.id);
          setDraftPlan(JSON.parse(JSON.stringify(normalizedSeed)));
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
          const parsed = JSON.parse(storedSettings);
          if (parsed.appearance) {
            parsed.appearance.theme = "light";
          }
          setUserSettings(parsed);
        }
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark");
        }

        if (storedOnboarding) {
          try {
            setOnboardingSelection(JSON.parse(storedOnboarding));
          } catch {}
        }

        // Preserve tab refresh view state within the current session; new visits start on landing
        if (sessionViewMode && ["landing", "login", "signup", "dashboard"].includes(sessionViewMode)) {
          setViewMode(sessionViewMode);
        } else {
          setViewMode("landing");
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
        saveSavedPlans([normalizedSeed]);
        setActivePlanId(normalizedSeed.id);
        setDraftPlan(JSON.parse(JSON.stringify(normalizedSeed)));
        setSessions(generateSeedSessions(DEFAULT_SEED_PLAN.id));
        setViewMode("landing");
      } finally {
        setMounted(true);
      }
    });
  }, []);

  // Active Plan ID sync
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

  // Reflect Appearance Settings (Accent Color, Layout Density, Theme)
  useEffect(() => {
    if (!mounted) return;
    const accent = userSettings.appearance?.accentColor || "emerald";
    const density = userSettings.appearance?.layoutDensity || "comfortable";
    const root = document.documentElement;

    // Apply Accent Colour
    root.setAttribute("data-accent", accent);

    // Apply Layout Density
    root.setAttribute("data-density", density);

    // Always ensure dark class is removed to preserve clean, crisp daylight UI
    root.classList.remove("dark");
  }, [userSettings.appearance, mounted]);

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

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
    } catch {}
  }, [viewMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (onboardingSelection) {
        localStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(onboardingSelection));
      } else {
        localStorage.removeItem(STORAGE_KEY_ONBOARDING);
      }
    } catch {}
  }, [onboardingSelection, mounted]);

  // Last Saved Plan resolution (from savedPlans list)
  const lastSavedPlan = useMemo(() => {
    if (!activePlanId) return null;
    const found = savedPlans.find((p) => p.id === activePlanId);
    return found ? normalizePlanToCurriculum(found, completedTasksMap) : null;
  }, [savedPlans, activePlanId, completedTasksMap]);

  // Dirty state checking: does the current working draft differ from the last saved version?
  const hasUnsavedChanges = useMemo(() => {
    return checkCurriculumDirty(draftPlan, lastSavedPlan);
  }, [draftPlan, lastSavedPlan]);

  // Active Plan Resolution: The active working draft, or fallback to saved plan
  const activePlan = useMemo(() => {
    if (draftPlan) {
      return normalizePlanToCurriculum(draftPlan, completedTasksMap);
    }
    return lastSavedPlan;
  }, [draftPlan, lastSavedPlan, completedTasksMap]);

  // Unsaved Changes Protection on Browser Tab Close / Refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Debugging Log: Curriculum loaded by dashboard
  useEffect(() => {
    if (viewMode === "dashboard" && activePlan) {
      console.log("[CuratePlan] Curriculum loaded by dashboard:", {
        id: activePlan.id,
        subject: activePlan.subject,
        modulesCount: activePlan.modules?.length || 0,
        tasksCount: activePlan.schedule?.reduce((acc, p) => acc + p.tasks.length, 0) || 0,
      });
    }
  }, [viewMode, activePlan]);

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

  // API Generate Plan Handler (Creates unsaved working draft)
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

      const newDraftPlan: SavedPlan = {
        ...planData,
        id: `plan_${Date.now()}`,
        createdAt: Date.now(),
        daily_hours: payload.daily_hours,
        experience_level: payload.experience_level,
      };

      const normalized = normalizePlanToCurriculum(newDraftPlan);
      // Treat as new unsaved draft!
      setDraftPlan(normalized);
      setActivePlanId(normalized.id);
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

  // Generate curriculum with AI & transition into the CuratePlan dashboard (as unsaved review draft)
  const handleOnboardingStartLearning = async (selection: OnboardingSelection) => {
    setIsOnboardingGenerating(true);
    setOnboardingGenerationError(null);

    // Debugging Log: Selected subject and preferences
    console.log("[CuratePlan] Selected subject and preferences:", {
      subject: selection.subject,
      dailyMinutes: selection.dailyMinutes,
      dailyLabel: selection.dailyLabel,
      durationDays: selection.durationDays,
      durationLabel: selection.durationLabel,
      level: selection.level,
      totalEstimatedHours: selection.totalEstimatedHours,
    });

    const dailyHours = Number((selection.dailyMinutes / 60).toFixed(1));
    const payload = {
      topic: selection.subject.trim(),
      timeframe: selection.durationLabel,
      daily_hours: dailyHours,
      experience_level: selection.level || "Beginner",
      goal: `Master ${selection.subject.trim()} (${selection.durationLabel}, ${selection.dailyLabel}/day)`,
    };

    // Debugging Log: API request payload
    console.log("[CuratePlan] API request payload:", payload);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.detail || `Server error (${res.status}): Failed to generate curriculum. Ensure the backend is active on port 8000.`
        );
      }

      const planData: StudyPlan = await res.json();

      // Debugging Log: API response subject
      console.log("[CuratePlan] API response subject:", planData.subject);

      const newDraftPlan: SavedPlan = {
        ...planData,
        id: `plan_${Date.now()}`,
        createdAt: Date.now(),
        daily_hours: payload.daily_hours,
        experience_level: payload.experience_level,
      };

      const normalized = normalizePlanToCurriculum(newDraftPlan);

      // CRITICAL: Treat as newly generated unsaved review draft.
      // Do not automatically persist to savedPlans or localStorage.
      setDraftPlan(normalized);
      setActivePlanId(normalized.id);

      // Reset selection view and navigate into dashboard
      setSelectedPeriodIndex(null);
      setOnboardingSelection(selection);
      setActiveNavTab("dashboard");
      setViewMode("dashboard");
      playChime("complete");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while generating your plan.";
      console.error("[CuratePlan] Plan generation failed:", msg);
      setOnboardingGenerationError(msg);
      playChime("click");
    } finally {
      setIsOnboardingGenerating(false);
    }
  };

  // Explicit User Save Handler
  const handleSaveCurriculum = useCallback(async () => {
    if (isSaving || !draftPlan || !hasUnsavedChanges) return;

    setIsSaving(true);
    playChime("click");

    try {
      // Validate draft
      if (!draftPlan.subject.trim()) {
        throw new Error("Curriculum title cannot be empty.");
      }
      if (!draftPlan.schedule || draftPlan.schedule.length === 0) {
        throw new Error("Curriculum must contain at least one learning module.");
      }

      // Small async pause for tactile UI feedback
      await new Promise((resolve) => setTimeout(resolve, 350));

      const updatedPlans = saveCurriculum(draftPlan);
      setSavedPlans(updatedPlans);
      setActivePlanId(draftPlan.id);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, draftPlan.id);
      } catch {}

      playChime("complete");
      setSaveSuccessMessage(`"${draftPlan.subject}" saved to Study History!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save curriculum.";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, draftPlan, hasUnsavedChanges]);

  // Explicit Discard Changes Handler
  const handleDiscardCurriculum = () => {
    playChime("click");
    if (lastSavedPlan) {
      // Restore working draft back to last explicitly saved version
      setDraftPlan(JSON.parse(JSON.stringify(lastSavedPlan)));
      setSaveSuccessMessage("Draft changes discarded. Restored last saved curriculum.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } else {
      // Newly generated plan was never saved: revert to first saved plan in history or null
      if (savedPlans.length > 0) {
        const fallback = savedPlans[0];
        setActivePlanId(fallback.id);
        setDraftPlan(JSON.parse(JSON.stringify(fallback)));
      } else {
        setActivePlanId(null);
        setDraftPlan(null);
      }
      setSaveSuccessMessage("Draft curriculum discarded.");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  // Protected Action Wrapper for Unsaved Changes
  const handleProtectedAction = useCallback((action: () => void, contextDescription: string) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setPendingActionContext(contextDescription);
      setIsUnsavedModalOpen(true);
    } else {
      action();
    }
  }, [hasUnsavedChanges]);

  const handleSelectPlan = (targetPlan: SavedPlan) => {
    handleProtectedAction(() => {
      setActivePlanId(targetPlan.id);
      setDraftPlan(JSON.parse(JSON.stringify(targetPlan)));
      setSelectedPeriodIndex(null);
    }, `Switching to "${targetPlan.subject}"`);
  };

  const handleReturnHome = () => {
    handleProtectedAction(() => {
      setViewMode("landing");
    }, "Returning to the home page");
  };

  const handleOpenNewPlan = useCallback(() => {
    handleProtectedAction(() => {
      setError("");
      setIsModalOpen(true);
    }, "Creating a new curriculum");
  }, [handleProtectedAction]);

  const handleModalSaveAndProceed = async () => {
    if (draftPlan) {
      const updated = saveCurriculum(draftPlan);
      setSavedPlans(updated);
      setActivePlanId(draftPlan.id);
    }
    setIsUnsavedModalOpen(false);
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  };

  const handleModalDiscardAndProceed = () => {
    handleDiscardCurriculum();
    setIsUnsavedModalOpen(false);
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  };

  const handleModalCancel = () => {
    setIsUnsavedModalOpen(false);
    setPendingAction(null);
    setPendingActionContext("");
  };

  // Update Plan modifications from CurriculumRoadmapView or SettingsView
  const handleUpdatePlan = (updatedPlan: SavedPlan) => {
    setDraftPlan(updatedPlan);
  };

  // Delete plan from storage
  const handleDeletePlan = (planId: string) => {
    playChime("click");
    const updated = clearCurriculum(planId);
    setSavedPlans(updated);
    if (activePlanId === planId) {
      if (updated.length > 0) {
        setActivePlanId(updated[0].id);
        setDraftPlan(JSON.parse(JSON.stringify(updated[0])));
      } else {
        setActivePlanId(null);
        setDraftPlan(null);
      }
    }
    setSaveSuccessMessage("Curriculum deleted.");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S -> Save Curriculum Changes
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving && draftPlan) {
          handleSaveCurriculum();
        }
        return;
      }

      // Cmd/Ctrl + K -> Open creation modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setError("");
        handleOpenNewPlan();
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
  }, [hasUnsavedChanges, isSaving, draftPlan, handleOpenNewPlan, handleSaveCurriculum]);

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

  // Export Plan to Professional PDF Document
  const handleExportPDF = async () => {
    if (!activePlan) return;
    setIsExportingPDF(true);
    setExportFeedback(null);
    playChime("click");
    try {
      // Small pause to allow the React loading spinner to render
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



  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing CuratePlan Engine...
      </div>
    );
  }

  // 1. Premium EdTech Landing Page
  if (viewMode === "landing") {
    return (
      <LandingPage
        onBuildPlan={() => setViewMode("course-selection")}
        onNavigateLogin={() => setViewMode("login")}
        onNavigateSignup={() => setViewMode("signup")}
        onOpenDashboard={() => setViewMode("dashboard")}
        hasExistingWorkspace={savedPlans.length > 0}
      />
    );
  }

  // 2. Dedicated Course Selection Page ("What do you want to study today?")
  if (viewMode === "course-selection") {
    return (
      <CourseSelectionPage
        onStartLearning={handleOnboardingStartLearning}
        onBackToLanding={() => {
          setOnboardingGenerationError(null);
          setViewMode("landing");
        }}
        initialSelection={onboardingSelection}
        isGenerating={isOnboardingGenerating}
        generationError={onboardingGenerationError}
      />
    );
  }

  // 2. UI-Only Login Page
  if (viewMode === "login") {
    return (
      <LoginPage
        onBackToLanding={() => setViewMode("landing")}
        onNavigateSignup={() => setViewMode("signup")}
      />
    );
  }

  // 3. UI-Only Sign Up Page
  if (viewMode === "signup") {
    return (
      <SignupPage
        onBackToLanding={() => setViewMode("landing")}
        onNavigateLogin={() => setViewMode("login")}
      />
    );
  }

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
        onSelectPlan={handleSelectPlan}
        onDeletePlan={handleDeletePlan}
        onOpenCreateModal={handleOpenNewPlan}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        onReturnHome={handleReturnHome}
        activeTimer={activeTimer}
        completedTasksMap={completedTasksMap}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
      />

      {/* Main Content Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 overflow-x-hidden">
        {/* Global Top Navbar */}
        <TopBar
          activePlan={activePlan}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateModal={handleOpenNewPlan}
          onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
          onExportPDF={handleExportPDF}
          onExportMarkdown={handleExportMarkdown}
          onExportICS={handleExportICS}
          onClearCompleted={handleClearCompleted}
          onFocusSearch={() => searchInputRef.current?.focus()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSaveCurriculum={handleSaveCurriculum}
          onDiscardChanges={handleDiscardCurriculum}
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
          ) : activeNavTab === "settings" ? (
            /* SECTION 4: SETTINGS */
            <SettingsView
              userSettings={userSettings}
              onUpdateSettings={setUserSettings}
              activePlan={activePlan}
              onUpdateDraftPlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              savedPlans={savedPlans}
              hasUnsavedChanges={hasUnsavedChanges}
              onSaveCurriculum={handleSaveCurriculum}
            />
          ) : activePlan ? (
            /* DEFAULT: DASHBOARD VIEW */
            <div className="space-y-6">
              {/* Save Success Toast Banner */}
              {saveSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{saveSuccessMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Unsaved Changes Banner: Newly generated plan vs edited draft */}
              {hasUnsavedChanges && (
                !lastSavedPlan ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                          <span>Curriculum Generated for &ldquo;{activePlan.subject}&rdquo;</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 text-[10px] font-mono font-semibold">
                            Unsaved Review Draft
                          </span>
                        </h3>
                        <p className="text-[11px] text-emerald-800">
                          Review your synthesized curriculum below. Click <strong>Save Curriculum</strong> to store it in your Study History.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={handleDiscardCurriculum}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCurriculum}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save Curriculum</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fade-in text-xs">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900">Unsaved Changes:</span>
                        <span className="ml-1 text-amber-800">
                          You have modified this curriculum. Click Save to make your changes permanent.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={handleDiscardCurriculum}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 text-[11px] font-semibold border border-amber-200 transition cursor-pointer"
                      >
                        Discard Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCurriculum}
                        disabled={isSaving}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                )
              )}
              {/* Onboarding Context Banner (if user transitioned from onboarding) */}
              {onboardingSelection && (
                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-fade-in">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-emerald-800">Selected Goal:</span>
                    <span className="font-semibold">{onboardingSelection.subject}</span>
                    <span className="text-emerald-300">•</span>
                    <span>{onboardingSelection.dailyLabel} / day</span>
                    <span className="text-emerald-300">•</span>
                    <span>{onboardingSelection.durationLabel}</span>
                    {onboardingSelection.level && (
                      <>
                        <span className="text-emerald-300">•</span>
                        <span>{onboardingSelection.level}</span>
                      </>
                    )}
                    <span className="text-emerald-300">•</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      {onboardingSelection.totalEstimatedHours}h total
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnboardingSelection(null)}
                    className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
                    title="Dismiss summary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
                userSettings={userSettings}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                          Today&apos;s Focus Schedule
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Target: {userSettings.study?.dailyStudyGoalHours || 2}h daily • Weekly: {userSettings.study?.weeklyStudyTargetHours || 14}h target
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const todayIdx = new Date().getDay();
                          const isScheduledDay = (userSettings.study?.preferredStudyDays || [1, 2, 3, 4, 5]).includes(todayIdx);
                          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                          return isScheduledDay ? (
                            <span className="text-[10px] font-medium font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Scheduled Study Day • Window: {userSettings.study?.studyStartTime || "09:00"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                              Rest Day ({dayNames[todayIdx]}) • Self-Paced
                            </span>
                          );
                        })()}
                      </div>
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
        }}
        onClose={() => setActiveTimer(null)}
        userSettings={userSettings}
      />

      {/* Command Palette Creation Modal */}
      <CreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGeneratePlan}
        loading={loading}
        error={error}
        defaultDifficulty={userSettings.study?.preferredDifficulty}
        defaultDailyHours={userSettings.study?.dailyStudyGoalHours}
      />

      {/* Slide-out Plan History Drawer */}
      <PlanHistorySidebar
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={(p) => {
          setIsHistoryDrawerOpen(false);
          handleSelectPlan(p);
        }}
        onDeletePlan={handleDeletePlan}
        onOpenNewPlanModal={() => {
          setIsHistoryDrawerOpen(false);
          handleOpenNewPlan();
        }}
        completedTasksMap={completedTasksMap}
      />

      {/* Unsaved Changes Confirmation Protection Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onSave={handleModalSaveAndProceed}
        onDiscard={handleModalDiscardAndProceed}
        onCancel={handleModalCancel}
        isSaving={isSaving}
        planTitle={activePlan?.subject}
        actionContext={pendingActionContext}
      />
    </div>
  );
}
