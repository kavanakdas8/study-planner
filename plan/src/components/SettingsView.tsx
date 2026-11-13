"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UserSettings, SavedPlan, DifficultyLevel } from "@/types/study";
import {
  Target,
  Calendar,
  Palette,
  Sliders,
  FolderKanban,
  Info,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Archive,
  Save,
  Volume2,
  Sparkles,
  BookOpen,
  X,
  RotateCcw,
  Loader2,
  Check,
} from "lucide-react";
import { playChime } from "@/lib/utils";

interface SettingsViewProps {
  userSettings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  activePlan: SavedPlan | null;
  onUpdateDraftPlan?: (updatedPlan: SavedPlan) => void;
  onDeletePlan: (planId: string) => void;
  savedPlans: SavedPlan[];
  hasUnsavedChanges?: boolean;
  onSaveCurriculum?: () => void;
}

type SettingsSection =
  | "learning"
  | "schedule"
  | "appearance"
  | "experience"
  | "management"
  | "about";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export function SettingsView({
  userSettings,
  onUpdateSettings,
  activePlan,
  onUpdateDraftPlan,
  onDeletePlan,
  savedPlans,
  hasUnsavedChanges = false,
  onSaveCurriculum,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("learning");

  // Local draft state for user settings (manual save architecture)
  const [draftSettings, setDraftSettings] = useState<UserSettings>(userSettings);
  const [prevUserSettings, setPrevUserSettings] = useState<UserSettings>(userSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync draftSettings during render if parent userSettings changes externally
  if (userSettings !== prevUserSettings) {
    setPrevUserSettings(userSettings);
    setDraftSettings(userSettings);
  }

  // Dirty check: has user modified any settings in this draft?
  const isSettingsDirty = useMemo(() => {
    return JSON.stringify(draftSettings) !== JSON.stringify(userSettings);
  }, [draftSettings, userSettings]);

  const [saveToast, setSaveToast] = useState<{ message: string; show: boolean }>({
    message: "",
    show: false,
  });

  // Plan Management States
  const [renamedTitle, setRenamedTitle] = useState(activePlan?.subject || "");
  const [lastPlanId, setLastPlanId] = useState(activePlan?.id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync rename input if active plan changes
  if (activePlan && activePlan.id !== lastPlanId) {
    setLastPlanId(activePlan.id);
    setRenamedTitle(activePlan.subject);
  }

  const showToast = (message: string) => {
    setSaveToast({ message, show: true });
    setTimeout(() => setSaveToast({ message: "", show: false }), 2800);
  };

  // Update working draft settings locally without persisting
  const updateDraftSetting = <T extends keyof UserSettings>(
    category: T,
    updates: Partial<UserSettings[T]>
  ) => {
    setDraftSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates,
      },
    }));
  };

  // Explicit Save Settings Handler
  const handleSaveAllSettings = useCallback(() => {
    if (isSavingSettings || !isSettingsDirty) return;
    setIsSavingSettings(true);
    playChime("complete");

    // Persist to parent application state
    onUpdateSettings(draftSettings);

    setTimeout(() => {
      setIsSavingSettings(false);
      showToast("Settings saved and reflected across the application!");
    }, 150);
  }, [isSavingSettings, isSettingsDirty, onUpdateSettings, draftSettings]);

  // Discard Working Draft Settings
  const handleDiscardSettings = () => {
    setDraftSettings(JSON.parse(JSON.stringify(userSettings)));
    playChime("click");
    showToast("Settings changes discarded.");
  };

  // Keyboard shortcut listener: Cmd/Ctrl + S in Settings saves settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        if (isSettingsDirty && !isSavingSettings) {
          e.preventDefault();
          handleSaveAllSettings();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsDirty, isSavingSettings, handleSaveAllSettings]);

  const handleTestChime = () => {
    playChime("complete");
    showToast("Harmonic audio chime played");
  };

  // Rename active curriculum (updates draft curriculum)
  const handleRenameCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renamedTitle.trim();
    if (!trimmed || !activePlan || !onUpdateDraftPlan) return;

    if (trimmed === activePlan.subject) {
      showToast("Title is already up to date");
      return;
    }

    onUpdateDraftPlan({
      ...activePlan,
      subject: trimmed,
    });
    playChime("click");
    showToast("Curriculum title updated in draft. Click Save to persist.");
  };

  // Toggle archive status (updates draft curriculum)
  const handleToggleArchive = () => {
    if (!activePlan || !onUpdateDraftPlan) return;
    const nextArchived = !activePlan.isArchived;
    onUpdateDraftPlan({
      ...activePlan,
      isArchived: nextArchived,
    });
    playChime("click");
    showToast(
      nextArchived
        ? "Curriculum marked as archived in draft"
        : "Curriculum unarchived in draft"
    );
  };

  const dayNames = [
    { label: "Mon", idx: 1 },
    { label: "Tue", idx: 2 },
    { label: "Wed", idx: 3 },
    { label: "Thu", idx: 4 },
    { label: "Fri", idx: 5 },
    { label: "Sat", idx: 6 },
    { label: "Sun", idx: 0 },
  ];

  const sections: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: "learning", label: "Learning Preferences", icon: Target },
    { id: "schedule", label: "Study Schedule", icon: Calendar },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "experience", label: "Study Experience", icon: Sliders },
    { id: "management", label: "Plan Management", icon: FolderKanban },
    { id: "about", label: "About CuratePlan", icon: Info },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Row with Explicit Manual Save Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
              Settings & Preferences
            </span>
            <span className="text-xs text-slate-400 font-medium">Control Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure learning targets, study schedules, appearance, and curriculum management. Changes apply when saved.
          </p>
        </div>

        {/* Manual Save Actions Toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          {saveToast.show && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveToast.message}</span>
            </div>
          )}

          {isSettingsDirty ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardSettings}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAllSettings}
                disabled={isSavingSettings}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
              >
                {isSavingSettings ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Settings</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>All settings saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Banner for Settings */}
      {isSettingsDirty && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fade-in text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">Unsaved Settings:</span>
              <span className="ml-1 text-amber-800">
                You have modified your preferences. Click <strong>Save Settings</strong> to apply them to your workspace.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleDiscardSettings}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 text-[11px] font-semibold border border-amber-200 transition cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveAllSettings}
              disabled={isSavingSettings}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
            >
              {isSavingSettings ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              <span>Save &amp; Apply</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings Navigation & Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sections Sidebar */}
        <div className="p-2 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                type="button"
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content Panel */}
        <div className="lg:col-span-3 p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-6">
          {/* SECTION A: LEARNING PREFERENCES */}
          {activeSection === "learning" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Learning Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Configure default study pacing, proficiency level, and weekly volume commitments.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-1">
                {/* Default Learning Level */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Default Learning Level
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Pre-selected experience level for newly synthesized curricula and modal generation.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Beginner", "Intermediate", "Advanced"] as DifficultyLevel[]).map(
                      (lvl) => {
                        const isSelected =
                          draftSettings.study.preferredDifficulty === lvl;
                        return (
                          <button
                            type="button"
                            key={lvl}
                            onClick={() =>
                              updateDraftSetting("study", {
                                preferredDifficulty: lvl,
                              })
                            }
                            className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Preferred Daily Study Time */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Preferred Daily Study Time (Hours)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      max={12}
                      value={draftSettings.study.dailyStudyGoalHours}
                      onChange={(e) =>
                        updateDraftSetting("study", {
                          dailyStudyGoalHours: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Recommended target: 1.0 – 3.0 hours/day (Reflected on Dashboard &amp; Analytics)
                    </p>
                  </div>

                  {/* Preferred Study Session Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Preferred Study Session Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      step={5}
                      min={15}
                      max={180}
                      value={draftSettings.study.defaultTaskDurationMinutes}
                      onChange={(e) =>
                        updateDraftSetting("study", {
                          defaultTaskDurationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Standard focus block length for individual tasks
                    </p>
                  </div>
                </div>

                {/* Weekly Study Goal */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-semibold">
                      Weekly Study Goal (Hours)
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {draftSettings.study.weeklyStudyTargetHours} hrs / week
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={draftSettings.study.weeklyStudyTargetHours}
                    onChange={(e) =>
                      updateDraftSetting("study", {
                        weeklyStudyTargetHours: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>2 hrs</span>
                    <span>15 hrs</span>
                    <span>30 hrs</span>
                    <span>50 hrs</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Reflected on the Analytics progress charts and weekly velocity tracker.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: STUDY SCHEDULE */}
          {activeSection === "schedule" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Study Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Plan your active study days, routine start times, break allowances, and timezone.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-1">
                {/* Select Study Days (Monday-Sunday) */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-semibold">
                    Select Study Days (Monday – Sunday)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Days on which tasks and daily study hours will be scheduled. Reflected on Today&apos;s Focus Schedule.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {dayNames.map(({ label, idx }) => {
                      const isSelected =
                        draftSettings.study.preferredStudyDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={label}
                          onClick={() => {
                            const current = draftSettings.study.preferredStudyDays;
                            const next = isSelected
                              ? current.filter((d) => d !== idx)
                              : [...current, idx].sort();
                            updateDraftSetting("study", { preferredStudyDays: next });
                          }}
                          className={`px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition cursor-pointer border ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Preferred Study Start Time */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Preferred Study Start Time
                    </label>
                    <input
                      type="time"
                      value={draftSettings.study.studyStartTime || "09:00"}
                      onChange={(e) =>
                        updateDraftSetting("study", {
                          studyStartTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-400">
                      Displayed on your daily study schedule queue.
                    </p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Timezone
                    </label>
                    <select
                      value={
                        draftSettings.general.timezone ||
                        (typeof Intl !== "undefined"
                          ? Intl.DateTimeFormat().resolvedOptions().timeZone
                          : "UTC")
                      }
                      onChange={(e) =>
                        updateDraftSetting("general", {
                          timezone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Calibrates date timestamps and greeting displays.
                    </p>
                  </div>
                </div>

                {/* Break Durations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Short Break Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={draftSettings.timer.shortBreakMinutes}
                      onChange={(e) =>
                        updateDraftSetting("timer", {
                          shortBreakMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Standard pause interval after regular focus blocks
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-semibold">
                      Long Break Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={draftSettings.timer.longBreakMinutes}
                      onChange={(e) =>
                        updateDraftSetting("timer", {
                          longBreakMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Extended rest interval after completed milestones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: APPEARANCE */}
          {activeSection === "appearance" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Appearance</h3>
                <p className="text-xs text-slate-500">
                  Customize theme modes, brand accent colors, and workspace layout density.
                </p>
              </div>

              <div className="space-y-5 text-xs pt-1">
                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-semibold">
                    Interface Theme
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Choose between Light, Dark, or automatically following your operating system.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light", label: "Light", desc: "Clean daylight UI" },
                      { id: "dark", label: "Dark", desc: "Dimmed night UI" },
                      { id: "system", label: "System", desc: "Follow OS setting" },
                    ].map((t) => {
                      const isSelected = draftSettings.appearance.theme === t.id;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => {
                            updateDraftSetting("appearance", {
                              theme: t.id as "light" | "dark" | "system",
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="font-semibold text-xs">{t.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2 pt-1">
                  <label className="block text-slate-700 font-semibold">
                    Brand Accent Colour
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Controls buttons, active pills, indicators, and primary highlights across the app.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "emerald", label: "Emerald Green", hex: "#059669" },
                      { id: "indigo", label: "Deep Indigo", hex: "#6366f1" },
                      { id: "amber", label: "Warm Amber", hex: "#d97706" },
                      { id: "rose", label: "Rose Red", hex: "#dc2626" },
                    ].map((accent) => {
                      const isSelected =
                        draftSettings.appearance.accentColor === accent.id;
                      return (
                        <button
                          type="button"
                          key={accent.id}
                          onClick={() =>
                            updateDraftSetting("appearance", {
                              accentColor: accent.id as
                                | "emerald"
                                | "indigo"
                                | "amber"
                                | "rose",
                            })
                          }
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                            isSelected
                              ? "bg-white border-slate-900 shadow-2xs font-semibold"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: accent.hex }}
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {accent.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layout Density */}
                <div className="space-y-2 pt-1">
                  <label className="block text-slate-700 font-semibold">
                    Layout Density
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Configure screen spacing and table padding.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        id: "comfortable",
                        label: "Comfortable",
                        desc: "Standard padding and relaxed spacing",
                      },
                      {
                        id: "compact",
                        label: "Compact",
                        desc: "High information density for larger monitors",
                      },
                    ].map((d) => {
                      const isSelected =
                        draftSettings.appearance.layoutDensity === d.id;
                      return (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => {
                            updateDraftSetting("appearance", {
                              layoutDensity: d.id as "comfortable" | "compact",
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="font-semibold text-xs">{d.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {d.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: STUDY EXPERIENCE */}
          {activeSection === "experience" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Study Experience
                </h3>
                <p className="text-xs text-slate-500">
                  Configure default dashboard views, task visibility, focus timers, and break reminders.
                </p>
              </div>

              <div className="space-y-4 text-xs pt-1">
                {/* Default Dashboard View */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Default Dashboard View
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Select which view opens by default when loading your curriculum roadmap.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "roadmap", label: "Roadmap (Table)" },
                      { id: "cards", label: "Cards (Kanban)" },
                      { id: "timeline", label: "Timeline" },
                      { id: "table", label: "Table Stream" },
                    ].map((v) => {
                      const isSelected =
                        draftSettings.general.defaultDashboardView === v.id;
                      return (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() =>
                            updateDraftSetting("general", {
                              defaultDashboardView: v.id as
                                | "roadmap"
                                | "cards"
                                | "timeline"
                                | "table",
                            })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show or hide completed tasks */}
                <div className="pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        Show Completed Tasks in Workspace
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        When enabled, completed tasks remain visible in schedules and table streams. When disabled, completed tasks are hidden.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSettings.study.showCompletedTasks ?? true}
                      onChange={(e) =>
                        updateDraftSetting("study", {
                          showCompletedTasks: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Default Focus Timer Duration */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-slate-700 font-semibold">
                    Default Focus Timer Duration (Minutes)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Pre-set countdown length when starting a focus session on any task.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[15, 20, 25, 30, 45, 60].map((mins) => {
                      const isSelected =
                        draftSettings.timer.pomodoroDurationMinutes === mins;
                      return (
                        <button
                          type="button"
                          key={mins}
                          onClick={() =>
                            updateDraftSetting("timer", {
                              pomodoroDurationMinutes: mins,
                            })
                          }
                          className={`py-2 rounded-lg border font-mono text-xs font-semibold text-center transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {mins}m
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Break Reminder Preference */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">
                      Break & Audio Reminders
                    </span>
                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>Test Audio Chime</span>
                    </button>
                  </div>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        Auto-Start Rest Breaks
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Automatically begin countdown break when focus block completes.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSettings.timer.autoStartBreaks}
                      onChange={(e) =>
                        updateDraftSetting("timer", {
                          autoStartBreaks: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        Audio Chime Reminder
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Play synthesized harmonic chime when focus intervals conclude.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftSettings.timer.soundNotifications}
                      onChange={(e) =>
                        updateDraftSetting("timer", {
                          soundNotifications: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION E: PLAN MANAGEMENT */}
          {activeSection === "management" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plan Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect, rename, archive, or delete your active learning curriculum. ({savedPlans.length} {savedPlans.length === 1 ? "plan" : "plans"} in Study History)
                  </p>
                </div>
                {hasUnsavedChanges && onSaveCurriculum && (
                  <button
                    type="button"
                    onClick={onSaveCurriculum}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft Curriculum</span>
                  </button>
                )}
              </div>

              {activePlan ? (
                <div className="space-y-5 text-xs">
                  {/* Active Curriculum Overview Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            Active Curriculum
                          </span>
                          {activePlan.isArchived && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Archived
                            </span>
                          )}
                          {hasUnsavedChanges && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Unsaved Edits
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {activePlan.subject}
                        </h4>
                        <p className="text-slate-500 text-[11px] line-clamp-2">
                          {activePlan.overview}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Timeframe</span>
                        <span className="font-semibold text-slate-800">
                          {activePlan.target_timeframe}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Daily Target</span>
                        <span className="font-semibold text-slate-800">
                          {activePlan.daily_hours} hrs / day
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Modules</span>
                        <span className="font-semibold text-slate-800">
                          {activePlan.modules?.length ||
                            activePlan.schedule.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total Tasks</span>
                        <span className="font-semibold text-slate-800">
                          {activePlan.schedule.reduce(
                            (acc, p) => acc + p.tasks.length,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rename Active Curriculum */}
                  <form
                    onSubmit={handleRenameCurriculum}
                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Rename Curriculum</span>
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        Update the title of your current active learning plan.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={renamedTitle}
                        onChange={(e) => setRenamedTitle(e.target.value)}
                        placeholder="Enter curriculum title..."
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                      />
                      <button
                        type="submit"
                        disabled={
                          !renamedTitle.trim() ||
                          renamedTitle.trim() === activePlan.subject
                        }
                        className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer shrink-0"
                      >
                        Update Title
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Note: Renaming updates your working draft. Click Save in the top bar to make it permanent.
                    </p>
                  </form>

                  {/* Archive / Unarchive Curriculum */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {activePlan.isArchived
                            ? "Unarchive Curriculum"
                            : "Archive Curriculum"}
                        </span>
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        {activePlan.isArchived
                          ? "Restore this curriculum to active study status."
                          : "Mark this curriculum as completed or dormant in your Study History."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition shrink-0 cursor-pointer"
                    >
                      {activePlan.isArchived ? "Unarchive Plan" : "Archive Plan"}
                    </button>
                  </div>

                  {/* Delete Curriculum Danger Zone */}
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-red-900 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete Curriculum</span>
                      </h4>
                      <p className="text-red-700 text-[11px]">
                        Permanently remove this curriculum and its task completion progression.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shrink-0 cursor-pointer shadow-2xs"
                    >
                      Delete Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
                  <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">No Active Curriculum Selected</p>
                  <p className="text-[11px] text-slate-400">
                    Select a curriculum from your Study History or build a new one to manage plan settings.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION F: ABOUT CURATEPLAN */}
          {activeSection === "about" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  About CuratePlan
                </h3>
                <p className="text-xs text-slate-500">
                  Version telemetry, mission manifesto, and architectural credits.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Version Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      CP
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        CuratePlan Enterprise
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Version 2.4.0 • Gemini AI Curriculum Orchestrator
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                    Build 2026.11
                  </span>
                </div>

                {/* About Section */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600 leading-relaxed">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Empowering Structured Lifelong Learning</span>
                  </h4>
                  <p>
                    CuratePlan is designed to bridge ambitious educational aspirations and consistent daily execution. By breaking complex domains into structured modules, adaptive milestones, and focused study blocks, CuratePlan empowers learners to master any discipline with clarity and momentum.
                  </p>
                  <p>
                    Featuring a local-first client architecture, explicit manual saving control, and real-time Pomodoro telemetry, your study progress remains private, fast, and completely under your command.
                  </p>
                </div>

                {/* Credits & Acknowledgements */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-slate-600">
                  <h4 className="font-bold text-slate-900">
                    Credits & Acknowledgements
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                      <span className="font-semibold text-slate-900 block">Google DeepMind Gemini API</span>
                      <span className="text-slate-500">AI curriculum synthesis and hierarchical topic decomposition</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                      <span className="font-semibold text-slate-900 block">Next.js & React</span>
                      <span className="text-slate-500">High-performance reactive frontend framework</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                      <span className="font-semibold text-slate-900 block">Tailwind CSS</span>
                      <span className="text-slate-500">Sleek SaaS design system tokens and typography</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
                      <span className="font-semibold text-slate-900 block">Lucide Icons</span>
                      <span className="text-slate-500">Clean, consistent, accessible iconography suite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CURRICULUM CONFIRMATION DIALOG */}
      {isDeleteModalOpen && activePlan && (
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
                <h3 className="text-base font-bold text-slate-900">
                  Delete Curriculum
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-900 font-semibold">
                  &ldquo;{activePlan.subject}&rdquo;
                </strong>
                ?
              </p>
              <p className="text-[11px] text-slate-500">
                This curriculum, along with its modules, scheduled tasks, and milestone records, will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePlan(activePlan.id);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition cursor-pointer shadow-xs"
              >
                Delete Curriculum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
