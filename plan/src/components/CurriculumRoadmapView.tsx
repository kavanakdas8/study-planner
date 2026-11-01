"use client";

import React, { useState, useMemo } from "react";
import {
  SavedPlan,
  CurriculumModule,
  Task,
  Milestone,
  RevisionItem,
  UserSettings,
} from "@/types/study";
import {
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  BookOpen,
  Target,
  Layers,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  LayoutList,
  Columns,
  GitCommit,
  Network,
} from "lucide-react";
import { playChime } from "@/lib/utils";
import { syncCurriculumToSchedule } from "@/lib/curriculumAdapter";
import { TaskStreamTable } from "./TaskStreamTable";
import { KanbanView } from "./KanbanView";
import { TimelineView } from "./TimelineView";
import { LearningNodeGraph } from "./LearningNodeGraph";

interface CurriculumRoadmapViewProps {
  plan: SavedPlan;
  completedTasksMap: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  onStartFocus: (task: Task, taskId: string, periodLabel: string) => void;
  activeTimerTaskId: string | null;
  onUpdatePlan: (updatedPlan: SavedPlan) => void;
  userSettings: UserSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

type SubView = "table" | "kanban" | "timeline" | "graph" | "revisions" | "milestones";

export function CurriculumRoadmapView({
  plan,
  completedTasksMap,
  onToggleTask,
  onStartFocus,
  activeTimerTaskId,
  onUpdatePlan,
  userSettings,
  searchQuery,
  onSearchChange,
}: CurriculumRoadmapViewProps) {
  const [activeSubView, setActiveSubView] = useState<SubView>("table");
  const [resourceFilter, setResourceFilter] = useState("All");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);
  // Modals state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CurriculumModule | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);

