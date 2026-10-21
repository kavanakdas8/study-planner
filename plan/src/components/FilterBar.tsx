"use client";

import React from "react";
import {
  Columns,
  ListTree,
  Search,
  X,
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Layers,
} from "lucide-react";

interface FilterBarProps {
  viewMode: "timeline" | "kanban";
  onViewModeChange: (mode: "timeline" | "kanban") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resourceFilter: string;
  onResourceFilterChange: (res: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

const RESOURCE_FILTERS = [
  { id: "All", label: "All", icon: Layers },
  { id: "Exercise", label: "Exercises", icon: Terminal },
  { id: "Doc", label: "Documentation", icon: BookOpen },
  { id: "Video", label: "Videos", icon: PlayCircle },
  { id: "Reading", label: "Readings", icon: FileText },
];

export function FilterBar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  resourceFilter,
  onResourceFilterChange,
  searchInputRef,
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0D111B] border border-slate-800/80 p-2.5 rounded-xl backdrop-blur-md">
      {/* Left: View Mode Switcher */}
      <div className="flex items-center gap-1 bg-[#070A11] p-1 rounded-lg border border-slate-800/80 shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange("timeline")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "timeline"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("kanban")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "kanban"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </button>
      </div>

      {/* Middle: Resource Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {RESOURCE_FILTERS.map((res) => {
          const Icon = res.icon;
          const isSelected = resourceFilter === res.id;
          return (
            <button
              type="button"
              key={res.id}
              onClick={() => onResourceFilterChange(res.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold"
                  : "bg-[#070A11] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{res.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Search Input */}
      <div className="relative min-w-[180px] sm:min-w-[220px]">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter roadmap (/)..."
          className="w-full bg-[#070A11] border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
