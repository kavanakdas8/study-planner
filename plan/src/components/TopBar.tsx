"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Plus,
  Search,
  Download,
  Share2,
  RotateCcw,
  MoreVertical,
  ChevronRight,
  BookOpen,
  Check,
  Command,
} from "lucide-react";
import { SavedPlan } from "@/types/study";
import { playChime } from "@/lib/utils";

interface TopBarProps {
  activePlan: SavedPlan | null;
  onOpenMobileMenu: () => void;
  onOpenCreateModal: () => void;
  onOpenHistoryModal: () => void;
  onExportMarkdown: () => void;
  onExportICS: () => void;
  onClearCompleted: () => void;
  onFocusSearch: () => void;
}

export function TopBar({
  activePlan,
  onOpenMobileMenu,
  onOpenCreateModal,
  onOpenHistoryModal,
  onExportMarkdown,
  onExportICS,
  onClearCompleted,
  onFocusSearch,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedICS, setCopiedICS] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyICS = () => {
    playChime("click");
    onExportICS();
    setCopiedICS(true);
    setTimeout(() => setCopiedICS(false), 2000);
  };

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#070A11]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
          <span className="hidden sm:inline font-medium hover:text-slate-200 transition">
            Workspace
          </span>
          <ChevronRight className="hidden sm:inline w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-white font-semibold truncate flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              {activePlan ? activePlan.subject : "Overview"}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Quick Search Pill, New Plan & Actions Dropdown */}
      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut Pill */}
        {activePlan && (
          <button
            type="button"
            onClick={onFocusSearch}
            title="Search tasks (/)"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
          >
            <Search className="w-3 h-3 text-slate-500" />
            <span>Search</span>
            <kbd className="px-1 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-500">
              /
            </kbd>
          </button>
        )}

        {/* New Plan Primary CTA */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          title={`Create Study Plan (${shortcutKey})`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Plan</span>
          <kbd className="hidden md:inline px-1 py-0.2 text-[10px] font-mono bg-indigo-700 rounded text-indigo-200">
            {shortcutKey}
          </kbd>
        </button>

        {/* Secondary Actions Dropdown */}
        {activePlan && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 border border-slate-800/80 transition cursor-pointer"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#0D111B] border border-slate-800 rounded-xl shadow-2xl py-1.5 text-xs text-slate-300 z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onExportMarkdown();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleCopyICS();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {copiedICS ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Exported Calendar</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Export iCal (.ics)</span>
                    </>
                  )}
                </button>

                <div className="h-px bg-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onClearCompleted();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Progress</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
