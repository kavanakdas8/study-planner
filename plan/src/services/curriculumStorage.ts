import {
  SavedPlan,
  StudySession,
  UserSettings,
  ActiveTimer,
  OnboardingSelection,
} from "@/types/study";
import {
  DEFAULT_USER_SETTINGS,
  normalizePlanToCurriculum,
  generateSeedSessions,
} from "@/lib/curriculumAdapter";

export const STORAGE_KEY_PLANS = "study_planner_saved_plans_v1";
export const STORAGE_KEY_ACTIVE_ID = "study_planner_active_plan_id_v1";
export const STORAGE_KEY_PROGRESS = "study_planner_completed_tasks_v1";
export const STORAGE_KEY_SIDEBAR_COLLAPSED = "study_planner_sidebar_collapsed_v1";
export const STORAGE_KEY_ACTIVE_TIMER = "study_planner_active_timer_v1";
export const STORAGE_KEY_SESSIONS = "study_planner_sessions_v1";
export const STORAGE_KEY_SETTINGS = "study_planner_settings_v1";
export const STORAGE_KEY_ONBOARDING = "study_planner_onboarding_v1";
export const STORAGE_KEY_ROADMAP_SUBVIEW = "study_planner_roadmap_subview_v1";

export const DEFAULT_SEED_PLAN: SavedPlan = {
  id: "plan_seed_enterprise_01",
  subject: "Full-Stack Distributed Systems Architecture",
  target_timeframe: "2 Weeks",
  daily_hours: 2.5,
  experience_level: "Advanced",
  createdAt: 1731500000000,
  overview:
    "An enterprise curriculum covering consensus protocols, RPC transport pipelines, distributed state replication, and production observability.",
  schedule: [
    {
      period_label: "Foundations & Protocol Buffers",
      topic_summary: "Core concurrency models and binary serialization protocols",
      tasks: [
        {
          title: "Implement gRPC schema and binary serializer",
          duration_minutes: 45,
          description:
            "Define Protobuf IDL contracts for distributed RPC calls. Implement client stubs and test network latency.",
          resource_type: "Exercise",
        },
        {
          title: "Review Raft protocol paper and state machine safety",
          duration_minutes: 30,
          description:
            "Deep-dive into Ongaro & Ousterhout Raft paper sections 5.1-5.4 focusing on leader election invariants.",
          resource_type: "Documentation",
        },
        {
          title: "Setup concurrent worker thread pool",
          duration_minutes: 40,
          description:
            "Construct non-blocking worker queue with backpressure signaling and mutex-free ring buffers.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Deep Dive: Consensus & Replication",
      topic_summary: "Leader election, heartbeat timers, and log quorum replication",
      tasks: [
        {
          title: "Build distributed leader election heartbeat loop",
          duration_minutes: 50,
          description:
            "Implement randomized election timeout clocks and handle split-brain vote partition edge cases.",
          resource_type: "Exercise",
        },
        {
          title: "Examine consensus failure modes in Jepsen tests",
          duration_minutes: 35,
          description:
            "Analyze Jepsen network partition logs and verify linearizability guarantees during split brain.",
          resource_type: "Reading",
        },
        {
          title: "Implement append entries RPC with rollback verification",
          duration_minutes: 45,
          description:
            "Construct log entry verification and term matching logic between leader and follower nodes.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Project Implementation: Storage Engine",
      topic_summary: "LSM tree compaction, Write-Ahead Logs, and MemTable flushing",
      tasks: [
        {
          title: "Design Write-Ahead Log (WAL) disk persistence",
          duration_minutes: 60,
          description:
            "Implement sequential append-only WAL with CRC32 checksum validation and crash-recovery replay.",
          resource_type: "Exercise",
        },
        {
          title: "Watch storage engine architecture teardown",
          duration_minutes: 30,
          description:
            "Lecture on LevelDB and RocksDB SSTable bloom filters and multi-level compaction strategies.",
          resource_type: "Video",
        },
        {
          title: "Build concurrent skiplist MemTable with lock-free reads",
          duration_minutes: 45,
          description:
            "Implement memory table backed by skiplist data structure with concurrent read/write isolation.",
          resource_type: "Exercise",
        },
      ],
    },
    {
      period_label: "Review & Production Polish",
      topic_summary: "Distributed tracing, chaos testing, and benchmark suites",
      tasks: [
        {
          title: "Instrument OpenTelemetry spans across RPC boundaries",
          duration_minutes: 40,
          description:
            "Add trace propagation headers and measure p99 tail latency across multi-node cluster.",
          resource_type: "Exercise",
        },
        {
          title: "Run Chaos Mesh network partition simulations",
          duration_minutes: 45,
          description:
            "Inject 100ms jitter and 20% packet drop into follower communication to verify quorum stability.",
          resource_type: "Exercise",
        },
        {
          title: "Conduct architectural sprint retrospective & synthesis",
          duration_minutes: 30,
          description:
            "Consolidate benchmark performance metrics and review edge-case recovery logs.",
          resource_type: "Reading",
        },
      ],
    },
  ],
};

export const DEFAULT_COMPLETED_SEED: Record<string, boolean> = {
  "plan_seed_enterprise_01_0_0": true,
  "plan_seed_enterprise_01_0_1": true,
  "plan_seed_enterprise_01_0_2": true,
  "plan_seed_enterprise_01_1_0": true,
};

/**
 * Interface defining the storage contract for CuratePlan.
 * Components interact exclusively through this interface, enabling
 * seamless future transition from browser localStorage to remote database API.
 */
export interface CurriculumStorageAdapter {
  getPlans(): SavedPlan[];
  savePlans(plans: SavedPlan[]): void;

  getActivePlanId(): string | null;
  setActivePlanId(id: string | null): void;

  getProgress(): Record<string, boolean>;
  saveProgress(progress: Record<string, boolean>): void;

  getSessions(): StudySession[];
  saveSessions(sessions: StudySession[]): void;

  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): void;

  getActiveTimer(): ActiveTimer | null;
  saveActiveTimer(timer: ActiveTimer | null): void;

  getSidebarCollapsed(): boolean;
  saveSidebarCollapsed(collapsed: boolean): void;

  getOnboardingSelection(): OnboardingSelection | null;
  saveOnboardingSelection(selection: OnboardingSelection | null): void;

  getRoadmapSubview(): string;
  saveRoadmapSubview(subview: string): void;
}

class LocalStorageCurriculumAdapter implements CurriculumStorageAdapter {
  private isClient(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  getPlans(): SavedPlan[] {
    if (!this.isClient()) return [DEFAULT_SEED_PLAN];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PLANS);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedPlan[];
        return parsed.map((p) => normalizePlanToCurriculum(p));
      }
      // Initialize with default enterprise seed plan on first visit
      const normalizedSeed = normalizePlanToCurriculum(
        DEFAULT_SEED_PLAN,
        DEFAULT_COMPLETED_SEED
      );
      this.savePlans([normalizedSeed]);
      return [normalizedSeed];
    } catch {
      return [DEFAULT_SEED_PLAN];
    }
  }

  savePlans(plans: SavedPlan[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    } catch (err) {
      console.error("[Storage] Failed to save plans:", err);
    }
  }

  getActivePlanId(): string | null {
    if (!this.isClient()) return DEFAULT_SEED_PLAN.id;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (stored) return stored;
      return DEFAULT_SEED_PLAN.id;
    } catch {
      return null;
    }
  }

  setActivePlanId(id: string | null): void {
    if (!this.isClient()) return;
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch (err) {
      console.error("[Storage] Failed to set active plan id:", err);
    }
  }

  getProgress(): Record<string, boolean> {
    if (!this.isClient()) return DEFAULT_COMPLETED_SEED;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return stored ? JSON.parse(stored) : DEFAULT_COMPLETED_SEED;
    } catch {
      return DEFAULT_COMPLETED_SEED;
    }
  }

  saveProgress(progress: Record<string, boolean>): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (err) {
      console.error("[Storage] Failed to save progress:", err);
    }
  }

  getSessions(): StudySession[] {
    if (!this.isClient()) return generateSeedSessions(DEFAULT_SEED_PLAN.id);
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) return JSON.parse(stored);
      const seed = generateSeedSessions(DEFAULT_SEED_PLAN.id);
      this.saveSessions(seed);
      return seed;
    } catch {
      return generateSeedSessions(DEFAULT_SEED_PLAN.id);
    }
  }

  saveSessions(sessions: StudySession[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (err) {
      console.error("[Storage] Failed to save sessions:", err);
    }
  }

  getSettings(): UserSettings {
    if (!this.isClient()) return DEFAULT_USER_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? JSON.parse(stored) : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  }

  saveSettings(settings: UserSettings): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error("[Storage] Failed to save settings:", err);
    }
  }

  getActiveTimer(): ActiveTimer | null {
    if (!this.isClient()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as ActiveTimer;
      return { ...parsed, isRunning: false };
    } catch {
      return null;
    }
  }

  saveActiveTimer(timer: ActiveTimer | null): void {
    if (!this.isClient()) return;
    try {
      if (timer) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TIMER, JSON.stringify(timer));
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_TIMER);
      }
    } catch (err) {
      console.error("[Storage] Failed to save active timer:", err);
    }
  }

  getSidebarCollapsed(): boolean {
    if (!this.isClient()) return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  }

  saveSidebarCollapsed(collapsed: boolean): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(collapsed));
    } catch (err) {
      console.error("[Storage] Failed to save sidebar state:", err);
    }
  }

  getOnboardingSelection(): OnboardingSelection | null {
    if (!this.isClient()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ONBOARDING);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  saveOnboardingSelection(selection: OnboardingSelection | null): void {
    if (!this.isClient()) return;
    try {
      if (selection) {
        localStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(selection));
      } else {
        localStorage.removeItem(STORAGE_KEY_ONBOARDING);
      }
    } catch (err) {
      console.error("[Storage] Failed to save onboarding:", err);
    }
  }

  getRoadmapSubview(): string {
    if (!this.isClient()) return "table";
    try {
      return localStorage.getItem(STORAGE_KEY_ROADMAP_SUBVIEW) || "table";
    } catch {
      return "table";
    }
  }

  saveRoadmapSubview(subview: string): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY_ROADMAP_SUBVIEW, subview);
    } catch (err) {
      console.error("[Storage] Failed to save roadmap subview:", err);
    }
  }
}

// Singleton storage instance exported for application usage
export const curriculumStorage: CurriculumStorageAdapter =
  new LocalStorageCurriculumAdapter();
