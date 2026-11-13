"use client";

import React, { useState, useMemo } from "react";
import { SavedPlan, StudySession, UserSettings } from "@/types/study";
import {
  PieChart,
} from "lucide-react";

interface AnalyticsViewProps {
  sessions: StudySession[];
  plan: SavedPlan | null;
  completedTasksMap: Record<string, boolean>;
  userSettings: UserSettings;
  onStartFocus?: () => void;
}

type TimeRange = "7d" | "30d" | "90d" | "all" | "custom";
type WeeklyTab = "thisWeek" | "lastWeek";

export function AnalyticsView({
  sessions,
  plan,
  userSettings,
}: AnalyticsViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [weeklyTab, setWeeklyTab] = useState<WeeklyTab>("thisWeek");
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Active date range cutoff calculation
  const rangeCutoff = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    if (timeRange === "7d") return now - 7 * dayMs;
    if (timeRange === "30d") return now - 30 * dayMs;
    if (timeRange === "90d") return now - 90 * dayMs;
    if (timeRange === "custom" && customStart) {
      return new Date(customStart).getTime();
    }
    return 0; // "all"
  }, [timeRange, customStart]);

  const rangeEndCutoff = useMemo(() => {
    if (timeRange === "custom" && customEnd) {
      const d = new Date(customEnd);
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    }
    return Date.now();
  }, [timeRange, customEnd]);

  // Filter sessions strictly to the active course so other courses' study hours never mix
  const planSessions = useMemo(() => {
    if (!plan) return [];
    return sessions.filter(
      (s) => s.planId === plan.id || (plan.subject && s.subject === plan.subject)
    );
  }, [sessions, plan]);

  // Filtered sessions in active window for this course
  const filteredSessions = useMemo(() => {
    return planSessions.filter(
      (s) => s.completedAt >= rangeCutoff && s.completedAt <= rangeEndCutoff
    );
  }, [planSessions, rangeCutoff, rangeEndCutoff]);

  // 1. LEARNING OVERVIEW METRICS
  const overview = useMemo(() => {
    const totalMinutes = filteredSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const totalSessions = filteredSessions.length;
    const avgSessionMinutes =
      totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    const activeDaysSet = new Set<string>();
    filteredSessions.forEach((s) => {
      const dateStr = new Date(s.completedAt).toISOString().split("T")[0];
      activeDaysSet.add(dateStr);
    });

    const activeDaysCount = activeDaysSet.size;
    const avgDailyMinutes =
      activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;
    const avgDailyHours = Number((avgDailyMinutes / 60).toFixed(1));

    return {
      totalHours,
      totalMinutes,
      totalSessions,
      avgSessionMinutes,
      activeDaysCount,
      avgDailyHours,
    };
  }, [filteredSessions]);

  // 2. STUDY TIME DISTRIBUTION (DONUT CHART)
  const distributionColors = useMemo(
    () => [
      "#059669", // emerald-600
      "#10b981", // emerald-500
      "#34d399", // emerald-400
      "#0d9488", // teal-600
      "#0284c7", // sky-600
      "#6366f1", // indigo-500
      "#8b5cf6", // purple-500
      "#f59e0b", // amber-500
    ],
    []
  );

  const subjectDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const key = s.periodLabel || s.subject || plan?.subject || "General Study";
      map.set(key, (map.get(key) || 0) + (s.durationMinutes || 0));
    });

    const totalMins = Array.from(map.values()).reduce((a, b) => a + b, 0);
    if (totalMins === 0) return [];

    let cumulativePct = 0;
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);

    return entries.map(([label, mins], idx) => {
      const pct = Math.round((mins / totalMins) * 100);
      const startPct = cumulativePct;
      cumulativePct += pct;
      return {
        label,
        minutes: mins,
        hours: Number((mins / 60).toFixed(1)),
        percentage: pct,
        color: distributionColors[idx % distributionColors.length],
        startPct,
      };
    });
  }, [filteredSessions, plan, distributionColors]);

  // 3. WEEKLY STUDY TRENDS (THIS WEEK VS LAST WEEK)
  const weeklyTrends = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    // ISO week: Monday is day 0
    const currentIsoDay = (now.getDay() + 6) % 7;

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - currentIsoDay);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekDays = dayNames.map((name, i) => {
      const d = new Date(startOfThisWeek);
      d.setDate(startOfThisWeek.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000 - 1;
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayMins = planSessions
        .filter((s) => s.completedAt >= dayStart && s.completedAt <= dayEnd)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      return {
        day: name,
        dateStr,
        minutes: dayMins,
        hours: Number((dayMins / 60).toFixed(1)),
      };
    });

    const lastWeekDays = dayNames.map((name, i) => {
      const d = new Date(startOfLastWeek);
      d.setDate(startOfLastWeek.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000 - 1;
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayMins = planSessions
        .filter((s) => s.completedAt >= dayStart && s.completedAt <= dayEnd)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      return {
        day: name,
        dateStr,
        minutes: dayMins,
        hours: Number((dayMins / 60).toFixed(1)),
      };
    });

    const thisWeekTotalMinutes = thisWeekDays.reduce((a, b) => a + b.minutes, 0);
    const thisWeekTotalHours = Number((thisWeekTotalMinutes / 60).toFixed(1));
    const thisWeekDailyAvg = Number((thisWeekTotalMinutes / 7 / 60).toFixed(1));

    const lastWeekTotalMinutes = lastWeekDays.reduce((a, b) => a + b.minutes, 0);
    const lastWeekTotalHours = Number((lastWeekTotalMinutes / 60).toFixed(1));
    const lastWeekDailyAvg = Number((lastWeekTotalMinutes / 7 / 60).toFixed(1));

    return {
      thisWeek: {
        days: thisWeekDays,
        totalHours: thisWeekTotalHours,
        totalMinutes: thisWeekTotalMinutes,
        dailyAvgHours: thisWeekDailyAvg,
      },
      lastWeek: {
        days: lastWeekDays,
        totalHours: lastWeekTotalHours,
        totalMinutes: lastWeekTotalMinutes,
        dailyAvgHours: lastWeekDailyAvg,
      },
    };
  }, [planSessions]);

  const activeWeeklyData =
    weeklyTab === "thisWeek" ? weeklyTrends.thisWeek : weeklyTrends.lastWeek;

  const maxWeeklyHour = useMemo(() => {
    const maxH = Math.max(
      ...activeWeeklyData.days.map((d) => d.hours),
      2
    );
    return Math.ceil(maxH);
  }, [activeWeeklyData]);

  // 4. PLANNED VS ACTUAL STUDY TIME
  const plannedVsActual = useMemo(() => {
    // Scheduled curriculum hours
    let scheduledMinutes = 0;
    if (plan?.schedule) {
      plan.schedule.forEach((period) => {
        period.tasks.forEach((t) => {
          scheduledMinutes += t.duration_minutes || 0;
        });
      });
    }

    if (scheduledMinutes === 0 && plan?.modules) {
      plan.modules.forEach((m) => {
        scheduledMinutes += (m.estimated_hours || 0) * 60;
      });
    }

    // Default fallback if no curriculum tasks: weekly target hours
    if (scheduledMinutes === 0 && userSettings?.study?.weeklyStudyTargetHours) {
      scheduledMinutes = userSettings.study.weeklyStudyTargetHours * 60;
    }

    const plannedHours = Number((scheduledMinutes / 60).toFixed(1));
    const actualMinutes = filteredSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );
    const actualHours = Number((actualMinutes / 60).toFixed(1));

    const diffMinutes = actualMinutes - scheduledMinutes;
    const diffHours = Number((Math.abs(diffMinutes) / 60).toFixed(1));
    const isAheadOrMet = diffMinutes >= 0;
    const pctAchieved =
      scheduledMinutes > 0
        ? Math.min(100, Math.round((actualMinutes / scheduledMinutes) * 100))
        : 100;

    // Module-by-module planned vs actual breakdown if available
    const moduleBreakdown = (plan?.modules || []).map((m) => {
      const modPlannedHours = m.estimated_hours || 0;
      const modSessions = filteredSessions.filter(
        (s) =>
          s.periodLabel === m.title ||
          s.subject === m.title ||
          s.periodLabel?.toLowerCase().includes(m.title.toLowerCase())
      );
      const modActualMinutes = modSessions.reduce(
        (sum, s) => sum + (s.durationMinutes || 0),
        0
      );
      const modActualHours = Number((modActualMinutes / 60).toFixed(1));
      return {
        title: m.title,
        plannedHours: modPlannedHours,
        actualHours: modActualHours,
        pct:
          modPlannedHours > 0
            ? Math.min(100, Math.round((modActualHours / modPlannedHours) * 100))
            : 100,
      };
    });

    return {
      plannedHours,
      actualHours,
      diffHours,
      isAheadOrMet,
      pctAchieved,
      moduleBreakdown,
    };
  }, [plan, filteredSessions, userSettings]);

  // 4. SMART STUDY INSIGHTS (RULE-BASED DERIVED FROM ACTUAL DATA)
  const smartInsights = useMemo(() => {
    const insights: Array<{
      title: string;
      category: string;
      description: string;
      hours?: string;
    }> = [];

    // 1. Most studied subject
    if (subjectDistribution.length > 0) {
      const topSubject = subjectDistribution[0];
      insights.push({
        title: "Primary Focus Area",
        category: "Distribution",
        description: `${topSubject.label} is your most studied subject, accounting for ${topSubject.hours} hours (${topSubject.percentage}% of all recorded focus time).`,
      });
    }

    // 2. Subject receiving least attention
    if (subjectDistribution.length > 1) {
      const leastSubject = subjectDistribution[subjectDistribution.length - 1];
      insights.push({
        title: "Subject Needs Attention",
        category: "Curriculum Balance",
        description: `${leastSubject.label} has logged only ${leastSubject.hours} hours (${leastSubject.percentage}%). Consider allocating your next focus sessions here to maintain even progress.`,
      });
    }

    // 3. Most productive day
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayLabels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    planSessions.forEach((s) => {
      const dayIdx = new Date(s.completedAt).getDay();
      dayTotals[dayIdx] += s.durationMinutes || 0;
    });

    let maxDayIdx = 1; // Default Monday
    let maxDayMins = 0;
    dayTotals.forEach((mins, idx) => {
      if (mins > maxDayMins) {
        maxDayMins = mins;
        maxDayIdx = idx;
      }
    });

    if (maxDayMins > 0) {
      const peakDayName = dayLabels[maxDayIdx];
      const peakDayHours = Number((maxDayMins / 60).toFixed(1));
      insights.push({
        title: "Peak Productivity Day",
        category: "Rhythm",
        hours: `${peakDayHours} hrs`,
        description: `${peakDayName}s are your highest-output days, logging a total of ${peakDayHours} hours.`,
      });
    } else {
      insights.push({
        title: "Study Rhythm",
        category: "Rhythm",
        hours: "0 hrs",
        description: "Start a focus session to identify your peak productivity days and build momentum.",
      });
    }

    // 4. Average focus-session length
    const avgMins = overview.avgSessionMinutes;
    let rhythmText = "";
    if (avgMins >= 45) {
      rhythmText = `Your average session duration of ${avgMins} minutes reflects sustained deep work capability, comfortably exceeding standard Pomodoro blocks.`;
    } else if (avgMins >= 25) {
      rhythmText = `Your average session duration of ${avgMins} minutes aligns closely with the standard 25-minute Pomodoro focus interval.`;
    } else if (avgMins > 0) {
      rhythmText = `Your average session duration is ${avgMins} minutes. Consider aiming for uninterrupted 25-minute focus intervals for deeper retention.`;
    } else {
      rhythmText =
        "Start a focus timer to measure your average session duration and build consistent learning momentum.";
    }

    insights.push({
      title: "Focus Session Rhythm",
      category: "Endurance",
      description: rhythmText,
    });

    // 5. Difference between planned and actual study time
    const { plannedHours, actualHours, diffHours, isAheadOrMet, pctAchieved } =
      plannedVsActual;
    let pacingText = "";
    if (plannedHours > 0) {
      if (isAheadOrMet) {
        pacingText = `You have completed ${pctAchieved}% of your planned curriculum target, recording ${actualHours} hours against a ${plannedHours}h target (+${diffHours}h ahead).`;
      } else {
        pacingText = `You have logged ${actualHours} hours out of ${plannedHours} planned hours (${pctAchieved}% achieved). You need ${diffHours} more hours to reach the target.`;
      }
    } else {
      pacingText = `You have logged ${actualHours} total study hours. Set up a curriculum schedule to track planned versus actual progress.`;
    }

    insights.push({
      title: "Planned vs Actual Pace",
      category: "Milestone Pacing",
      description: pacingText,
    });

    return insights;
  }, [subjectDistribution, planSessions, overview.avgSessionMinutes, plannedVsActual]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER & DATE RANGE FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Analytics &amp; Progress
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Detailed performance telemetry, study time distribution, and curriculum pacing insights.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg text-xs">
            {(["7d", "30d", "90d", "all"] as TimeRange[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  timeRange === r
                    ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "7d"
                  ? "7 Days"
                  : r === "30d"
                  ? "30 Days"
                  : r === "90d"
                  ? "90 Days"
                  : "All Time"}
              </button>
            ))}
          </div>

          {timeRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* FEATURE 1: LEARNING OVERVIEW (4 KEY METRIC CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Study Time */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Study Time
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {overview.totalHours}{" "}
              <span className="text-sm font-normal text-slate-400">hrs</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {overview.totalMinutes.toLocaleString()} minutes recorded
            </p>
          </div>
        </div>

        {/* Card 2: Average Study Duration per Session */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avg Session Duration
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {overview.avgSessionMinutes}{" "}
              <span className="text-sm font-normal text-slate-400">mins</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Per recorded focus session
            </p>
          </div>
        </div>

        {/* Card 3: Total Learning Sessions */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Sessions
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {overview.totalSessions}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed study sessions
            </p>
          </div>
        </div>

        {/* Card 4: Average Daily Study Time */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avg Daily Study Time
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {overview.avgDailyHours}{" "}
              <span className="text-sm font-normal text-slate-400">hrs</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Across {overview.activeDaysCount} active days
            </p>
          </div>
        </div>
      </div>

      {/* ROW 2: STUDY TIME DISTRIBUTION & WEEKLY STUDY TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FEATURE 2: STUDY TIME DISTRIBUTION (CLEAN DONUT CHART) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Study Time Distribution
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {subjectDistribution.length} subjects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Time spent across courses and modules in the selected window.
            </p>
          </div>

          {subjectDistribution.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
              <PieChart className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">
                No session data recorded
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Log study time using the focus timer to view subject-by-subject distribution.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              {/* Donut Chart SVG */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {subjectDistribution.map((item, idx) => {
                    const circumference = 2 * Math.PI * 38; // ~238.76
                    const strokeDash = (item.percentage / 100) * circumference;
                    const strokeOffset = -((item.startPct / 100) * circumference);
                    const isHovered = hoveredDonutIndex === idx;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={isHovered ? 16 : 14}
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutIndex(idx)}
                        onMouseLeave={() => setHoveredDonutIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  {hoveredDonutIndex !== null && subjectDistribution[hoveredDonutIndex] ? (
                    <>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[90px]">
                        {subjectDistribution[hoveredDonutIndex].percentage}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {subjectDistribution[hoveredDonutIndex].hours}h
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {overview.totalHours}h
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Total Focus
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Subject Breakdown Legend */}
              <div className="flex-1 space-y-2.5 w-full">
                {subjectDistribution.map((item, idx) => {
                  const isHovered = hoveredDonutIndex === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDonutIndex(idx)}
                      onMouseLeave={() => setHoveredDonutIndex(null)}
                      className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isHovered ? "bg-slate-100/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={`truncate ${
                            isHovered
                              ? "font-semibold text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        <span className="text-slate-400">{item.hours}h</span>
                        <span className="text-slate-900 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FEATURE 3: WEEKLY STUDY TRENDS (BAR CHART) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Weekly Study Trends
              </h3>

              {/* Switcher: This Week vs Last Week */}
              <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setWeeklyTab("thisWeek")}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    weeklyTab === "thisWeek"
                      ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyTab("lastWeek")}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    weeklyTab === "lastWeek"
                      ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Last Week
                </button>
              </div>
            </div>

            {/* Weekly Total & Daily Average */}
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span>
                Total:{" "}
                <strong className="text-slate-900 font-mono">
                  {activeWeeklyData.totalHours} hrs
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Daily Avg:{" "}
                <strong className="text-slate-900 font-mono">
                  {activeWeeklyData.dailyAvgHours} hrs/day
                </strong>
              </span>
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 pb-2">
            {activeWeeklyData.days.map((d, idx) => {
              const barHeightPct =
                maxWeeklyHour > 0
                  ? Math.min(100, Math.round((d.hours / maxWeeklyHour) * 100))
                  : 0;
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip / Hours Value */}
                  <div
                    className={`text-[10px] font-mono transition-opacity ${
                      isHovered
                        ? "text-emerald-700 font-bold opacity-100"
                        : d.hours > 0
                        ? "text-slate-500 opacity-80"
                        : "opacity-0"
                    }`}
                  >
                    {d.hours > 0 ? `${d.hours}h` : "0h"}
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full flex items-end justify-center h-28">
                    <div
                      className={`w-full max-w-[32px] rounded-t transition-all duration-300 ${
                        d.hours > 0
                          ? isHovered
                            ? "bg-emerald-500 shadow-xs"
                            : "bg-emerald-600"
                          : "bg-slate-100"
                      }`}
                      style={{ height: `${Math.max(6, barHeightPct)}%` }}
                      title={`${d.day} (${d.dateStr}): ${d.hours} hrs (${d.minutes} mins)`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-xs font-mono transition-colors ${
                      isHovered
                        ? "text-emerald-700 font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bar Chart Footer Date Scope */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>
              {activeWeeklyData.days[0]?.dateStr} — {activeWeeklyData.days[6]?.dateStr}
            </span>
            <span>
              Target: {userSettings?.study?.weeklyStudyTargetHours || 20} hrs/wk
            </span>
          </div>
        </div>
      </div>



      {/* FEATURE 4: SMART STUDY INSIGHTS (RULE-BASED DYNAMIC OBSERVATIONS) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Smart Study Insights
          </h3>
          <p className="text-xs text-slate-500">
            Rule-based telemetry observations computed directly from your study sessions and curriculum goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {smartInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:bg-slate-50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    {insight.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {insight.title}
                  </h4>
                  {insight.hours && (
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {insight.hours}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
