"use client";

import React, { useState, useMemo } from "react";
import {
  SavedPlan,
  CurriculumModule,
  CurriculumTopic,
  Task,
  Milestone,
  RevisionItem,
  DifficultyLevel,
  PriorityLevel,
  UserSettings,
} from "@/types/study";
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  BookOpen,
  Target,
  Layers,
  Star,
  Check,
  X,
  RefreshCw,
  RotateCcw,
  LayoutList,
  Columns,
  GitCommit,
  Network,
} from "lucide-react";
import { formatMinutes, playChime } from "@/lib/utils";
import { checkCircularPrerequisite, syncCurriculumToSchedule } from "@/lib/curriculumAdapter";
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

type SubView = "hierarchy" | "table" | "kanban" | "timeline" | "graph" | "revisions" | "milestones";

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
  const [activeSubView, setActiveSubView] = useState<SubView>("hierarchy");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    [plan.modules?.[0]?.id || ""]: true,
  });
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Modals state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<{ moduleId: string; topic?: CurriculumTopic } | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CurriculumModule | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);

  // Form states for Topic
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicDiff, setTopicDiff] = useState<DifficultyLevel>("Intermediate");
  const [topicPriority, setTopicPriority] = useState<PriorityLevel>("Medium");
  const [topicDuration, setTopicDuration] = useState(45);
  const [topicDeadline, setTopicDeadline] = useState("");
  const [topicConfidence, setTopicConfidence] = useState(3);
  const [topicPrereqs, setTopicPrereqs] = useState<string[]>([]);
  const [topicNotes, setTopicNotes] = useState("");
  const [topicError, setTopicError] = useState("");

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

  // All topics flat array for prerequisite lookups
  const allTopics = useMemo(() => {
    return modules.flatMap((m) => m.topics);
  }, [modules]);

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Open Add Topic Modal
  const handleOpenAddTopic = (moduleId: string) => {
    setEditingTopic({ moduleId });
    setTopicName("");
    setTopicDesc("");
    setTopicDiff("Intermediate");
    setTopicPriority("Medium");
    setTopicDuration(45);
    setTopicDeadline(new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
    setTopicConfidence(3);
    setTopicPrereqs([]);
    setTopicNotes("");
    setTopicError("");
    setIsTopicModalOpen(true);
  };

  // Open Edit Topic Modal
  const handleOpenEditTopic = (moduleId: string, topic: CurriculumTopic) => {
    setEditingTopic({ moduleId, topic });
    setTopicName(topic.name);
    setTopicDesc(topic.description);
    setTopicDiff(topic.difficulty);
    setTopicPriority(topic.priority);
    setTopicDuration(topic.estimated_duration_minutes);
    setTopicDeadline(topic.deadline || "");
    setTopicConfidence(topic.confidence || 3);
    setTopicPrereqs(topic.prerequisiteIds || []);
    setTopicNotes(topic.notes || "");
    setTopicError("");
    setIsTopicModalOpen(true);
  };

  // Save Topic (Add or Edit)
  const handleSaveTopic = () => {
    if (!editingTopic) return;
    if (!topicName.trim()) {
      setTopicError("Topic name cannot be empty.");
      return;
    }

    const { moduleId, topic } = editingTopic;

    // Prerequisite circular dependency check
    if (topic && topicPrereqs.length > 0) {
      for (const pId of topicPrereqs) {
        if (checkCircularPrerequisite(topic.id, pId, allTopics)) {
          setTopicError(`Circular prerequisite detected with dependency "${allTopics.find((t) => t.id === pId)?.name}".`);
          return;
        }
      }
    }

    const updatedModules = modules.map((m) => {
      if (m.id !== moduleId) return m;

      if (topic) {
        // Edit existing
        const updatedTopics = m.topics.map((t) => {
          if (t.id !== topic.id) return t;
          return {
            ...t,
            name: topicName.trim(),
            description: topicDesc.trim(),
            difficulty: topicDiff,
            priority: topicPriority,
            estimated_duration_minutes: topicDuration,
            deadline: topicDeadline,
            confidence: topicConfidence,
            prerequisiteIds: topicPrereqs,
            notes: topicNotes,
          };
        });
        return { ...m, topics: updatedTopics };
      } else {
        // Add new
        const newTopic: CurriculumTopic = {
          id: `topic_${Date.now()}`,
          name: topicName.trim(),
          description: topicDesc.trim(),
          difficulty: topicDiff,
          estimated_duration_minutes: topicDuration,
          actual_minutes_spent: 0,
          priority: topicPriority,
          status: "Not Started",
          completion_percentage: 0,
          resources: [{ title: `${topicName.trim()} Documentation`, type: "Documentation" }],
          deadline: topicDeadline,
          confidence: topicConfidence,
          prerequisiteIds: topicPrereqs,
          notes: topicNotes,
          tasks: [
            {
              title: `Study & implement ${topicName.trim()}`,
              duration_minutes: topicDuration,
              description: topicDesc.trim() || `Master concepts of ${topicName.trim()}`,
              resource_type: "Exercise",
            },
          ],
        };
        return { ...m, topics: [...m.topics, newTopic] };
      }
    });

    const updatedPlan: SavedPlan = {
      ...plan,
      modules: updatedModules,
    };

    onUpdatePlan(syncCurriculumToSchedule(updatedPlan));
    setIsTopicModalOpen(false);
    playChime("complete");
  };

  // Delete Topic
  const handleDeleteTopic = (moduleId: string, topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic and its tasks?")) return;

    const updatedModules = modules.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        topics: m.topics.filter((t) => t.id !== topicId),
      };
    });

    onUpdatePlan(syncCurriculumToSchedule({ ...plan, modules: updatedModules }));
    playChime("click");
  };

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

  // Delete Module
  const handleDeleteModule = (moduleId: string) => {
    if (!confirm("Delete this entire curriculum module?")) return;
    const updated = modules.filter((m) => m.id !== moduleId);
    onUpdatePlan(syncCurriculumToSchedule({ ...plan, modules: updated }));
    playChime("click");
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

  // Filter topics based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();

    return modules
      .map((m) => {
        const matchMod = m.title.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q);
        const matchingTopics = m.topics.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tasks.some((task) => task.title.toLowerCase().includes(q))
        );

        if (matchMod || matchingTopics.length > 0) {
          return {
            ...m,
            topics: matchingTopics.length > 0 ? matchingTopics : m.topics,
          };
        }
        return null;
      })
      .filter((m): m is CurriculumModule => m !== null);
  }, [modules, searchQuery]);

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

      {/* ROADMAP VIEW SELECTOR TABS */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto max-w-full scrollbar-thin shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubView("hierarchy")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeSubView === "hierarchy"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curriculum Hierarchy</span>
          </button>

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
            <span>Kanban</span>
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
            placeholder="Search modules & topics..."
            className="w-56 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition shadow-2xs"
          />
        </div>
      </div>

      {/* VIEW 1: CURRICULUM HIERARCHY (COURSE -> MODULES -> TOPICS -> TASKS) */}
      {activeSubView === "hierarchy" && (
        <div className="space-y-4">
          {filteredModules.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-500">No modules match your search query.</p>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-xs text-emerald-600 hover:underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            filteredModules.map((mod, mIdx) => {
              const isExpanded = !!expandedModules[mod.id];
              return (
                <div
                  key={mod.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs"
                >
                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModuleExpand(mod.id)}
                    className="p-4 sm:p-4.5 flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition select-none border-b border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1 rounded-lg bg-white text-slate-500 border border-slate-200">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                            Module {String(mIdx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            {mod.topics.length} {mod.topics.length === 1 ? "topic" : "topics"}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate max-w-xl">
                          {mod.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenAddTopic(mod.id)}
                        title="Add Topic to Module"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Add Topic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenModuleModal(mod)}
                        title="Edit Module"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteModule(mod.id)}
                        title="Delete Module"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Module Topics List */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/40">
                      {mod.topics.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2 bg-white">
                          <p className="text-xs text-slate-500">
                            No topics defined in this module yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenAddTopic(mod.id)}
                            className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                          >
                            + Create First Topic
                          </button>
                        </div>
                      ) : (
                        mod.topics.map((topic, tIdx) => {
                          const isTopicExpanded = selectedTopicId === topic.id;

                          // Prerequisite check
                          const prereqTopics = (topic.prerequisiteIds || [])
                            .map((pId) => allTopics.find((t) => t.id === pId))
                            .filter(Boolean) as CurriculumTopic[];

                          const hasUncompletedPrereq = prereqTopics.some(
                            (pt) => pt.status !== "Completed"
                          );

                          return (
                            <div
                              key={topic.id}
                              className={`p-4 rounded-xl border transition-all ${
                                topic.status === "Completed"
                                  ? "bg-white border-emerald-200 shadow-2xs"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      {mIdx + 1}.{tIdx + 1}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                                      {topic.name}
                                    </h4>

                                    {/* Difficulty Badge */}
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                        topic.difficulty === "Beginner"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : topic.difficulty === "Intermediate"
                                          ? "bg-sky-50 text-sky-700 border-sky-200"
                                          : "bg-purple-50 text-purple-700 border-purple-200"
                                      }`}
                                    >
                                      {topic.difficulty}
                                    </span>

                                    {/* Priority Badge */}
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                        topic.priority === "High"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : topic.priority === "Medium"
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {topic.priority} Priority
                                    </span>

                                    {/* Status Badge */}
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                        topic.status === "Completed"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : topic.status === "In Progress"
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {topic.status}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-500 leading-relaxed">
                                    {topic.description}
                                  </p>

                                  {/* PREREQUISITE WARNING / INDICATOR */}
                                  {prereqTopics.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 flex-wrap">
                                      <span className="font-mono text-[10px] uppercase text-slate-400">
                                        Prerequisites:
                                      </span>
                                      {prereqTopics.map((pt) => (
                                        <span
                                          key={pt.id}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                                            pt.status === "Completed"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                                          }`}
                                        >
                                          {pt.status === "Completed" ? (
                                            <Check className="w-2.5 h-2.5" />
                                          ) : (
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                          )}
                                          {pt.name}
                                        </span>
                                      ))}
                                      {hasUncompletedPrereq && (
                                        <span className="text-[10px] text-amber-700 italic">
                                          (Recommend completing prerequisites first)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Right Side Actions & Confidence Rating */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {/* Knowledge Confidence 1-5 */}
                                  <div className="flex items-center gap-0.5" title={`Confidence: ${topic.confidence || 3}/5`}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        type="button"
                                        key={star}
                                        onClick={() => {
                                          const updated = modules.map((m) =>
                                            m.id === mod.id
                                              ? {
                                                  ...m,
                                                  topics: m.topics.map((t) =>
                                                    t.id === topic.id ? { ...t, confidence: star } : t
                                                  ),
                                                }
                                              : m
                                          );
                                          onUpdatePlan(syncCurriculumToSchedule({ ...plan, modules: updated }));
                                        }}
                                        className="text-xs transition hover:scale-125 cursor-pointer"
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 ${
                                            star <= (topic.confidence || 3)
                                              ? "fill-amber-400 text-amber-400"
                                              : "text-slate-300"
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs font-mono font-bold text-slate-800">
                                      {topic.estimated_duration_minutes}m
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {topic.deadline || "No deadline"}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTopic(mod.id, topic)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                    title="Edit Topic"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(mod.id, topic.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition cursor-pointer"
                                    title="Delete Topic"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedTopicId(isTopicExpanded ? null : topic.id)
                                    }
                                    className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer"
                                    title={isTopicExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isTopicExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* EXPANDED TOPIC DETAILS: TASKS, NOTES, RESOURCES */}
                              {isTopicExpanded && (
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                                  {/* Tasks under this topic */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                      <span>Actionable Tasks ({topic.tasks.length})</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const taskName = prompt("Enter new task title:");
                                          if (!taskName?.trim()) return;
                                          const newTask: Task = {
                                            title: taskName.trim(),
                                            duration_minutes: 30,
                                            description: `Follow-up learning activity for ${topic.name}`,
                                            resource_type: "Exercise",
                                          };
                                          const updated = modules.map((m) =>
                                            m.id === mod.id
                                              ? {
                                                  ...m,
                                                  topics: m.topics.map((t) =>
                                                    t.id === topic.id
                                                      ? { ...t, tasks: [...t.tasks, newTask] }
                                                      : t
                                                  ),
                                                }
                                              : m
                                          );
                                          onUpdatePlan(syncCurriculumToSchedule({ ...plan, modules: updated }));
                                        }}
                                        className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                                      >
                                        + Add Task
                                      </button>
                                    </div>

                                    <div className="space-y-1.5">
                                      {topic.tasks.map((task, tTaskIdx) => {
                                        const taskId = `${plan.id}_${mIdx}_${tIdx}_${tTaskIdx}`;
                                        const legacyTaskId = `${plan.id}_${mIdx}_${tTaskIdx}`;
                                        const isDone =
                                          !!completedTasksMap[taskId] || !!completedTasksMap[legacyTaskId];
                                        const isTimerActive = activeTimerTaskId === taskId;

                                        return (
                                          <div
                                            key={tTaskIdx}
                                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition ${
                                              isDone
                                                ? "bg-slate-50 border-slate-200/60 text-slate-400 line-through"
                                                : "bg-slate-50/70 border-slate-200 text-slate-700"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <button
                                                type="button"
                                                onClick={() => onToggleTask(taskId)}
                                                className={`w-4 h-4 rounded flex items-center justify-center border transition cursor-pointer ${
                                                  isDone
                                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                                    : "border-slate-300 hover:border-emerald-500 bg-white"
                                                }`}
                                              >
                                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                                              </button>
                                              <span className="truncate">{task.title}</span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className="font-mono text-[10px] text-slate-500">
                                                {formatMinutes(task.duration_minutes)}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => onStartFocus(task, taskId, mod.title)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                                                  isTimerActive
                                                    ? "bg-emerald-600 text-white animate-pulse"
                                                    : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                }`}
                                              >
                                                {isTimerActive ? "Focusing" : "Focus"}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Personal Notes */}
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                                    <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                                      Notes & Observations
                                    </div>
                                    <p className="text-xs text-slate-600 italic">
                                      {topic.notes || "No notes captured yet. Click Edit Topic to add study notes."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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

      {/* VIEW 4: TABLE VIEW */}
      {activeSubView === "table" && (
        <TaskStreamTable
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter="All"
          selectedPeriodIndex={null}
          onClearPeriodFilter={() => {}}
          onViewAllClick={() => onSearchChange("")}
        />
      )}

      {/* VIEW 5: KANBAN VIEW */}
      {activeSubView === "kanban" && (
        <KanbanView
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter="All"
        />
      )}

      {/* VIEW 6: TIMELINE VIEW */}
      {activeSubView === "timeline" && (
        <TimelineView
          plan={plan}
          completedTasksMap={completedTasksMap}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          activeTimerTaskId={activeTimerTaskId}
          searchQuery={searchQuery}
          resourceFilter="All"
        />
      )}

      {/* VIEW 7: LEARNING GRAPH VIEW */}
      {activeSubView === "graph" && (
        <LearningNodeGraph
          plan={plan}
          completedTasksMap={completedTasksMap}
          selectedPeriodIndex={null}
          onSelectPeriodIndex={() => {}}
        />
      )}

      {/* TOPIC CREATE / EDIT MODAL */}
      {isTopicModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsTopicModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTopic?.topic ? "Edit Topic" : "Add Topic to Module"}
              </h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {topicError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{topicError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Topic Name *</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Raft Consensus Invariants"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="Summary of topics and architectural concepts..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={topicDiff}
                    onChange={(e) => setTopicDiff(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={topicPriority}
                    onChange={(e) => setTopicPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Duration (mins)</label>
                  <input
                    type="number"
                    value={topicDuration}
                    onChange={(e) => setTopicDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={topicDeadline}
                    onChange={(e) => setTopicDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Prerequisite Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Prerequisite Topics</label>
                <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {allTopics
                    .filter((t) => t.id !== editingTopic?.topic?.id)
                    .map((t) => {
                      const isChecked = topicPrereqs.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTopicPrereqs((prev) => [...prev, t.id]);
                              } else {
                                setTopicPrereqs((prev) => prev.filter((id) => id !== t.id));
                              }
                            }}
                            className="rounded accent-emerald-600 border-slate-300"
                          />
                          <span>{t.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Personal Notes</label>
                <textarea
                  rows={2}
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  placeholder="Key takeaways, formulas, code snippets..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTopic}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Save Topic
              </button>
            </div>
          </div>
        </div>
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
