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
  Flame,
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
      className="fixed bottom-5 right-5 z-50 transition-all duration-300"
    >
      <div
        className={`bg-[#121316] border rounded-2xl shadow-2xl backdrop-blur-xl p-4 text-white max-w-sm sm:max-w-md w-full transition-all ${
          isExpired
            ? "border-amber-500/60 shadow-amber-950/40"
            : timer.isRunning
            ? "border-[#ea580c]/60 shadow-orange-950/50"
            : "border-[#1f2128] shadow-black/80"
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#1f2128] pb-2.5 mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {timer.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isExpired ? "bg-amber-400" : timer.isRunning ? "bg-[#f97316]" : "bg-slate-600"
                }`}
              />
            </span>
            <div className="truncate">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#f97316] block leading-tight">
                {timer.periodLabel}
              </span>
              <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[240px]">
                {timer.taskTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => playChime("timer")}
              title="Test chime"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#181a1f] transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMinimized(!minimized)}
              title={minimized ? "Expand" : "Minimize"}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#181a1f] transition cursor-pointer"
            >
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Timer"
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-[#181a1f] transition cursor-pointer"
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
                isExpired ? "text-amber-400" : "text-[#f97316]"
              }`}
            >
              {formatTimeSeconds(timer.remainingSeconds)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleRunning}
                className="px-2.5 py-1 bg-[#f97316] hover:bg-[#ea580c] text-white rounded text-xs font-semibold transition cursor-pointer"
              >
                {timer.isRunning ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold hover:bg-emerald-500/25 transition cursor-pointer"
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
                    isExpired ? "text-amber-400 animate-pulse" : "text-[#f97316]"
                  }`}
                >
                  {formatTimeSeconds(timer.remainingSeconds)}
                </span>
                <span className="text-xs text-slate-500 font-mono ml-2">
                  / {Math.round(timer.totalSeconds / 60)}m
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#f97316] bg-[#ea580c]/15 px-2 py-0.5 rounded border border-[#ea580c]/30">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0a0a0c] h-1.5 rounded-full overflow-hidden border border-[#1f2128]">
              <div
                className="bg-gradient-to-r from-[#ea580c] to-[#f97316] h-full transition-all duration-300"
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
                      ? "bg-[#ea580c]/20 hover:bg-[#ea580c]/30 text-[#f97316] border border-[#ea580c]/40"
                      : "bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm"
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
                  className="px-2.5 py-1.5 bg-[#0a0a0c] hover:bg-[#181a1f] text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 border border-[#1f2128] transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> 5m
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  title="Reset Timer"
                  className="p-1.5 bg-[#0a0a0c] hover:bg-[#181a1f] text-slate-400 hover:text-white rounded-lg border border-[#1f2128] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkDone}
                className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
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
