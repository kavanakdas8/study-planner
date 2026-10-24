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
  BookOpen,
  Check,
  Bell,
  Sparkles,
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
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
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
  searchQuery = "",
  onSearchChange,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [copiedICS, setCopiedICS] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
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
  const shortcutKey = isMac ? "⌘ K" : "Ctrl K";

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0a0a0c]/90 border-b border-[#1f2128] backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#121316] border border-[#1f2128] transition cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Active Plan / Title */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-white font-semibold truncate flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span className="truncate">
              {activePlan ? activePlan.subject : "Overview"}
            </span>
          </span>
        </div>
      </div>

      {/* Middle: Global Search / Command Bar (Rounded Pill Input) */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <div
          onClick={() => {
            searchInputRef.current?.focus();
            onFocusSearch();
          }}
          className="relative flex items-center w-full bg-[#121316] hover:bg-[#181a1f] border border-[#1f2128] focus-within:border-[#ea580c]/50 rounded-full px-3.5 py-1.5 transition cursor-text group"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 mr-2 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search curriculum, tasks, or commands..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#0a0a0c] border border-[#1f2128] rounded text-[#9ca3af] tracking-tight">
              {shortcutKey}
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions: Notification Bell + Primary Orange CTA + Secondary Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            className="p-2 rounded-lg border border-[#1f2128] bg-[#121316] text-slate-400 hover:text-white hover:border-[#2a2d36] transition cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f97316] ring-2 ring-[#0a0a0c]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#121316] border border-[#1f2128] rounded-xl shadow-2xl p-3 text-xs text-slate-300 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f2128]">
                <span className="font-semibold text-white">System Feed</span>
                <span className="text-[10px] font-mono text-[#f97316] bg-[#ea580c]/15 px-1.5 py-0.5 rounded">
                  Live
                </span>
              </div>
              <div className="py-2.5 space-y-2">
                <div className="p-2 rounded-lg bg-[#0a0a0c] border border-[#1f2128]">
                  <p className="text-[11px] font-medium text-white">Sprint Velocity Active</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Micro-sprints configured with Pomodoro chime engine.
                  </p>
                </div>
                {activePlan && (
                  <div className="p-2 rounded-lg bg-[#0a0a0c] border border-[#1f2128]">
                    <p className="text-[11px] font-medium text-white">{activePlan.subject}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {activePlan.schedule.length} phases scheduled · {activePlan.target_timeframe}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action CTA: Solid Vibrant Industrial Orange Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          title={`Generate Plan (${shortcutKey})`}
          className="bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-orange-950/40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Generate Plan</span>
          <span className="sm:hidden">Plan</span>
        </button>

        {/* Secondary Actions Dropdown */}
        {activePlan && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-[#121316] border border-[#1f2128] hover:border-[#2a2d36] transition cursor-pointer"
              title="More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#121316] border border-[#1f2128] rounded-xl shadow-2xl py-1.5 text-xs text-slate-300 z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onExportMarkdown();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#181a1f] flex items-center gap-2 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#f97316]" />
                  <span>Export Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleCopyICS();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#181a1f] flex items-center gap-2 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {copiedICS ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Calendar Exported</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Export iCal Calendar (.ics)</span>
                    </>
                  )}
                </button>

                <div className="h-px bg-[#1f2128] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onClearCompleted();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#181a1f] flex items-center gap-2 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Sprint Progress</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
