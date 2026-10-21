"use client";

import React from "react";
import { Clock } from "lucide-react";
import { SavedPlan, Task } from "@/types/study";
import { TaskCard } from "./TaskCard";
import { formatMinutes } from "@/lib/utils";

interface KanbanViewProps {
  plan: SavedPlan;
  completedTasksMap: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  onStartFocus: (task: Task, taskId: string, periodLabel: string) => void;
  activeTimerTaskId: string | null;
  searchQuery: string;
  resourceFilter: string;
}

export function KanbanView({
  plan,
  completedTasksMap,
  onToggleTask,
  onStartFocus,
  activeTimerTaskId,
  searchQuery,
  resourceFilter,
}: KanbanViewProps) {
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
    <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
      {plan.schedule.map((period, pIdx) => {
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

        return (
          <div
            key={pIdx}
            className="w-76 sm:w-80 shrink-0 bg-[#0D111B] border border-slate-800/80 rounded-2xl flex flex-col max-h-[75vh] backdrop-blur-md overflow-hidden snap-start shadow-sm"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-800/80 bg-[#0D111B] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center">
                    {pIdx + 1}
                  </span>
                  <span>{period.period_label}</span>
                </span>

                <span className="font-mono text-[10px] text-slate-400 bg-[#070A11] px-1.5 py-0.5 rounded border border-slate-800">
                  {formatMinutes(periodTotalMinutes)}
                </span>
              </div>

              <p className="text-[11px] text-indigo-300 font-medium truncate mt-1">
                {period.topic_summary}
              </p>

              {/* Column Progress Bar */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${periodPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  {periodCompletedCount}/{period.tasks.length}
                </span>
              </div>
            </div>

            {/* Column Task Cards Stack */}
            <div className="p-2.5 overflow-y-auto space-y-2 flex-1 scrollbar-thin bg-[#070A11]/30">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">
                  No matching tasks
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const originalIndex = period.tasks.findIndex((t) => t === task);
                  const taskId = `${plan.id}_${pIdx}_${originalIndex}`;
                  const isDone = !!completedTasksMap[taskId];
                  const isTimerRunning = activeTimerTaskId === taskId;

                  return (
                    <TaskCard
                      key={taskId}
                      task={task}
                      taskId={taskId}
                      isCompleted={isDone}
                      onToggleComplete={() => onToggleTask(taskId)}
                      onStartFocus={() => onStartFocus(task, taskId, period.period_label)}
                      isTimerActive={isTimerRunning}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
