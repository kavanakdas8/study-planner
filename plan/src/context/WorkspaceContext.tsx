"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  SavedPlan,
  ActiveTimer,
  Task,
  StudySession,
  UserSettings,
  OnboardingSelection,
} from "@/types/study";
import {
  curriculumStorage,
  DEFAULT_SEED_PLAN,
  DEFAULT_COMPLETED_SEED,
} from "@/services/curriculumStorage";
import { generateCurriculumPlan } from "@/services/curriculumApi";
import {
  DEFAULT_USER_SETTINGS,
  normalizePlanToCurriculum,
  generateSeedSessions,
} from "@/lib/curriculumAdapter";
import {
  exportPlanToMarkdown,
  downloadFile,
  generateICS,
  playChime,
} from "@/lib/utils";
import { exportCurriculumToPDF } from "@/lib/pdfGenerator";

export interface WorkspaceContextValue {
  // Plan Collection
  savedPlans: SavedPlan[];
  activePlanId: string | null;
  activePlan: SavedPlan | null;
  hasUnsavedChanges: boolean;
  draftPlan: SavedPlan | null;

  // Plan Actions
  selectPlan: (plan: SavedPlan) => void;
  deletePlan: (planId: string) => void;
  renamePlan: (planId: string, newSubject: string) => void;
  toggleArchivePlan: (planId: string) => void;
  updateDraftPlan: (updatedPlan: SavedPlan) => void;
  saveDraftChanges: () => void;
  discardDraftChanges: () => void;
  createPlanFromSelection: (selection: OnboardingSelection) => Promise<void>;

  // Task & Progress
  completedTasksMap: Record<string, boolean>;
  toggleTask: (taskId: string) => void;
  clearCompletedTasks: () => void;

  // Focus Timer & Sessions
  activeTimer: ActiveTimer | null;
  setActiveTimer: React.Dispatch<React.SetStateAction<ActiveTimer | null>>;
  startFocus: (task: Task, taskId: string, periodLabel: string) => void;
  sessions: StudySession[];

  // Settings & Navigation Shell
  userSettings: UserSettings;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isHistoryDrawerOpen: boolean;
  setIsHistoryDrawerOpen: (open: boolean) => void;
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (open: boolean) => void;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPeriodIndex: number | null;
  setSelectedPeriodIndex: (idx: number | null) => void;

  // Onboarding Selection Banner
  onboardingSelection: OnboardingSelection | null;
  dismissOnboardingSelection: () => void;

