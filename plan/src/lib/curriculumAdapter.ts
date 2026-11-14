import {
  SavedPlan,
  CurriculumModule,
  CurriculumTopic,
  Milestone,
  RevisionItem,
  StudySession,
  UserSettings,
  DifficultyLevel,
  PriorityLevel,
  TopicStatus,
} from "@/types/study";

export const STORAGE_KEY_PLANS = "study_planner_saved_plans_v1";
export const STORAGE_KEY_ACTIVE_ID = "study_planner_active_plan_id_v1";
export const STORAGE_KEY_PROGRESS = "study_planner_completed_tasks_v1";
export const STORAGE_KEY_SIDEBAR_COLLAPSED = "study_planner_sidebar_collapsed_v1";
export const STORAGE_KEY_ACTIVE_TIMER = "study_planner_active_timer_v1";
export const STORAGE_KEY_SESSIONS = "study_planner_sessions_v1";
export const STORAGE_KEY_SETTINGS = "study_planner_settings_v1";
export const STORAGE_KEY_VIEW_MODE = "study_planner_view_mode_v1";
export const STORAGE_KEY_ONBOARDING = "study_planner_onboarding_v1";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  general: {
    displayName: "Alex Developer",
    avatarInitials: "AD",
    defaultDashboardView: "table",
    defaultPlanId: "plan_seed_enterprise_01",
    language: "en",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12h",
  },
  study: {
    dailyStudyGoalHours: 2.5,
    preferredStudyDays: [1, 2, 3, 4, 5], // Mon-Fri
    dailyAvailableHours: 3,
    defaultTaskDurationMinutes: 45,
    weeklyStudyTargetHours: 15,
    preferredDifficulty: "Intermediate",
    autoRescheduling: true,
    revisionScheduler: true,
    revisionIntervals: [1, 3, 7, 14],
  },
  timer: {
    pomodoroDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    autoStartNextSession: false,
    soundNotifications: true,
    completionChime: true,
    timerDisplay: "minimal",
  },
  appearance: {
    theme: "light",
    accentColor: "emerald",
    layoutDensity: "comfortable",
    sidebarCollapsedDefault: false,
    animations: true,
    graphGrid: true,
  },
  notifications: {
    dailyReminders: true,
    deadlineAlerts: true,
    missedSessionAlerts: true,
    weeklySummaries: true,
    streakReminders: true,
    milestoneAlerts: true,
  },
};

/**
 * Ensures a SavedPlan has fully populated modules, topics, milestones, and revision schedule.
 * If loaded from legacy schedule-only data, it automatically synthesizes them.
 */
