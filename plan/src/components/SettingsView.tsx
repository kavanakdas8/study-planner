"use client";

import React, { useState } from "react";
import { UserSettings, SavedPlan } from "@/types/study";
import {
  Sliders,
  Target,
  Clock,
  Palette,
  Bell,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Download,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  X,
} from "lucide-react";
import { playChime } from "@/lib/utils";
import { DEFAULT_USER_SETTINGS } from "@/lib/curriculumAdapter";

interface SettingsViewProps {
  userSettings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  savedPlans: SavedPlan[];
  onClearAllData: () => void;
  onExportFullBackup: () => void;
}

type SettingsTab = "general" | "study" | "timer" | "appearance" | "notifications" | "privacy";

export function SettingsView({
  userSettings,
  onUpdateSettings,
  savedPlans,
  onClearAllData,
  onExportFullBackup,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<UserSettings>(userSettings);
  const [saveToast, setSaveToast] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const updateSetting = <T extends keyof UserSettings>(
    category: T,
    updates: Partial<UserSettings[T]>
  ) => {
    const updated = {
      ...settings,
      [category]: {
        ...settings[category],
        ...updates,
      },
    };
    setSettings(updated);
    onUpdateSettings(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleTestChime = () => {
    playChime("complete");
  };

  const handleRequestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Browser notifications are not supported in this environment.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        new Notification("CuratePlan Notifications Active", {
          body: "You will receive timely focus reminders and deadline telemetry alerts.",
        });
      }
    } catch {
      alert("Unable to request notification permissions.");
    }
  };

  const handleResetSettings = () => {
    if (!confirm("Reset all settings to default values?")) return;
    setSettings(DEFAULT_USER_SETTINGS);
    onUpdateSettings(DEFAULT_USER_SETTINGS);
    playChime("click");
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "General", icon: Sliders },
    { id: "study", label: "Study Preferences", icon: Target },
    { id: "timer", label: "Focus Timer", icon: Clock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Data", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER ROW */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Preferences & Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Application Settings
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure curriculum targets, Pomodoro timers, visual themes, notifications, and local storage retention.
          </p>
        </div>

        {saveToast && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved!</span>
          </div>
        )}
      </div>

      {/* SETTINGS WORKSPACE LAYOUT (TABS & CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* TABS SIDEBAR */}
        <div className="p-2 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SETTINGS CONTENT PANEL */}
        <div className="lg:col-span-3 p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">General Profile & Regional Settings</h3>
                <p className="text-xs text-slate-500">
                  Personalize your identity and local display formats.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Display Name</label>
                    <input
                      type="text"
                      value={settings.general.displayName}
                      onChange={(e) => updateSetting("general", { displayName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Avatar Initials</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={settings.general.avatarInitials}
                      onChange={(e) => updateSetting("general", { avatarInitials: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Default Dashboard View</label>
                    <select
                      value={settings.general.defaultDashboardView}
                      onChange={(e) =>
                        updateSetting("general", {
                          defaultDashboardView: e.target.value as "table" | "kanban" | "timeline" | "graph",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="table">Table View</option>
                      <option value="kanban">Card View</option>
                      <option value="timeline">Timeline View</option>
                      <option value="graph">Learning Graph View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Default Study Plan</label>
                    <select
                      value={settings.general.defaultPlanId}
                      onChange={(e) => updateSetting("general", { defaultPlanId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      {savedPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Language</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting("general", { language: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Français</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date Format</label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) =>
                        updateSetting("general", {
                          dateFormat: e.target.value as "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Time Format</label>
                    <select
                      value={settings.general.timeFormat}
                      onChange={(e) =>
                        updateSetting("general", {
                          timeFormat: e.target.value as "12h" | "24h",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="12h">12-Hour (AM/PM)</option>
                      <option value="24h">24-Hour (Military)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDY PREFERENCES */}
          {activeTab === "study" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Study Preferences & Daily Targets</h3>
                <p className="text-xs text-slate-500">
                  Configure study pacing, milestone allocations, and automated rescheduling parameters.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Daily Study Target (Hours)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      max={12}
                      value={settings.study.dailyStudyGoalHours}
                      onChange={(e) => updateSetting("study", { dailyStudyGoalHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Daily Available Capacity (Hours)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      max={16}
                      value={settings.study.dailyAvailableHours}
                      onChange={(e) => updateSetting("study", { dailyAvailableHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Preferred Study Days Selector */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Active Study Days Commitment
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {dayNames.map((dayName, idx) => {
                      const isSelected = settings.study.preferredStudyDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={dayName}
                          onClick={() => {
                            const newDays = isSelected
                              ? settings.study.preferredStudyDays.filter((d) => d !== idx)
                              : [...settings.study.preferredStudyDays, idx].sort();
                            updateSetting("study", { preferredStudyDays: newDays });
                          }}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition cursor-pointer border ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {dayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Default Task Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      step={5}
                      min={10}
                      max={180}
                      value={settings.study.defaultTaskDurationMinutes}
                      onChange={(e) => updateSetting("study", { defaultTaskDurationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Weekly Study Target (Hours)
                    </label>
                    <input
                      type="number"
                      step={1}
                      min={1}
                      max={60}
                      value={settings.study.weeklyStudyTargetHours}
                      onChange={(e) => updateSetting("study", { weeklyStudyTargetHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Toggles with Emerald styling */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Intelligent Adaptive Rescheduling</span>
                      <span className="text-slate-500 text-[11px]">
                        Redistribute overdue tasks when daily study milestones are missed.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.study.autoRescheduling}
                      onChange={(e) => updateSetting("study", { autoRescheduling: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Spaced Revision Scheduler</span>
                      <span className="text-slate-500 text-[11px]">
                        Queue completed topics for periodic repetition at 1, 3, 7, and 14-day intervals.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.study.revisionScheduler}
                      onChange={(e) => updateSetting("study", { revisionScheduler: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOCUS TIMER */}
          {activeTab === "timer" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Focus Timer & Pomodoro Engine</h3>
                  <p className="text-xs text-slate-500">
                    Configure timer durations and audio notifications. Fully integrated with the live countdown clock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Chime</span>
                </button>
              </div>

              <div className="space-y-4 text-xs pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Pomodoro Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={settings.timer.pomodoroDurationMinutes}
                      onChange={(e) => updateSetting("timer", { pomodoroDurationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Short Break (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={settings.timer.shortBreakMinutes}
                      onChange={(e) => updateSetting("timer", { shortBreakMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Long Break (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={settings.timer.longBreakMinutes}
                      onChange={(e) => updateSetting("timer", { longBreakMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Auto-Start Breaks</span>
                      <span className="text-slate-500 text-[11px]">
                        Automatically transition into rest mode when focus countdown finishes.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.timer.autoStartBreaks}
                      onChange={(e) => updateSetting("timer", { autoStartBreaks: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Web Audio Chime Notifications</span>
                      <span className="text-slate-500 text-[11px]">
                        Play synthesized harmonic chime when focus intervals finish.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.timer.soundNotifications}
                      onChange={(e) => updateSetting("timer", { soundNotifications: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Visual Identity & Aesthetic System</h3>
                <p className="text-xs text-slate-500">
                  CuratePlan uses a clean, modern SaaS light design system with emerald green accents.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Color Theme</label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) =>
                        updateSetting("appearance", {
                          theme: e.target.value as "dark" | "light" | "system",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="light">Light Theme (Default)</option>
                      <option value="system">Follow System</option>
                      <option value="dark">Dark Theme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Brand Accent Color</label>
                    <select
                      value={settings.appearance.accentColor}
                      onChange={(e) =>
                        updateSetting("appearance", {
                          accentColor: e.target.value as "orange" | "emerald" | "indigo" | "amber" | "rose",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="emerald">Emerald Green (#059669 - Default)</option>
                      <option value="indigo">Deep Indigo (#6366f1)</option>
                      <option value="amber">Warm Amber (#d97706)</option>
                      <option value="rose">Rose Red (#dc2626)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Dot-Grid Background Canvas</span>
                      <span className="text-slate-500 text-[11px]">
                        Render subtle geometric dot grid background behind the roadmap graph.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appearance.graphGrid}
                      onChange={(e) => updateSetting("appearance", { graphGrid: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">Smooth Micro-Interactions</span>
                      <span className="text-slate-500 text-[11px]">
                        Enable fade-in transitions and focus ring animations across cards.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => updateSetting("appearance", { animations: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Browser Notifications & Alerts</h3>
                  <p className="text-xs text-slate-500">
                    Stay accountable with automated study reminders and streak preservation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition cursor-pointer"
                >
                  Permission: {notificationStatus}
                </button>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <div>
                    <span className="font-semibold text-slate-900 block">Daily Study Target Reminders</span>
                    <span className="text-slate-500 text-[11px]">
                      Alert when study sessions have not been logged during peak hours.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyReminders}
                    onChange={(e) => updateSetting("notifications", { dailyReminders: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <div>
                    <span className="font-semibold text-slate-900 block">Milestone Completion Notifications</span>
                    <span className="text-slate-500 text-[11px]">
                      Trigger celebration banner when high-impact milestones are unlocked.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.milestoneAlerts}
                    onChange={(e) => updateSetting("notifications", { milestoneAlerts: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                  <div>
                    <span className="font-semibold text-slate-900 block">Streak Preservation Reminders</span>
                    <span className="text-slate-500 text-[11px]">
                      Remind before midnight if today&apos;s study streak is at risk of resetting.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.streakReminders}
                    onChange={(e) => updateSetting("notifications", { streakReminders: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: PRIVACY & DATA */}
          {activeTab === "privacy" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Data Privacy, Archives & Storage</h3>
                <p className="text-xs text-slate-500">
                  CuratePlan stores data locally on your device. You have 100% ownership of your data archives.
                </p>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900">Download Personal Data Archive</h4>
                    <p className="text-slate-500 text-[11px]">
                      Export complete JSON package of your curricula, task progression, sessions, and settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onExportFullBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download JSON</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900">Reset Application Preferences</h4>
                    <p className="text-slate-500 text-[11px]">
                      Restore all default study targets, Pomodoro timer rules, and layout options.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Permanent Data Wipe Danger Zone */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-red-900">Delete All Data & Wipe Local Storage</h4>
                    <p className="text-red-700 text-[11px]">
                      Permanently erase all stored curricula, completion states, and study session history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmationText("");
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DANGER CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Permanent Data Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                This action is irreversible. All your study plans, task progress, and session histories will be immediately erased.
              </p>
              <p>
                To confirm, type <strong className="font-mono text-slate-900">DELETE ALL DATA</strong> below:
              </p>

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE ALL DATA"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== "DELETE ALL DATA"}
                onClick={() => {
                  onClearAllData();
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-semibold text-white transition cursor-pointer shadow-2xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
