"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle2 } from "lucide-react";
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
}

export function TimelineView({
  plan,
  completedTasksMap,
  onToggleTask,
  onStartFocus,
  activeTimerTaskId,
  searchQuery,
  resourceFilter,
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
      <div className="hidden sm:block absolute left-8 top-6 bottom-6 w-px bg-[#1f2128] -z-0" />

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
            className="relative z-10 bg-[#121316] border border-[#1f2128] rounded-2xl overflow-hidden backdrop-blur-md transition-all hover:border-[#2a2d36] shadow-sm"
          >
            {/* Period Accordion Header */}
            <div
              onClick={() => togglePeriod(pIdx)}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-[#121316] hover:bg-[#181a1f] transition border-b border-[#1f2128]"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Numbered Period Marker */}
                <div className="w-8 h-8 rounded-xl bg-[#ea580c]/15 border border-[#ea580c]/30 text-[#f97316] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {pIdx + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {period.period_label}
                    </h3>
                    <span className="text-[11px] font-medium text-[#f97316] bg-[#ea580c]/10 border border-[#ea580c]/20 px-2 py-0.5 rounded truncate max-w-[280px]">
                      {period.topic_summary}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: duration, completion ratio, progress bar, chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatMinutes(periodTotalMinutes)}
                  </span>
                  <span className="text-[#1f2128]">•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {periodCompletedCount}/{period.tasks.length}
                  </span>
                </div>

                <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white">
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Micro Progress Bar on bottom edge of period header */}
            <div className="w-full bg-[#0a0a0c] h-1">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${periodPercent}%` }}
              />
            </div>

            {/* Task Cards Stack */}
            {!isCollapsed && (
              <div className="p-3.5 sm:p-4 space-y-2 bg-[#0a0a0c]/60">
                {filteredTasks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 italic">
                    No tasks match the active filter for {period.period_label}.
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
            )}
          </div>
        );
      })}
    </div>
  );
}
