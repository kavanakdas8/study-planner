"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CurriculumRoadmapView } from "@/components/CurriculumRoadmapView";

export default function CurriculumRoute() {
  const router = useRouter();
  const {
    activePlan,
    completedTasksMap,
    toggleTask,
    startFocus,
    activeTimer,
    updateDraftPlan,
    saveDraftChanges,
    discardDraftChanges,
    hasUnsavedChanges,
    userSettings,
    searchQuery,
    setSearchQuery,
  } = useWorkspace();

  if (!activePlan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">
          No Active Curriculum
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Create a new study curriculum or select an existing one from your study history to view the roadmap.
        </p>
        <button
          type="button"
          onClick={() => router.push("/create-plan")}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
        >
          Create Curriculum
        </button>
      </div>
    );
  }

  return (
    <CurriculumRoadmapView
      plan={activePlan}
      completedTasksMap={completedTasksMap}
      onToggleTask={toggleTask}
      onStartFocus={startFocus}
      activeTimerTaskId={activeTimer ? activeTimer.taskId : null}
      onUpdatePlan={updateDraftPlan}
      userSettings={userSettings}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      hasUnsavedChanges={hasUnsavedChanges}
      onSavePlan={saveDraftChanges}
      onDiscardChanges={discardDraftChanges}
    />
  );
}