export function normalizePlanToCurriculum(
  plan: SavedPlan,
  completedMap: Record<string, boolean> = {}
): SavedPlan {
  // If modules already exist and match schedule length, keep them updated
  if (plan.modules && plan.modules.length > 0) {
    const updatedModules = plan.modules.map((m, mIdx) => {
      const updatedTopics = m.topics.map((t, tIdx) => {
        // Calculate completion percentage from tasks
        let completedTasks = 0;
        t.tasks.forEach((_, taskIdx) => {
          const taskId = `${plan.id}_${mIdx}_${tIdx}_${taskIdx}`;
          const legacyTaskId = `${plan.id}_${mIdx}_${taskIdx}`;
          if (completedMap[taskId] || completedMap[legacyTaskId]) {
            completedTasks++;
          }
        });

        const pct = t.tasks.length > 0 ? Math.round((completedTasks / t.tasks.length) * 100) : 0;
        const status: TopicStatus =
          pct === 100 ? "Completed" : pct > 0 ? "In Progress" : "Not Started";

        return {
          ...t,
          completion_percentage: pct,
          status,
        };
      });

      return {
        ...m,
        topics: updatedTopics,
      };
    });

    const milestones = plan.milestones && plan.milestones.length > 0
      ? plan.milestones
      : generateDefaultMilestones(plan, updatedModules);

    const revisions = plan.revisions && plan.revisions.length > 0
      ? plan.revisions
      : generateDefaultRevisions(plan, updatedModules);

    return {
      ...plan,
      modules: updatedModules,
      milestones,
      revisions,
    };
  }

  // Synthesize modules from schedule
  const modules: CurriculumModule[] = (plan.schedule || []).map((period, pIdx) => {
    let totalMinutes = 0;
    period.tasks.forEach((t) => (totalMinutes += t.duration_minutes || 0));

    // Group tasks into 1 or 2 cohesive topics per period
    const topics: CurriculumTopic[] = [
      {
        id: `topic_${plan.id}_${pIdx}_0`,
        name: period.period_label,
        description: period.topic_summary,
        difficulty: (pIdx === 0
          ? "Beginner"
          : pIdx < (plan.schedule.length - 1)
          ? "Intermediate"
          : "Advanced") as DifficultyLevel,
        estimated_duration_minutes: totalMinutes,
        actual_minutes_spent: Math.round(totalMinutes * 0.7),
        priority: (pIdx === 0 ? "High" : pIdx === 1 ? "Medium" : "High") as PriorityLevel,
        status: "In Progress" as TopicStatus,
        completion_percentage: 0,
        resources: period.tasks.map((task) => ({
          title: `${task.resource_type}: ${task.title}`,
          type: task.resource_type,
        })),
        notes: `Focus on mastering the underlying architectural invariants of ${period.period_label}.`,
        deadline: new Date(Date.now() + (pIdx + 1) * 86400000 * 3).toISOString().split("T")[0],
        confidence: pIdx === 0 ? 4 : 2,
        prerequisiteIds: pIdx > 0 ? [`topic_${plan.id}_${pIdx - 1}_0`] : [],
        tasks: period.tasks.map((task, tIdx) => ({
          ...task,
          id: `${plan.id}_${pIdx}_${tIdx}`,
          completed: !!completedMap[`${plan.id}_${pIdx}_${tIdx}`],
        })),
      },
    ];

    // Compute initial completion
    let completedCount = 0;
    topics[0].tasks.forEach((_, tIdx) => {
      if (completedMap[`${plan.id}_${pIdx}_${tIdx}`]) completedCount++;
    });
    const pct = topics[0].tasks.length > 0 ? Math.round((completedCount / topics[0].tasks.length) * 100) : 0;
    topics[0].completion_percentage = pct;
    topics[0].status = pct === 100 ? "Completed" : pct > 0 ? "In Progress" : "Not Started";

    return {
      id: `module_${plan.id}_${pIdx}`,
      title: period.period_label,
      summary: period.topic_summary,
      estimated_hours: Number((totalMinutes / 60).toFixed(1)),
      topics,
    };
  });

  const milestones = generateDefaultMilestones(plan, modules);
  const revisions = generateDefaultRevisions(plan, modules);

  return {
    ...plan,
    modules,
    milestones,
    revisions,
  };
}

function generateDefaultMilestones(plan: SavedPlan, modules: CurriculumModule[]): Milestone[] {
  const mod0Title = modules[0]?.title || "Module 1";
  return [
    {
      id: `ms_${plan.id}_1`,
      title: `${mod0Title} Foundations Mastery`,
      description: `Complete foundational exercises and core tasks for ${plan.subject}`,
      target_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      type: "module_completion",
      target_value: modules[0]?.id || "",
      completed: modules[0]?.topics.every((t) => t.status === "Completed") || false,
    },
    {
      id: `ms_${plan.id}_2`,
      title: "Halfway Learning Milestone (50%)",
      description: `Reach 50% completion across all ${plan.subject} curriculum tasks`,
      target_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      type: "percentage",
      target_value: 50,
      completed: false,
    },
    {
      id: `ms_${plan.id}_3`,
      title: "Complete All Core Topics",
      description: `Successfully master intermediate concepts and exercises in ${plan.subject}`,
      target_date: new Date(Date.now() + 86400000 * 11).toISOString().split("T")[0],
      type: "difficulty",
      target_value: "Intermediate",
      completed: false,
    },
    {
      id: `ms_${plan.id}_4`,
      title: "Full Course Graduation",
      description: `Finish all curriculum milestones and final review for ${plan.subject}`,
      target_date: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
      type: "course_completion",
      completed: false,
    },
  ];
}

function generateDefaultRevisions(plan: SavedPlan, modules: CurriculumModule[]): RevisionItem[] {
  const items: RevisionItem[] = [];
  const today = new Date();

  modules.forEach((mod, mIdx) => {
    mod.topics.forEach((t) => {
      // Create revision items for early topics
      if (mIdx === 0) {
        items.push({
          id: `rev_${t.id}_1`,
          topicId: t.id,
          topicName: t.name,
          moduleTitle: mod.title,
          stage: 2,
          intervalDays: 3,
          dueDate: new Date(today.getTime() + 86400000).toISOString().split("T")[0],
          completed: false,
          lastReviewedAt: Date.now() - 86400000 * 2,
        });
        items.push({
          id: `rev_${t.id}_2`,
          topicId: t.id,
          topicName: `${t.name} (Invariants Verification)`,
          moduleTitle: mod.title,
          stage: 3,
          intervalDays: 7,
          dueDate: new Date(today.getTime() + 86400000 * 4).toISOString().split("T")[0],
          completed: false,
        });
      }
    });
  });

  return items;
}