  // Exports
  exportPDF: () => Promise<void>;
  exportMarkdown: () => void;
  exportICS: () => void;
  isExportingPDF: boolean;
  exportFeedback: { type: "success" | "error"; message: string } | null;
  clearExportFeedback: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Core Data
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [completedTasksMap, setCompletedTasksMap] = useState<Record<string, boolean>>({});
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // Manual Save & Draft State: edits remain in draft until explicitly saved
  const [draftPlan, setDraftPlan] = useState<SavedPlan | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation Shell State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Focus Timer
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);
  const [onboardingSelection, setOnboardingSelection] = useState<OnboardingSelection | null>(null);

  // PDF Export Feedback
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Hydrate once from storage adapter
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedPlans = curriculumStorage.getPlans();
        const storedActiveId = curriculumStorage.getActivePlanId();
        const storedProgress = curriculumStorage.getProgress();
        const storedSessions = curriculumStorage.getSessions();
        const storedSettings = curriculumStorage.getSettings();
        const storedTimer = curriculumStorage.getActiveTimer();
        const storedCollapsed = curriculumStorage.getSidebarCollapsed();
        const storedOnboarding = curriculumStorage.getOnboardingSelection();

        setSavedPlans(storedPlans);
        setCompletedTasksMap(storedProgress);
        setSessions(storedSessions);
        setUserSettings(storedSettings);
        setSidebarCollapsed(storedCollapsed);
        setActiveTimer(storedTimer);
        setOnboardingSelection(storedOnboarding);

        if (storedActiveId && storedPlans.some((p) => p.id === storedActiveId)) {
          setActivePlanId(storedActiveId);
        } else if (storedPlans.length > 0) {
          setActivePlanId(storedPlans[0].id);
        }
      } catch {
        const fallbackSeed = normalizePlanToCurriculum(
          DEFAULT_SEED_PLAN,
          DEFAULT_COMPLETED_SEED
        );
        setSavedPlans([fallbackSeed]);
        setActivePlanId(fallbackSeed.id);
        setSessions(generateSeedSessions(fallbackSeed.id));
      } finally {
        setMounted(true);
      }
    });
  }, []);

  // Synchronize activePlan: uses draftPlan if unsaved changes exist, else savedPlans
  const activePlan = useMemo(() => {
    if (draftPlan && hasUnsavedChanges && draftPlan.id === activePlanId) {
      return normalizePlanToCurriculum(draftPlan, completedTasksMap);
    }
    const found = savedPlans.find((p) => p.id === activePlanId);
    if (!found) return null;
    return normalizePlanToCurriculum(found, completedTasksMap);
  }, [savedPlans, activePlanId, completedTasksMap, draftPlan, hasUnsavedChanges]);

  // Update in-memory draft (modules, tasks, milestones). Does NOT autosave to storage.
  const updateDraftPlan = useCallback((updatedPlan: SavedPlan) => {
    setDraftPlan(updatedPlan);
    setHasUnsavedChanges(true);
  }, []);

  // Explicit Manual Save: commits draft changes to storage adapter
  const saveDraftChanges = useCallback(() => {
    if (!draftPlan) return;
    const normalized = normalizePlanToCurriculum(draftPlan, completedTasksMap);
    const updatedList = savedPlans.map((p) =>
      p.id === normalized.id ? normalized : p
    );
    setSavedPlans(updatedList);
    curriculumStorage.savePlans(updatedList);
    setDraftPlan(null);
    setHasUnsavedChanges(false);
    playChime("complete");
  }, [draftPlan, savedPlans, completedTasksMap]);

  // Discard draft changes and restore original from storage
  const discardDraftChanges = useCallback(() => {
    setDraftPlan(null);
    setHasUnsavedChanges(false);
    playChime("click");
  }, []);

  // Select another plan from history or sidebar
  const selectPlan = useCallback(
    (plan: SavedPlan) => {
      setActivePlanId(plan.id);
      curriculumStorage.setActivePlanId(plan.id);
      setSelectedPeriodIndex(null);
      setDraftPlan(null);
      setHasUnsavedChanges(false);
    },
    []
  );

  // Delete plan
  const deletePlan = useCallback(
    (planId: string) => {
      playChime("click");
      const updated = savedPlans.filter((p) => p.id !== planId);
      setSavedPlans(updated);
      curriculumStorage.savePlans(updated);

      if (activePlanId === planId) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActivePlanId(nextId);
        curriculumStorage.setActivePlanId(nextId);
        setDraftPlan(null);
        setHasUnsavedChanges(false);
      }
    },
    [savedPlans, activePlanId]
  );

  // Rename plan
  const renamePlan = useCallback(
    (planId: string, newSubject: string) => {
      if (!newSubject.trim()) return;
      const updated = savedPlans.map((p) =>
        p.id === planId
          ? { ...p, subject: newSubject.trim(), lastModifiedAt: Date.now() }
          : p
      );
      setSavedPlans(updated);
      curriculumStorage.savePlans(updated);
      if (draftPlan && draftPlan.id === planId) {
        setDraftPlan((prev) =>
          prev ? { ...prev, subject: newSubject.trim() } : prev
        );
      }
    },
    [savedPlans, draftPlan]
  );

  // Archive / Unarchive plan
  const toggleArchivePlan = useCallback(
    (planId: string) => {
      const updated = savedPlans.map((p) =>
        p.id === planId
          ? { ...p, isArchived: !p.isArchived, lastModifiedAt: Date.now() }
          : p
      );
      setSavedPlans(updated);
      curriculumStorage.savePlans(updated);
    },
    [savedPlans]
  );

  // Toggle single task completed
  const toggleTask = useCallback(
    (taskId: string) => {
      const nextIsDone = !completedTasksMap[taskId];
      const updatedProgress = {
        ...completedTasksMap,
        [taskId]: nextIsDone,
      };
      setCompletedTasksMap(updatedProgress);
      curriculumStorage.saveProgress(updatedProgress);

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
        const updatedSessions = [newSession, ...sessions];
        setSessions(updatedSessions);
        curriculumStorage.saveSessions(updatedSessions);
        playChime("complete");
      } else {
        playChime("click");
      }
    },
    [completedTasksMap, activePlan, sessions]
  );

  // Clear all completed checkmarks for active plan
  const clearCompletedTasks = useCallback(() => {
    if (!activePlan) return;
    if (confirm("Reset all completed task checkmarks for this curriculum?")) {
      playChime("click");
      const next = { ...completedTasksMap };
      activePlan.schedule.forEach((_, pIdx) => {
        activePlan.schedule[pIdx].tasks.forEach((_, tIdx) => {
          delete next[`${activePlan.id}_${pIdx}_${tIdx}`];
        });
      });
      setCompletedTasksMap(next);
      curriculumStorage.saveProgress(next);
    }
  }, [activePlan, completedTasksMap]);

  // Start Focus Session
  const startFocus = useCallback(
    (task: Task, taskId: string, periodLabel: string) => {
      playChime("click");
      const minutes =
        userSettings.timer.pomodoroDurationMinutes || task.duration_minutes || 25;
      const seconds = minutes * 60;
      const newTimer: ActiveTimer = {
        taskId,
        taskTitle: task.title,
        periodLabel,
        totalSeconds: seconds,
        remainingSeconds: seconds,
        isRunning: true,
        lastTickAt: Date.now(),
      };
      setActiveTimer(newTimer);
      curriculumStorage.saveActiveTimer(newTimer);
    },
    [userSettings]
  );

  // Toggle Sidebar Collapse
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      curriculumStorage.saveSidebarCollapsed(next);
      return next;
    });
  }, []);

  // Dismiss onboarding selection
  const dismissOnboardingSelection = useCallback(() => {
    setOnboardingSelection(null);
    curriculumStorage.saveOnboardingSelection(null);
  }, []);

  // Create plan from onboarding/generator and set as active
  const createPlanFromSelection = useCallback(
    async (selection: OnboardingSelection) => {
      const newPlan = await generateCurriculumPlan(selection);
      const updated = [newPlan, ...savedPlans.filter((p) => p.id !== newPlan.id)];
      setSavedPlans(updated);
      curriculumStorage.savePlans(updated);
      setActivePlanId(newPlan.id);
      curriculumStorage.setActivePlanId(newPlan.id);
      setOnboardingSelection(selection);
      curriculumStorage.saveOnboardingSelection(selection);
      setDraftPlan(null);
      setHasUnsavedChanges(false);
      setSelectedPeriodIndex(null);
      playChime("complete");
    },
    [savedPlans]
  );

  // PDF Export
  const exportPDF = useCallback(async () => {
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
      console.error("[Workspace] PDF export error:", err);
      setExportFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to generate curriculum PDF. Please try again.",
      });
      setTimeout(() => setExportFeedback(null), 6000);
    } finally {
      setIsExportingPDF(false);
    }
  }, [activePlan, completedTasksMap]);

  // Markdown Export
  const exportMarkdown = useCallback(() => {
    if (!activePlan) return;
    playChime("click");
    const md = exportPlanToMarkdown(
      activePlan,
      activePlan.daily_hours,
      completedTasksMap
    );
    const safeName = activePlan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(`${safeName}-study-plan.md`, md, "text/markdown;charset=utf-8");
  }, [activePlan, completedTasksMap]);

  // ICS Export
  const exportICS = useCallback(() => {
    if (!activePlan) return;
    const ics = generateICS(activePlan);
    const safeName = activePlan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(`${safeName}-curriculum.ics`, ics, "text/calendar;charset=utf-8");
  }, [activePlan]);

  const value: WorkspaceContextValue = {
    savedPlans,
    activePlanId,
    activePlan,
    hasUnsavedChanges,
    draftPlan,
    selectPlan,
    deletePlan,
    renamePlan,
    toggleArchivePlan,
    updateDraftPlan,
    saveDraftChanges,
    discardDraftChanges,
    createPlanFromSelection,
    completedTasksMap,
    toggleTask,
    clearCompletedTasks,
    activeTimer,
    setActiveTimer,
    startFocus,
    sessions,
    userSettings,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    searchQuery,
    setSearchQuery,
    selectedPeriodIndex,
    setSelectedPeriodIndex,
    onboardingSelection,
    dismissOnboardingSelection,
    exportPDF,
    exportMarkdown,
    exportICS,
    isExportingPDF,
    exportFeedback,
    clearExportFeedback: () => setExportFeedback(null),
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing CuratePlan Engine...
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
