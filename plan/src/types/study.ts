export type ResourceType = 'Exercise' | 'Documentation' | 'Video' | 'Reading' | string;
export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TopicStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Task {
  id?: string;
  title: string;
  duration_minutes: number;
  description: string;
  resource_type: ResourceType;
  deadline?: string;
  completed?: boolean;
  notes?: string;
}

export interface CurriculumResource {
  title: string;
  url?: string;
  type: ResourceType;
}

export interface CurriculumTopic {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  estimated_duration_minutes: number;
  actual_minutes_spent: number;
  priority: PriorityLevel;
  status: TopicStatus;
  completion_percentage: number;
  resources: CurriculumResource[];
  notes?: string;
  deadline?: string;
  confidence: number; // 1 to 5
  prerequisiteIds?: string[]; // IDs of topics that must be completed first
  tasks: Task[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  summary: string;
  estimated_hours: number;
  topics: CurriculumTopic[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  type: 'module_completion' | 'percentage' | 'difficulty' | 'course_completion' | 'custom';
  target_value?: string | number;
  completed: boolean;
  completedAt?: number;
}

export interface RevisionItem {
  id: string;
  topicId: string;
  topicName: string;
  moduleTitle: string;
  stage: number; // 1 (1d), 2 (3d), 3 (7d), 4 (14d), 5 (Mastered)
  intervalDays: number;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: number;
  lastReviewedAt?: number;
}

export interface PeriodSchedule {
  period_label: string;
  topic_summary: string;
  tasks: Task[];
}

export interface StudyPlan {
  subject: string;
  target_timeframe: string;
  overview: string;
  schedule: PeriodSchedule[];
}

export interface SavedPlan extends StudyPlan {
  id: string;
  createdAt: number;
  daily_hours: number;
  experience_level: string;
  modules?: CurriculumModule[];
  milestones?: Milestone[];
  revisions?: RevisionItem[];
  lastModifiedAt?: number;
}

export interface ActiveTimer {
  taskId: string;
  taskTitle: string;
  periodLabel: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastTickAt?: number;
}

export interface StudySession {
  id: string;
  planId: string;
  taskId: string;
  taskTitle: string;
  subject: string;
  periodLabel: string;
  startedAt: number;
  completedAt: number;
  durationMinutes: number;
  mode: 'focus' | 'break' | 'manual' | 'revision';
  completed: boolean;
}

export interface UserSettings {
  general: {
    displayName: string;
    avatarInitials: string;
    defaultDashboardView: 'table' | 'kanban' | 'timeline' | 'graph';
    defaultPlanId: string;
    language: string;
    dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
    timeFormat: '12h' | '24h';
  };
  study: {
    dailyStudyGoalHours: number;
    preferredStudyDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    dailyAvailableHours: number;
    defaultTaskDurationMinutes: number;
    weeklyStudyTargetHours: number;
    preferredDifficulty: DifficultyLevel;
    autoRescheduling: boolean;
    revisionScheduler: boolean;
    revisionIntervals: number[]; // default [1, 3, 7, 14]
  };
  timer: {
    pomodoroDurationMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    autoStartBreaks: boolean;
    autoStartNextSession: boolean;
    soundNotifications: boolean;
    completionChime: boolean;
    timerDisplay: 'minimal' | 'expanded';
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    accentColor: 'orange' | 'emerald' | 'indigo' | 'amber' | 'rose';
    layoutDensity: 'comfortable' | 'compact';
    sidebarCollapsedDefault: boolean;
    animations: boolean;
    graphGrid: boolean;
  };
  notifications: {
    dailyReminders: boolean;
    deadlineAlerts: boolean;
    missedSessionAlerts: boolean;
    weeklySummaries: boolean;
    streakReminders: boolean;
    milestoneAlerts: boolean;
  };
}

export type AppViewMode = 'landing' | 'login' | 'signup' | 'dashboard';

export interface OnboardingSelection {
  subject: string;
  dailyMinutes: number;
  dailyLabel: string;
  durationDays: number;
  durationLabel: string;
  level?: DifficultyLevel | '';
  totalEstimatedHours: number;
  selectedAt: number;
}

