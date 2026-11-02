"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit3, Trash2 } from "lucide-react";
import { SavedPlan, Task } from "@/types/study";
import { TaskCard } from "./TaskCard";
import { formatMinutes } from "@/lib/utils";

interface TimelineViewProps {
  plan: SavedPlan;
  completedTasksMap: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  onStartFocus: (task: Task, taskId: string, periodLabel: string) => void;
  activeTimerTaskId: string | null;
  searchQuery: string;
  resourceFilter: string;
  onEditModule?: (moduleIndex: number) => void;
  onDeleteModule?: (moduleIndex: number) => void;
}

export function TimelineView({
  plan,
  completedTasksMap,
  onToggleTask,
  onStartFocus,
  activeTimerTaskId,
  searchQuery,
  resourceFilter,
  onEditModule,
  onDeleteModule,
}: TimelineViewProps) {
  const [collapsedPeriods, setCollapsedPeriods] = useState<Record<number, boolean>>({});

  const togglePeriod = (pIdx: number) => {
    setCollapsedPeriods((prev) => ({
      ...prev,
      [pIdx]: !prev[pIdx],
    }));
  };

  const matchesFilter = (task: Task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || "").toLowerCase().includes(q);
      const matchDesc = (task.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (resourceFilter && resourceFilter !== "All") {
      if (!(task.resource_type || "").toLowerCase().includes(resourceFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="relative space-y-4">
      {/* Subtle Vertical Connector Line */}
      <div className="hidden sm:block absolute left-8 top-6 bottom-6 w-px bg-slate-200 -z-0" />

      {plan.schedule.map((period, pIdx) => {
        const isCollapsed = collapsedPeriods[pIdx];
        const filteredTasks = period.tasks.filter(matchesFilter);

        const periodTotalMinutes = period.tasks.reduce(
          (acc, t) => acc + (t.duration_minutes || 0),
          0
        );

        let periodCompletedCount = 0;
        period.tasks.forEach((_, tIdx) => {
          if (completedTasksMap[`${plan.id}_${pIdx}_${tIdx}`]) periodCompletedCount++;
        });

        const periodPercent =
          period.tasks.length > 0
            ? Math.round((periodCompletedCount / period.tasks.length) * 100)
            : 0;

        // When searching, hide period if none of its tasks match
        if (searchQuery && filteredTasks.length === 0) {
          return null;
        }

        return (
          <div
            key={pIdx}
            className="relative z-10 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
          >
            {/* Period Accordion Header */}
            <div
              onClick={() => togglePeriod(pIdx)}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Numbered Period Marker */}
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {pIdx + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {period.period_label}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {formatMinutes(periodTotalMinutes)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate max-w-xl mt-0.5">
                    {period.topic_summary}
                  </p>
                </div>
              </div>

              {/* Right: Progress bar & Expand Icon */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Progress Mini Bar */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${periodPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-medium">
                    {periodPercent}%
                  </span>
                </div>

                {onEditModule && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditModule(pIdx);
                    }}
                    title={`Edit module: ${period.period_label}`}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDeleteModule && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModule(pIdx);
                    }}
                    title={`Delete module: ${period.period_label}`}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                  title={isCollapsed ? "Expand module" : "Collapse module"}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Tasks Container */}
            {!isCollapsed && (
              <div className="p-4 bg-slate-50/50 space-y-2.5">
                {filteredTasks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No tasks match your filters in this milestone.
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const originalTaskIndex = period.tasks.findIndex((t) => t.title === task.title);
                    const taskId = `${plan.id}_${pIdx}_${originalTaskIndex}`;
                    const isDone = !!completedTasksMap[taskId];
                    const isTimerActive = activeTimerTaskId === taskId;

                    return (
                      <TaskCard
                        key={taskId}
                        task={task}
                        taskId={taskId}
                        isCompleted={isDone}
                        onToggleComplete={() => onToggleTask(taskId)}
                        onStartFocus={() => onStartFocus(task, taskId, period.period_label)}
                        isTimerActive={isTimerActive}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
