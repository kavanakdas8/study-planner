"use client";

import React, { useState } from "react";
import {
  Check,
  Play,
  Pause,
  Timer,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { SavedPlan, Task, ResourceType } from "@/types/study";
import { playChime } from "@/lib/utils";

interface TaskStreamTableProps {
  plan: SavedPlan;
  completedTasksMap: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  onStartFocus: (task: Task, taskId: string, periodLabel: string) => void;
  activeTimerTaskId: string | null;
  searchQuery: string;
  resourceFilter: string;
  selectedPeriodIndex: number | null;
  onClearPeriodFilter?: () => void;
  onViewAllClick?: () => void;
}

export function TaskStreamTable({
  plan,
  completedTasksMap,
  onToggleTask,
  onStartFocus,
  activeTimerTaskId,
  searchQuery,
  resourceFilter,
  selectedPeriodIndex,
  onClearPeriodFilter,
  onViewAllClick,
}: TaskStreamTableProps) {
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Flatten tasks with metadata
  const allTasks = React.useMemo(() => {
    const list: Array<{
      task: Task;
      taskId: string;
      periodLabel: string;
      periodIndex: number;
      taskIndex: number;
      code: string;
    }> = [];

    let overallIndex = 1;
    plan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((task, tIdx) => {
        const taskId = `${plan.id}_${pIdx}_${tIdx}`;
        const code = `TASK-${overallIndex.toString().padStart(2, "0")}`;
        overallIndex++;
        list.push({
          task,
          taskId,
          periodLabel: period.period_label,
          periodIndex: pIdx,
          taskIndex: tIdx,
          code,
        });
      });
    });

    return list;
  }, [plan]);

  // Filter tasks based on search, resource filter, and selected period node
  const filteredTasks = React.useMemo(() => {
    return allTasks.filter(({ task, periodIndex }) => {
      if (selectedPeriodIndex !== null && periodIndex !== selectedPeriodIndex) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (task.title || "").toLowerCase().includes(q);
        const descMatch = (task.description || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      if (resourceFilter && resourceFilter !== "All") {
        if (!(task.resource_type || "").toLowerCase().includes(resourceFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [allTasks, selectedPeriodIndex, searchQuery, resourceFilter]);

  const getResourceBadge = (type: ResourceType) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("exercise") || lower.includes("practice") || lower.includes("code")) {
      return {
        icon: <Terminal className="w-3 h-3" />,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        label: "Exercise",
      };
    }
    if (lower.includes("doc") || lower.includes("api") || lower.includes("ref")) {
      return {
        icon: <BookOpen className="w-3 h-3" />,
        className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        label: "Documentation",
      };
    }
    if (lower.includes("video") || lower.includes("tutorial") || lower.includes("watch")) {
      return {
        icon: <PlayCircle className="w-3 h-3" />,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        label: "Video",
      };
    }
    if (lower.includes("read") || lower.includes("book") || lower.includes("article")) {
      return {
        icon: <FileText className="w-3 h-3" />,
        className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        label: "Reading",
      };
    }
    return {
      icon: <Layers className="w-3 h-3" />,
      className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      label: type || "General",
    };
  };

  const handleCheckboxClick = (taskId: string, isCompleted: boolean) => {
    if (!isCompleted) {
      playChime("complete");
    } else {
      playChime("click");
    }
    onToggleTask(taskId);
  };

  return (
    <div className="bg-[#121316] border border-[#1f2128] rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#1f2128] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121316]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Active Task Stream
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0a0a0c] border border-[#1f2128] text-slate-400">
              {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
            {selectedPeriodIndex !== null && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 flex items-center gap-1.5">
                <span>Phase: {plan.schedule[selectedPeriodIndex]?.period_label}</span>
                {onClearPeriodFilter && (
                  <button
                    type="button"
                    onClick={onClearPeriodFilter}
                    className="hover:text-white ml-0.5"
                    title="Clear phase filter"
                  >
                    ×
                  </button>
                )}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9ca3af]">
            Execution stream synced with curriculum milestones and Pomodoro focus engine.
          </p>
        </div>

        {/* Right-aligned View All / Filter Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onViewAllClick && (
            <button
              type="button"
              onClick={onViewAllClick}
              className="text-xs text-[#f97316] hover:text-[#ea580c] font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Structured High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#0a0a0c] text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[#1f2128]">
              <th className="py-3 px-4 w-[42%]">Task &amp; Objective</th>
              <th className="py-3 px-4 w-[18%]">Type / Resource</th>
              <th className="py-3 px-4 w-[12%]">Duration</th>
              <th className="py-3 px-4 w-[15%]">Status</th>
              <th className="py-3 px-4 w-[13%] text-right">Action / Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2128]/70 text-xs text-slate-300">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                  No tasks match the active filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map(({ task, taskId, periodLabel, code }) => {
                const isCompleted = !!completedTasksMap[taskId];
                const isTimerActive = activeTimerTaskId === taskId;
                const isExpanded = !!expandedTaskIds[taskId];
                const badge = getResourceBadge(task.resource_type);

                return (
                  <React.Fragment key={taskId}>
                    <tr
                      className={`group hover:bg-[#181a1f] transition duration-150 ${
                        isCompleted ? "bg-[#0d0d11]/60 opacity-70" : ""
                      }`}
                    >
                      {/* Column 1: Task & Objective */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleCheckboxClick(taskId, isCompleted)}
                            aria-label={`Mark ${task.title} as ${
                              isCompleted ? "incomplete" : "complete"
                            }`}
                            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                                : "border-slate-600 bg-[#0a0a0c] hover:border-[#f97316]"
                            }`}
                          >
                            {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              onClick={() => toggleExpand(taskId)}
                              className={`font-semibold cursor-pointer block leading-tight transition ${
                                isCompleted
                                  ? "line-through text-slate-500"
                                  : "text-white group-hover:text-[#f97316]"
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                              <span className="text-[#f97316] font-semibold">{code}</span>
                              <span>·</span>
                              <span className="truncate max-w-[240px]">{periodLabel}</span>
                              <button
                                type="button"
                                onClick={() => toggleExpand(taskId)}
                                className="text-slate-400 hover:text-white ml-1 inline-flex items-center gap-0.5 text-[10px]"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Hide</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Details</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Type / Resource */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.className}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Column 3: Duration */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-300 bg-[#0a0a0c] px-2 py-0.5 rounded border border-[#1f2128]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.duration_minutes} mins</span>
                        </span>
                      </td>

                      {/* Column 4: Status Badges */}
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Completed</span>
                          </span>
                        ) : isTimerActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ea580c]/15 text-[#f97316] border border-[#ea580c]/30 text-xs font-mono font-medium animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181a1f] text-slate-400 border border-[#1f2128] text-xs font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Column 5: Action / Focus */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onStartFocus(task, taskId, periodLabel)}
                          title="Start focus session"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isTimerActive
                              ? "bg-[#ea580c]/25 border border-[#ea580c]/50 text-[#f97316] animate-pulse"
                              : "bg-[#ea580c]/15 hover:bg-[#ea580c]/30 text-[#f97316] border border-[#ea580c]/30"
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isTimerActive ? "Focusing" : "Focus"}</span>
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible Detailed Description Row */}
                    {isExpanded && (
                      <tr className="bg-[#0a0a0c]/90">
                        <td colSpan={5} className="py-3 px-6 border-b border-[#1f2128]">
                          <div className="bg-[#121316] p-3.5 rounded-xl border border-[#1f2128] space-y-1.5 animate-fade-in text-xs">
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#f97316]">
                              <span className="font-bold uppercase">
                                Objective &amp; Practice Instructions
                              </span>
                              <span>Target Duration: {task.duration_minutes} minutes</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                              {task.description}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
