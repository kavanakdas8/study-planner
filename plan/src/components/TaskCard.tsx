"use client";

import React, { useState } from "react";
import {
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  Play,
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
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Exercise",
      };
    }
    if (lower.includes("doc") || lower.includes("api") || lower.includes("reference")) {
      return {
        icon: <BookOpen className="w-3 h-3" />,
        className: "bg-sky-50 text-sky-700 border-sky-200",
        label: "Documentation",
      };
    }
    if (lower.includes("video") || lower.includes("tutorial") || lower.includes("watch")) {
      return {
        icon: <PlayCircle className="w-3 h-3" />,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Video",
      };
    }
    if (lower.includes("read") || lower.includes("book") || lower.includes("article")) {
      return {
        icon: <FileText className="w-3 h-3" />,
        className: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Reading",
      };
    }
    return {
      icon: <Layers className="w-3 h-3" />,
      className: "bg-slate-100 text-slate-700 border-slate-200",
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
      className={`group relative rounded-xl border transition-all duration-150 ${
        isCompleted
          ? "bg-slate-50/70 border-slate-200/80 text-slate-400 opacity-80"
          : "bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-300 shadow-2xs"
      }`}
    >
      <div className="p-3 sm:p-3.5 flex flex-col gap-2">
        <div className="flex items-start gap-3 justify-between">
          {/* Custom Emerald Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            aria-label={`Mark "${task.title}" as ${isCompleted ? "incomplete" : "complete"}`}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isCompleted
                ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                : "border-slate-300 bg-white hover:border-emerald-500 text-transparent"
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>

          {/* Task Title & Details */}
          <div className="flex-1 min-w-0">
            <span
              onClick={() => setExpanded(!expanded)}
              className={`text-xs sm:text-sm font-semibold cursor-pointer transition-all block leading-snug ${
                isCompleted
                  ? "line-through text-slate-400"
                  : "text-slate-900 hover:text-emerald-700"
              }`}
            >
              {task.title}
            </span>

            {/* Metadata Badges Row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {/* Resource Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badge.className}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {/* Monospace Duration */}
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3 text-slate-400" />
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
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-700 font-semibold"
                    : "bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700"
                }`}
                title="Start Pomodoro Focus Session for this task"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Focus</span>
              </button>
            </div>
          </div>

          {/* Expand Instructions Chevron */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
            title={expanded ? "Hide instructions" : "Show instructions"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Detailed Instructions Accordion */}
        {expanded && (
          <div className="mt-1 pl-7 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed animate-fade-in">
            <span className="font-semibold text-emerald-800 text-[11px] block mb-1">
              Instructions & Practice Objective
            </span>
            <p className="text-slate-600 whitespace-pre-line text-xs">
              {task.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
