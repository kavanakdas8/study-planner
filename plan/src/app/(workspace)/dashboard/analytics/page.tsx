"use client";

import React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { AnalyticsView } from "@/components/AnalyticsView";

export default function AnalyticsRoute() {
  const {
    sessions,
    activePlan,
    completedTasksMap,
    userSettings,
    startFocus,
  } = useWorkspace();

  return (
    <AnalyticsView
      sessions={sessions}
      plan={activePlan}
      completedTasksMap={completedTasksMap}
      userSettings={userSettings}
      onStartFocus={() => {
        if (activePlan?.schedule[0]?.tasks[0]) {
          startFocus(
            activePlan.schedule[0].tasks[0],
            `${activePlan.id}_0_0`,
            activePlan.schedule[0].period_label
          );
        }
      }}
    />
  );
}
