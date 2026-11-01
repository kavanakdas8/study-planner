"use client";

import React from "react";
import {
  Table2,
  Columns,
  ListTree,
  Search,
  X,
  Terminal,
  BookOpen,
  PlayCircle,
  FileText,
  Layers,
  BarChart3,
} from "lucide-react";

export type ViewMode = "table" | "timeline" | "kanban" | "analytics";

interface FilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resourceFilter: string;
  onResourceFilterChange: (res: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

const RESOURCE_FILTERS = [
  { id: "All", label: "All Tasks", icon: Layers },
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-xl shadow-2xs">
      {/* Left: View Mode Switcher (Table / Timeline / Card) */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange("table")}
          title="High-density Table View"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "table"
              ? "bg-white text-emerald-800 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Table2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Table</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("timeline")}
          title="Timeline Roadmap View"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "timeline"
              ? "bg-white text-emerald-800 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListTree className="w-3.5 h-3.5 text-emerald-600" />
          <span>Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("kanban")}
          title="Card View"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "kanban"
              ? "bg-white text-emerald-800 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Columns className="w-3.5 h-3.5 text-emerald-600" />
          <span>Card</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("analytics")}
          title="Analytics Overview"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            viewMode === "analytics"
              ? "bg-white text-emerald-800 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Analytics</span>
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
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{res.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Quick Search Input */}
      <div className="relative min-w-[180px] sm:min-w-[220px]">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter tasks (/)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
