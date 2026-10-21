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
  Timer as TimerIcon,
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
  timerRef.current = timer;

  // Reliable drift-free timer countdown based on actual timestamp deltas
  useEffect(() => {
    if (!timer || !timer.isRunning) return;

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
  }, [timer?.isRunning, onUpdate]);

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

  return (
    <aside
      aria-label="Active Focus Timer Session"
      className="fixed bottom-4 right-4 z-50 transition-all duration-300"
    >
      <div
        className={`bg-[#0D111B] border rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 sm:p-4 text-slate-100 max-w-sm sm:max-w-md w-full transition-all ${
          isExpired
            ? "border-amber-500/60 shadow-amber-950/40"
            : timer.isRunning
            ? "border-indigo-500/50 shadow-indigo-950/50"
            : "border-slate-800 shadow-slate-950/50"
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2 w-2">
              {timer.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isExpired ? "bg-amber-400" : timer.isRunning ? "bg-amber-500" : "bg-slate-600"
                }`}
              />
            </span>
            <div className="truncate">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400 block leading-tight">
                {timer.periodLabel}
              </span>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[240px]">
                {timer.taskTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => playChime("timer")}
              title="Test chime"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMinimized(!minimized)}
              title={minimized ? "Expand" : "Minimize"}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Timer"
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized Compact View */}
        {minimized ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            <span
              className={`font-mono text-base font-bold ${
                isExpired ? "text-amber-400" : "text-white"
              }`}
            >
              {formatTimeSeconds(timer.remainingSeconds)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleRunning}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold transition cursor-pointer"
              >
                {timer.isRunning ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold hover:bg-emerald-500/30 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Full View */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`font-mono text-3xl font-extrabold tracking-tight ${
                    isExpired ? "text-amber-400 animate-pulse" : "text-white"
                  }`}
                >
                  {formatTimeSeconds(timer.remainingSeconds)}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  / {Math.round(timer.totalSeconds / 60)}m
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#070A11] h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleRunning}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    timer.isRunning
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                  }`}
                >
                  {timer.isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> {isExpired ? "Restart" : "Resume"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={addFiveMinutes}
                  title="Add 5 Minutes"
                  className="px-2.5 py-1.5 bg-[#070A11] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-800 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> 5m
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  title="Reset timer"
                  className="p-1.5 bg-[#070A11] hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
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
