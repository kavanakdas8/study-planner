"use client";

import React, { useState } from "react";
import {
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Clock,
  Timer,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
} from "lucide-react";
import { Task, ResourceType } from "@/types/study";
import { playChime } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  taskId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onStartFocus: () => void;
  isTimerActive?: boolean;
}

export function TaskCard({
  task,
  isCompleted,
  onToggleComplete,
  onStartFocus,
  isTimerActive,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getResourceBadge = (type: ResourceType) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("exercise") || lower.includes("practice") || lower.includes("code")) {
      return {
        icon: <Terminal className="w-3 h-3" />,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
        label: "Exercise",
      };
    }
    if (lower.includes("doc") || lower.includes("api") || lower.includes("reference")) {
      return {
        icon: <BookOpen className="w-3 h-3" />,
        className: "bg-sky-500/10 text-sky-400 border-sky-500/25",
        label: "Docs",
      };
    }
    if (lower.includes("video") || lower.includes("tutorial") || lower.includes("watch")) {
      return {
        icon: <PlayCircle className="w-3 h-3" />,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/25",
        label: "Video",
      };
    }
    if (lower.includes("read") || lower.includes("book") || lower.includes("article")) {
      return {
        icon: <FileText className="w-3 h-3" />,
        className: "bg-purple-500/10 text-purple-400 border-purple-500/25",
        label: "Reading",
      };
    }
    return {
      icon: <Layers className="w-3 h-3" />,
      className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
      label: type || "General",
    };
  };

  const badge = getResourceBadge(task.resource_type);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      playChime("complete");
    } else {
      playChime("click");
    }
    onToggleComplete();
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        isCompleted
          ? "bg-[#070A11]/60 border-slate-800/40 text-slate-500 opacity-70"
          : "bg-[#0D111B] hover:bg-[#111827] border-slate-800/80 hover:border-slate-700/80 shadow-sm"
      }`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col gap-2">
        <div className="flex items-start gap-3 justify-between">
          {/* Custom Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            aria-label={`Mark "${task.title}" as ${isCompleted ? "incomplete" : "complete"}`}
            className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isCompleted
                ? "bg-emerald-500 border-emerald-500 text-slate-950"
                : "border-slate-700 bg-[#070A11] hover:border-indigo-400 text-transparent"
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>

          {/* Task Title & Details */}
          <div className="flex-1 min-w-0">
            <span
              onClick={() => setExpanded(!expanded)}
              className={`text-xs sm:text-sm font-medium cursor-pointer transition-all block leading-snug ${
                isCompleted
                  ? "line-through text-slate-500"
                  : "text-slate-100 hover:text-indigo-300"
              }`}
            >
              {task.title}
            </span>

            {/* Metadata Badges Row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {/* Resource Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${badge.className}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {/* Monospace Duration */}
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-[#070A11] border border-slate-800 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{task.duration_minutes}m</span>
              </span>

              {/* Focus Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus();
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                  isTimerActive
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse"
                    : "bg-[#070A11] hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300"
                }`}
                title="Start Pomodoro Focus Session for this task"
              >
                <Timer className="w-3 h-3 text-amber-400" />
                <span>{isTimerActive ? "Focusing" : "Focus"}</span>
              </button>
            </div>
          </div>

          {/* Expand Instructions Chevron */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition cursor-pointer"
            title={expanded ? "Hide instructions" : "Show instructions"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Detailed Instructions Accordion */}
        {expanded && (
          <div className="mt-1 pl-7 text-xs text-slate-300 bg-[#070A11]/70 border border-slate-800/80 rounded-lg p-3 leading-relaxed animate-fade-in">
            <span className="font-semibold text-indigo-400 text-[11px] block mb-1">
              Instructions &amp; Practice Goals
            </span>
            <p className="text-slate-300 whitespace-pre-line text-xs">
              {task.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