/**
 * Synchronizes modifications from curriculum modules back into schedule
 * so that Dashboard, Card, Timeline, and Table views stay updated.
 */
export function syncCurriculumToSchedule(plan: SavedPlan): SavedPlan {
  if (!plan.modules) return plan;

  const newSchedule = plan.modules.map((m, mIdx) => {
    const allTasks = m.topics.flatMap((t) => t.tasks);
    const tasks =
      allTasks.length > 0
        ? allTasks
        : [
            {
              id: `${plan.id}_${mIdx}_0`,
              title: `${m.title} - Core Practice & Study`,
              description: m.summary || `Fundamental concepts and study exercises for ${m.title}`,
              duration_minutes: 60,
              resource_type: "Practice" as const,
              completed: false,
            },
          ];
    return {
      period_label: m.title,
      topic_summary: m.summary || m.topics.map((t) => t.name).join(" • "),
      tasks,
    };
  });

  return {
    ...plan,
    schedule: newSchedule,
    lastModifiedAt: Date.now(),
  };
}

/**
 * Generates initial realistic study sessions for the default plan
 * so the Analytics dashboard has actual recorded data immediately.
 */
export function generateSeedSessions(planId: string): StudySession[] {
  const sessions: StudySession[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  // Past 14 days of realistic sessions
  const sessionBlueprints = [
    { daysAgo: 12, mins: 45, task: "Implement gRPC schema and binary serializer", subject: "Full-Stack Distributed Systems Architecture", period: "Foundations & Protocol Buffers", hour: 10 },
    { daysAgo: 11, mins: 30, task: "Review Raft protocol paper and state machine safety", subject: "Full-Stack Distributed Systems Architecture", period: "Foundations & Protocol Buffers", hour: 14 },
    { daysAgo: 9, mins: 40, task: "Setup concurrent worker thread pool", subject: "Full-Stack Distributed Systems Architecture", period: "Foundations & Protocol Buffers", hour: 19 },
    { daysAgo: 8, mins: 50, task: "Build distributed leader election heartbeat loop", subject: "Full-Stack Distributed Systems Architecture", period: "Deep Dive: Consensus & Replication", hour: 20 },
    { daysAgo: 7, mins: 35, task: "Examine consensus failure modes in Jepsen tests", subject: "Full-Stack Distributed Systems Architecture", period: "Deep Dive: Consensus & Replication", hour: 9 },
    { daysAgo: 5, mins: 45, task: "Implement append entries RPC with rollback verification", subject: "Full-Stack Distributed Systems Architecture", period: "Deep Dive: Consensus & Replication", hour: 15 },
    { daysAgo: 4, mins: 60, task: "Design Write-Ahead Log (WAL) disk persistence", subject: "Full-Stack Distributed Systems Architecture", period: "Project Implementation: Storage Engine", hour: 19 },
    { daysAgo: 3, mins: 30, task: "Watch storage engine architecture teardown", subject: "Full-Stack Distributed Systems Architecture", period: "Project Implementation: Storage Engine", hour: 20 },
    { daysAgo: 2, mins: 45, task: "Build concurrent skiplist MemTable with lock-free reads", subject: "Full-Stack Distributed Systems Architecture", period: "Project Implementation: Storage Engine", hour: 14 },
    { daysAgo: 1, mins: 50, task: "Instrument OpenTelemetry spans across RPC boundaries", subject: "Full-Stack Distributed Systems Architecture", period: "Review & Production Polish", hour: 18 },
    { daysAgo: 0, mins: 40, task: "Run Chaos Mesh network partition simulations", subject: "Full-Stack Distributed Systems Architecture", period: "Review & Production Polish", hour: 11 },
  ];

  sessionBlueprints.forEach((sb, idx) => {
    const started = new Date(now - sb.daysAgo * dayMs);
    started.setHours(sb.hour, 0, 0, 0);
    const completed = new Date(started.getTime() + sb.mins * 60000);

    sessions.push({
      id: `session_${planId}_${idx}`,
      planId,
      taskId: `${planId}_task_${idx}`,
      taskTitle: sb.task,
      subject: sb.subject,
      periodLabel: sb.period,
      startedAt: started.getTime(),
      completedAt: completed.getTime(),
      durationMinutes: sb.mins,
      mode: "focus",
      completed: true,
    });
  });

  return sessions;
}

