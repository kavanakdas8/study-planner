"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { HeaderKPI } from "@/components/HeaderKPI";
import { EmptyStateHero } from "@/components/EmptyStateHero";
import { Task, OnboardingSelection } from "@/types/study";
import {
  Clock,
  Play,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function DashboardRoute() {
  const router = useRouter();
  const {
    activePlan,
    completedTasksMap,
    toggleTask,
    startFocus,
    selectedPeriodIndex,
    setSelectedPeriodIndex,
    onboardingSelection,
    dismissOnboardingSelection,
    exportFeedback,
    clearExportFeedback,
    exportPDF,
    isExportingPDF,
    exportMarkdown,
    createPlanFromSelection,
  } = useWorkspace();

  // Aggregate KPI metrics for active plan
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

  // Next pending tasks for today's schedule
  const pendingTasksList = useMemo(() => {
    if (!activePlan) return [];
    const list: Array<{
      task: Task;
      taskId: string;
      periodLabel: string;
      periodIdx: number;
      taskIdx: number;
    }> = [];

    activePlan.schedule.forEach((period, pIdx) => {
      period.tasks.forEach((task, tIdx) => {
        const taskId = `${activePlan.id}_${pIdx}_${tIdx}`;
        if (!completedTasksMap[taskId]) {
          list.push({
            task,
            taskId,
            periodLabel: period.period_label,
            periodIdx: pIdx,
            taskIdx: tIdx,
          });
        }
      });
    });
    return list;
  }, [activePlan, completedTasksMap]);

  const todayPriorityTask = pendingTasksList[0] || null;
  const upcomingTasksSlice = pendingTasksList.slice(1, 5);

  if (!activePlan) {
    return (
      <EmptyStateHero
        onOpenModal={() => router.push("/create-plan")}
        onGeneratePreset={async (preset) => {
          const hours = preset.daily_hours;
          const dailyLabel =
            hours === 0.5 ? "30 min" : hours === 1 ? "1 hour" : `${hours} hours`;
          const durationDays =
            preset.timeframe === "3 Days"
              ? 3
              : preset.timeframe === "1 Week"
              ? 7
              : preset.timeframe === "2 Weeks"
              ? 14
              : 30;
          const totalEstimatedHours = Math.round(preset.daily_hours * durationDays);
          const selection: OnboardingSelection = {
            subject: preset.topic,
            dailyMinutes: Math.round(preset.daily_hours * 60),
            dailyLabel,
            durationDays,
            durationLabel: preset.timeframe,
            level:
              (preset.experience_level as "Beginner" | "Intermediate" | "Advanced") ||
              "Intermediate",
            totalEstimatedHours,
            selectedAt: Date.now(),
          };
          await createPlanFromSelection(selection);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Goal Summary Banner */}
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
            onClick={dismissOnboardingSelection}
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
            onClick={clearExportFeedback}
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
        onExportPDF={exportPDF}
        isExportingPDF={isExportingPDF}
        onExportMarkdown={exportMarkdown}
        selectedPeriodLabel={
          selectedPeriodIndex !== null
            ? activePlan.schedule[selectedPeriodIndex]?.period_label
            : "All Periods"
        }
        onSelectPeriodLabel={(label) => {
          if (label === "All Periods") {
            setSelectedPeriodIndex(null);
          } else {
            const idx = activePlan.schedule.findIndex(
              (p) => p.period_label === label
            );
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
                  startFocus(
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
                onClick={() => toggleTask(todayPriorityTask.taskId)}
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
                      onClick={() => toggleTask(item.taskId)}
                      aria-label="Complete task"
                      className="w-4 h-4 rounded border border-slate-300 hover:border-emerald-500 bg-white flex items-center justify-center transition cursor-pointer shrink-0"
                    />
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
                        startFocus(item.task, item.taskId, item.periodLabel)
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
  );
}
