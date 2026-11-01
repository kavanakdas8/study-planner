"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle,
  X,
  Volume2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ActiveTimer } from "@/types/study";
import { formatTimeSeconds, playChime } from "@/lib/utils";

interface FocusTimerProps {
  timer: ActiveTimer | null;
  onUpdate: React.Dispatch<React.SetStateAction<ActiveTimer | null>>;
  onCompleteTask: (taskId: string) => void;
  onClose: () => void;
}

export function FocusTimer({
  timer,
  onUpdate,
  onCompleteTask,
  onClose,
}: FocusTimerProps) {
  const [minimized, setMinimized] = useState(false);
  const timerRef = useRef<ActiveTimer | null>(timer);
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const isRunning = timer?.isRunning;

  // Reliable drift-free timer countdown based on actual timestamp deltas
  useEffect(() => {
    if (!isRunning) return;

    let lastTick = Date.now();

    const interval = setInterval(() => {
      const current = timerRef.current;
      if (!current || !current.isRunning) return;

      const now = Date.now();
      const deltaSeconds = Math.max(1, Math.round((now - lastTick) / 1000));
      lastTick = now;

      if (current.remainingSeconds <= deltaSeconds) {
        playChime("timer");
        onUpdate({
          ...current,
          remainingSeconds: 0,
          isRunning: false,
        });
      } else {
        onUpdate({
          ...current,
          remainingSeconds: current.remainingSeconds - deltaSeconds,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onUpdate]);

  if (!timer) return null;

  const toggleRunning = () => {
    playChime("click");
    onUpdate({
      ...timer,
      isRunning: !timer.isRunning,
    });
  };

  const addFiveMinutes = () => {
    playChime("click");
    onUpdate({
      ...timer,
      totalSeconds: timer.totalSeconds + 300,
      remainingSeconds: timer.remainingSeconds + 300,
    });
  };

  const resetTimer = () => {
    playChime("click");
    onUpdate({
      ...timer,
      remainingSeconds: timer.totalSeconds,
      isRunning: false,
    });
  };

  const handleMarkDone = () => {
    onCompleteTask(timer.taskId);
    onClose();
  };

  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(((timer.totalSeconds - timer.remainingSeconds) / (timer.totalSeconds || 1)) * 100)
    )
  );

  const isExpired = timer.remainingSeconds === 0;

  // Circular progress ring calculation
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <aside
      aria-label="Active Focus Timer Session"
      className="fixed bottom-5 right-5 z-50 transition-all duration-300"
    >
      <div
        className={`bg-white border rounded-2xl shadow-xl p-4 sm:p-5 text-slate-800 max-w-sm sm:max-w-md w-full transition-all ${
          isExpired
            ? "border-amber-300 ring-4 ring-amber-100"
            : timer.isRunning
            ? "border-emerald-300 ring-4 ring-emerald-50 shadow-emerald-900/10"
            : "border-slate-200"
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {timer.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isExpired ? "bg-amber-500" : timer.isRunning ? "bg-emerald-600" : "bg-slate-400"
                }`}
              />
            </span>
            <div className="truncate">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-700 block leading-tight">
                {timer.periodLabel}
              </span>
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[240px]">
                {timer.taskTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => playChime("timer")}
              title="Test chime"
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMinimized(!minimized)}
              title={minimized ? "Expand" : "Minimize"}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Timer"
              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized View */}
        {minimized ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            <span
              className={`font-mono text-base font-bold ${
                isExpired ? "text-amber-600" : "text-emerald-700"
              }`}
            >
              {formatTimeSeconds(timer.remainingSeconds)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleRunning}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer"
              >
                {timer.isRunning ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Full View with Elegant Circular Progress Indicator */
          <div className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className="relative flex items-center justify-center">
                {/* Circular Progress Ring */}
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Track Circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-slate-100"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {/* Active Emerald Progress Ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className={`${
                      isExpired
                        ? "stroke-amber-500"
                        : "stroke-emerald-600"
                    } transition-all duration-300`}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Center Countdown Typography */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isExpired ? "text-amber-600 animate-pulse" : "text-slate-900"
                    }`}
                  >
                    {formatTimeSeconds(timer.remainingSeconds)}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5">
                    {Math.round(timer.totalSeconds / 60)}m target
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicator row */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                <span className={`w-1.5 h-1.5 rounded-full ${timer.isRunning ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`} />
                {timer.isRunning ? "Focusing actively" : isExpired ? "Session completed!" : "Paused"}
              </span>
              <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {progressPercent}% done
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleRunning}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    timer.isRunning
                      ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  }`}
                >
                  {timer.isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> {isExpired ? "Restart" : "Start"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={addFiveMinutes}
                  title="Add 5 Minutes"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> 5m
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  title="Reset Timer"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Done
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
