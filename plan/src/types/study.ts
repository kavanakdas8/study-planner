export type ResourceType = 'Exercise' | 'Documentation' | 'Video' | 'Reading' | string;

export interface Task {
  title: string;
  duration_minutes: number;
  description: string;
  resource_type: ResourceType;
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
