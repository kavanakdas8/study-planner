"use client";

import React, { useState } from "react";
import {
  Check,
  Play,
  Clock,
  ChevronRight,
  ChevronDown,
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Layers,
  Edit3,
  Trash2,
} from "lucide-react";
import { SavedPlan, Task, ResourceType } from "@/types/study";

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
  onEditModule?: (moduleIndex: number) => void;
  onDeleteModule?: (moduleIndex: number) => void;
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
  onEditModule,
  onDeleteModule,
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
        const code = overallIndex.toString().padStart(2, "0");
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

  // Group filtered tasks by periodIndex
  const tasksByPeriod = React.useMemo(() => {
    const map = new Map<number, typeof filteredTasks>();
    filteredTasks.forEach((item) => {
      const arr = map.get(item.periodIndex) || [];
      arr.push(item);
      map.set(item.periodIndex, arr);
    });
    return map;
  }, [filteredTasks]);

  const visiblePeriods = React.useMemo(() => {
    return plan.schedule
      .map((period, pIdx) => ({
        period,
        pIdx,
        tasks: tasksByPeriod.get(pIdx) || [],
      }))
      .filter(({ pIdx, tasks }) => {
        if (selectedPeriodIndex !== null && pIdx !== selectedPeriodIndex) {
          return false;
        }
        if (
          (searchQuery.trim() || (resourceFilter && resourceFilter !== "All")) &&
          tasks.length === 0
        ) {
          return false;
        }
        return true;
      });
  }, [plan.schedule, tasksByPeriod, selectedPeriodIndex, searchQuery, resourceFilter]);

  const getResourceBadge = (type: ResourceType) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("exercise") || lower.includes("practice") || lower.includes("code")) {
      return {
        icon: <Terminal className="w-3 h-3" />,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Exercise",
      };
    }
    if (lower.includes("doc") || lower.includes("api") || lower.includes("ref")) {
      return {
        icon: <BookOpen className="w-3 h-3" />,
        className: "bg-sky-50 text-sky-700 border-sky-200",
        label: "Documentation",
      };
    }
    if (lower.includes("video") || lower.includes("tutorial") || lower.includes("watch")) {
      return {
        icon: <PlayCircle className="w-3 h-3" />,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Video",
      };
    }
    if (lower.includes("read") || lower.includes("book") || lower.includes("article")) {
      return {
        icon: <FileText className="w-3 h-3" />,
        className: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Reading",
      };
    }
    return {
      icon: <Layers className="w-3 h-3" />,
      className: "bg-slate-100 text-slate-700 border-slate-200",
      label: type || "General",
    };
  };

  const handleCheckboxClick = (taskId: string) => {
    onToggleTask(taskId);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Table Header Filter Status Bar */}
      {selectedPeriodIndex !== null && (
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-900">
              Filtered by Period:
            </span>
            <span className="text-emerald-700 font-medium">
              {plan.schedule[selectedPeriodIndex]?.period_label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearPeriodFilter}
            className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
          >
            Show All Periods
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-medium select-none">
              <th className="py-3 px-3.5 w-10 text-center">
                <span className="sr-only">Status</span>
              </th>
              <th className="py-3 px-3 w-24 font-mono text-[11px]">ID</th>
              <th className="py-3 px-3 font-semibold text-slate-700">Task Title & Details</th>
              <th className="py-3 px-3 w-40 hidden md:table-cell">Milestone Phase</th>
              <th className="py-3 px-3 w-32 hidden sm:table-cell">Category</th>
              <th className="py-3 px-3 w-24 text-right font-mono">Duration</th>
              <th className="py-3 px-4 w-28 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiblePeriods.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <p className="font-medium">No tasks found matching your filter criteria.</p>
                  {onViewAllClick && (
                    <button
                      type="button"
                      onClick={onViewAllClick}
                      className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              visiblePeriods.map(({ period, pIdx, tasks }) => (
                <React.Fragment key={`period_group_${pIdx}`}>
                  {/* Module Group Header Row */}
                  <tr className="bg-slate-50/90 border-y border-slate-200">
                    <td colSpan={7} className="py-2.5 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide shrink-0">
                            Module {pIdx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {period.period_label}
                          </span>
                          {period.topic_summary && (
                            <span className="text-[11px] text-slate-500 truncate hidden lg:inline">
                              • {period.topic_summary}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-mono text-slate-500 mr-1.5 hidden sm:inline">
                            {period.tasks.length} {period.tasks.length === 1 ? "task" : "tasks"}
                          </span>
                          {onEditModule && (
                            <button
                              type="button"
                              onClick={() => onEditModule(pIdx)}
                              title={`Edit module: ${period.period_label}`}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-white rounded transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteModule && (
                            <button
                              type="button"
                              onClick={() => onDeleteModule(pIdx)}
                              title={`Delete module: ${period.period_label}`}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Tasks under this module */}
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 px-6 text-center text-slate-400 text-xs italic bg-slate-50/30">
                        No tasks in this module yet.
                      </td>
                    </tr>
                  ) : (
                    tasks.map(({ task, taskId, periodLabel, code }) => {
                      const isCompleted = !!completedTasksMap[taskId];
                      const isExpanded = !!expandedTaskIds[taskId];
                      const isTimerActive = activeTimerTaskId === taskId;
                      const badge = getResourceBadge(task.resource_type);

                      return (
                        <React.Fragment key={taskId}>
                          <tr
                            className={`group transition-colors duration-100 ${
                              isCompleted
                                ? "bg-slate-50/50 text-slate-400"
                                : "hover:bg-slate-50/70 text-slate-700"
                            }`}
                          >
                            {/* Checkbox Column */}
                            <td className="py-3 px-3.5 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleCheckboxClick(taskId)}
                                aria-label={`Mark ${task.title} as ${isCompleted ? "incomplete" : "complete"}`}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer mx-auto ${
                                  isCompleted
                                    ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                                    : "border-slate-300 bg-white hover:border-emerald-500 text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </button>
                            </td>

                            {/* Code ID */}
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-400 align-top whitespace-nowrap">
                              {code}
                            </td>

                            {/* Title & Accordion Toggle */}
                            <td className="py-3 px-3 align-top min-w-[200px]">
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(taskId)}
                                  className="mt-0.5 p-0.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer shrink-0"
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <span
                                    onClick={() => toggleExpand(taskId)}
                                    className={`font-semibold cursor-pointer block ${
                                      isCompleted
                                        ? "line-through text-slate-400"
                                        : "text-slate-900 hover:text-emerald-700"
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  {/* Mobile only badges */}
                                  <div className="flex sm:hidden items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">
                                      {task.duration_minutes}m
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Milestone Period */}
                            <td className="py-3 px-3 text-slate-500 align-top hidden md:table-cell truncate max-w-[160px]">
                              {periodLabel}
                            </td>

                            {/* Category Badge */}
                            <td className="py-3 px-3 align-top hidden sm:table-cell">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badge.className}`}
                              >
                                {badge.icon}
                                <span>{badge.label}</span>
                              </span>
                            </td>

                            {/* Duration */}
                            <td className="py-3 px-3 font-mono text-slate-600 align-top text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {task.duration_minutes}m
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-center align-top">
                              <button
                                type="button"
                                onClick={() => onStartFocus(task, taskId, periodLabel)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                  isTimerActive
                                    ? "bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold"
                                    : "bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700"
                                }`}
                                title="Start focus timer"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Focus</span>
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Description Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td colSpan={7} className="py-3 px-6 sm:px-12 text-xs text-slate-700 border-b border-slate-100">
                                <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1.5 shadow-2xs">
                                  <span className="font-semibold text-emerald-800 text-[11px] block">
                                    Task Instructions & Key Concepts
                                  </span>
                                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
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
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