  // Form state for Module
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSummary, setModuleSummary] = useState("");

  // Form state for Milestone
  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msTargetDate, setMsTargetDate] = useState("");
  const [msType, setMsType] = useState<Milestone["type"]>("custom");

  const modules = useMemo(() => plan.modules || [], [plan.modules]);
  const milestones = useMemo(() => plan.milestones || [], [plan.milestones]);
  const revisions = useMemo(() => plan.revisions || [], [plan.revisions]);

  // Compute overall stats
  const stats = useMemo(() => {
    let totalTopics = 0;
    let completedTopics = 0;
    const totalModules = modules.length;
    let completedModules = 0;
    let totalEstMinutes = 0;
    let completedMinutes = 0;

    modules.forEach((m, mIdx) => {
      let moduleComplete = true;
      if (m.topics.length === 0) moduleComplete = false;

      m.topics.forEach((t, tIdx) => {
        totalTopics++;
        totalEstMinutes += t.estimated_duration_minutes || 0;

        const topicTasksTotal = t.tasks.length;
        let topicTasksDone = 0;
        t.tasks.forEach((_, taskIdx) => {
          const taskId = `${plan.id}_${mIdx}_${tIdx}_${taskIdx}`;
          const legacyTaskId = `${plan.id}_${mIdx}_${taskIdx}`;
          if (completedTasksMap[taskId] || completedTasksMap[legacyTaskId]) {
            topicTasksDone++;
          }
        });

        if (topicTasksTotal > 0 && topicTasksDone === topicTasksTotal) {
          completedTopics++;
          completedMinutes += t.estimated_duration_minutes || 0;
        } else {
          moduleComplete = false;
        }
      });

      if (moduleComplete) completedModules++;
    });

    const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const remainingHours = Math.max(0, Number(((totalEstMinutes - completedMinutes) / 60).toFixed(1)));

    return {
      totalModules,
      completedModules,
      totalTopics,
      completedTopics,
      completionPct,
      remainingHours,
      totalHours: Number((totalEstMinutes / 60).toFixed(1)),
    };
  }, [modules, completedTasksMap, plan.id]);

  // Open Create / Edit Module Modal
  const handleOpenModuleModal = (module?: CurriculumModule) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleSummary(module.summary);
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleSummary("");
    }
    setIsModuleModalOpen(true);
  };

  // Save Module
  const handleSaveModule = () => {
    if (!moduleTitle.trim()) return;

    let updatedModules: CurriculumModule[];
    if (editingModule) {
      updatedModules = modules.map((m) =>
        m.id === editingModule.id
          ? { ...m, title: moduleTitle.trim(), summary: moduleSummary.trim() }
          : m
      );
    } else {
      const newModule: CurriculumModule = {
        id: `mod_${Date.now()}`,
        title: moduleTitle.trim(),
        summary: moduleSummary.trim(),
        estimated_hours: 2,
        topics: [],
      };
      updatedModules = [...modules, newModule];
    }

    onUpdatePlan(syncCurriculumToSchedule({ ...plan, modules: updatedModules }));
    setIsModuleModalOpen(false);
    playChime("complete");
  };

  // Save Milestone
  const handleSaveMilestone = () => {
    if (!msTitle.trim()) return;
    const newMs: Milestone = {
      id: `ms_${Date.now()}`,
      title: msTitle.trim(),
      description: msDesc.trim(),
      target_date: msTargetDate,
      type: msType,
      completed: false,
    };

    onUpdatePlan({
      ...plan,
      milestones: [...milestones, newMs],
    });
    setIsMilestoneModalOpen(false);
    playChime("complete");
  };

  // Toggle Milestone Completion
  const handleToggleMilestone = (msId: string) => {
    const updated = milestones.map((m) =>
      m.id === msId
        ? {
            ...m,
            completed: !m.completed,
            completedAt: !m.completed ? Date.now() : undefined,
          }
        : m
    );
    onUpdatePlan({ ...plan, milestones: updated });
    playChime("click");
  };

  // Complete Spaced Revision
  const handleCompleteRevision = (revId: string) => {
    const nextIntervals = userSettings.study.revisionIntervals || [1, 3, 7, 14];
    const updated = revisions.map((r) => {
      if (r.id === revId) {
        const nextStage = r.stage + 1;
        const nextInterval = nextIntervals[nextStage - 1] || 30;
        const nextDueDate = new Date(Date.now() + nextInterval * 86400000).toISOString().split("T")[0];

        return {
          ...r,
          stage: nextStage,
          intervalDays: nextInterval,
          dueDate: nextDueDate,
          lastReviewedAt: Date.now(),
          completed: nextStage >= 5,
        };
      }
      return r;
    });

    onUpdatePlan({
      ...plan,
      revisions: updated,
    });
    playChime("timer");
  };

  // Execute Adaptive Rescheduling
  const handleApplyAdaptiveReschedule = (rescheduledPlan: SavedPlan) => {
    onUpdatePlan(syncCurriculumToSchedule(rescheduledPlan));
    setIsAdaptiveModalOpen(false);
    playChime("timer");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* SECTION HEADER & HERO OVERVIEW */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                Active Roadmap
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {plan.target_timeframe} Target
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {plan.subject}
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {plan.overview}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAdaptiveModalOpen(true)}
              title="Intelligent Adaptive Rescheduling"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adaptive Reschedule</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModuleModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Module</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Completion</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {stats.completionPct}%
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionPct}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Modules</span>
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {stats.completedModules} <span className="text-xs text-slate-400 font-normal">/ {stats.totalModules}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {stats.totalModules - stats.completedModules} pending
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Topics</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {stats.completedTopics} <span className="text-xs text-slate-400 font-normal">/ {stats.totalTopics}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {stats.totalTopics - stats.completedTopics} in progress
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Remaining</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {stats.remainingHours} <span className="text-xs text-slate-400 font-normal">hrs</span>
            </div>
            <p className="text-[10px] text-slate-400">
              of {stats.totalHours} total hrs
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Milestones</span>
              <Target className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {milestones.filter((m) => m.completed).length} <span className="text-xs text-slate-400 font-normal">/ {milestones.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              next: {milestones.find((m) => !m.completed)?.title.slice(0, 14) || "Completed"}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Revisions</span>
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {revisions.filter((r) => !r.completed).length} <span className="text-xs text-slate-400 font-normal">due</span>
            </div>
            <p className="text-[10px] text-slate-400">
              spaced repetition
            </p>
          </div>
        </div>
      </div>

      {/* ROADMAP VIEW SELECTOR TABS & FILTERS */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto max-w-full scrollbar-thin shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSubView("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "table"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "kanban"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "timeline"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "graph"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Learning Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("revisions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "revisions"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revisions ({revisions.filter((r) => !r.completed).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView("milestones")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubView === "milestones"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Milestones ({milestones.length})</span>
            </button>
          </div>

          {/* Filter input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks & topics..."
              className="w-56 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition shadow-2xs"
            />
          </div>
        </div>

        {/* Resource Filter Pills (shown for Table, Card, Timeline) */}
        {(activeSubView === "table" || activeSubView === "kanban" || activeSubView === "timeline") && (
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: "All", label: "All Tasks" },
              { id: "Exercise", label: "Exercises" },
              { id: "Doc", label: "Documentation" },
              { id: "Video", label: "Videos" },
              { id: "Reading", label: "Readings" },
            ].map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setResourceFilter(rf.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  resourceFilter === rf.id
                    ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* VIEW 2: REVISIONS SCHEDULER */}
      {activeSubView === "revisions" && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Spaced Repetition Scheduler</h3>
              <p className="text-xs text-slate-500">
                Configured intervals: 1 day → 3 days → 7 days → 14 days → Mastered.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const topicName = prompt("Enter completed topic name to schedule for revision:");
                if (!topicName?.trim()) return;
                const newRev: RevisionItem = {
                  id: `rev_${Date.now()}`,
                  topicId: `topic_custom_${Date.now()}`,
                  topicName: topicName.trim(),
                  moduleTitle: "Manual Revision Queue",
                  stage: 1,
                  intervalDays: 1,
                  dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                  completed: false,
                };
                onUpdatePlan({ ...plan, revisions: [...revisions, newRev] });
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
            >
              + Queue Revision
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Stage {rev.stage} ({rev.intervalDays}d cycle)
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Due: {rev.dueDate}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rev.topicName}</h4>
                  <p className="text-xs text-slate-500">{rev.moduleTitle}</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    {rev.completed ? "Mastered ⭐" : "Ready for review"}
                  </span>
                  {!rev.completed && (
                    <button
                      type="button"
                      onClick={() => handleCompleteRevision(rev.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
                    >
                      Mark Reviewed ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: MILESTONES ROADMAP */}
      {activeSubView === "milestones" && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Curriculum Milestones</h3>
              <p className="text-xs text-slate-500">
                High-impact target gates to track critical milestones in your journey.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMsTitle("");
                setMsDesc("");
                setMsTargetDate(new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]);
                setMsType("custom");
                setIsMilestoneModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
            >
              + Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((ms, idx) => (
              <div
                key={ms.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition shadow-2xs ${
                  ms.completed
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(ms.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition cursor-pointer ${
                      ms.completed
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 hover:border-emerald-500 bg-white"
                    }`}
                  >
                    {ms.completed ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-mono">{idx + 1}</span>}
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${ms.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {ms.title}
                    </h4>
                    <p className="text-xs text-slate-500">{ms.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500">
                    Target: {ms.target_date || "Open"}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      ms.completed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {ms.completed ? "Completed" : "In Progress"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: TABLE VIEW */}
      {activeSubView === "table" && (
        <TaskStreamTable
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter={resourceFilter}
          selectedPeriodIndex={selectedPeriodIndex}
          onClearPeriodFilter={() => setSelectedPeriodIndex(null)}
          onViewAllClick={() => {
            setSelectedPeriodIndex(null);
            setResourceFilter("All");
            onSearchChange("");
          }}
        />
      )}

      {/* VIEW: CARD VIEW */}
      {activeSubView === "kanban" && (
        <KanbanView
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter={resourceFilter}
        />
      )}

      {/* VIEW: TIMELINE VIEW */}
      {activeSubView === "timeline" && (
        <TimelineView
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter={resourceFilter}
        />
      )}

      {/* VIEW: LEARNING GRAPH VIEW */}
      {activeSubView === "graph" && (
        <LearningNodeGraph
          plan={plan}
          completedTasksMap={completedTasksMap}
          selectedPeriodIndex={selectedPeriodIndex}
          onSelectPeriodIndex={setSelectedPeriodIndex}
        />
      )}

      {/* MODULE CREATE / EDIT MODAL */}
      {isModuleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsModuleModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingModule ? "Edit Module" : "Create New Module"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Module Title *</label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Module Summary</label>
                <textarea
                  rows={3}
                  value={moduleSummary}
                  onChange={(e) => setModuleSummary(e.target.value)}
                  placeholder="Core thematic goals and topics covered..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModuleModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModule}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Save Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {isMilestoneModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsMilestoneModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Curriculum Milestone</h3>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Milestone Title *</label>
                <input
                  type="text"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  placeholder="e.g. Pass 50% Knowledge Gate"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  placeholder="Conditions for milestone achievement..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Date</label>
                <input
                  type="date"
                  value={msTargetDate}
                  onChange={(e) => setMsTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMilestone}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Add Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADAPTIVE RESCHEDULE MODAL */}
      {isAdaptiveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsAdaptiveModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Adaptive Curriculum Rescheduler</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdaptiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Analyzes your current progress, identifies overdue/incomplete topics, and redistributes them across upcoming available days within your daily budget of{" "}
              <strong className="text-slate-900 font-mono">{userSettings.study.dailyAvailableHours} hours/day</strong>.
            </p>

            {/* Side-by-side comparison preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-mono text-[10px] text-amber-700 font-bold uppercase">
                  Current Schedule Deficit
                </span>
                <div className="text-lg font-bold text-slate-900">
                  {stats.totalTopics - stats.completedTopics} Incomplete Topics
                </div>
                <p className="text-[11px] text-slate-500">
                  {stats.remainingHours} hours remaining. Overdue tasks detected in curriculum roadmap.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase">
                  Proposed Adaptive Distribution
                </span>
                <div className="text-lg font-bold text-emerald-900 font-mono">
                  {Math.ceil(stats.remainingHours / userSettings.study.dailyAvailableHours)} Study Days
                </div>
                <p className="text-[11px] text-emerald-800">
                  Evenly distributes tasks without exceeding {userSettings.study.dailyAvailableHours}h/day. Preserves milestone deadlines.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Adaptive Rescheduling will update target dates for upcoming periods. Existing completed progress will be fully preserved.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdaptiveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const dayMs = 86400000;
                  let dayOffset = 1;

                  const updatedModules = modules.map((m) => {
                    const updatedTopics = m.topics.map((t) => {
                      if (t.status === "Completed") return t;
                      const newDeadline = new Date(Date.now() + dayOffset * dayMs).toISOString().split("T")[0];
                      dayOffset += Math.max(1, Math.round(t.estimated_duration_minutes / (userSettings.study.dailyAvailableHours * 60)));
                      return {
                        ...t,
                        deadline: newDeadline,
                      };
                    });
                    return {
                      ...m,
                      topics: updatedTopics,
                    };
                  });

                  handleApplyAdaptiveReschedule({
                    ...plan,
                    modules: updatedModules,
                  });
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Apply Adaptive Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
