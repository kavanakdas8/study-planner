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
  Check,
  Bell,
  ChevronRight,
} from "lucide-react";
import { SavedPlan } from "@/types/study";
import { playChime } from "@/lib/utils";

interface TopBarProps {
  activePlan: SavedPlan | null;
  onOpenMobileMenu: () => void;
  onOpenCreateModal: () => void;
  onOpenHistoryModal?: () => void;
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
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="h-15 px-4 sm:px-6 bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
          <span className="text-slate-400 font-medium hidden sm:inline">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">
              {activePlan ? activePlan.subject : "Overview"}
            </span>
          </div>
        </nav>
      </div>

      {/* Middle: Global Search / Command Bar */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <div
          onClick={() => {
            searchInputRef.current?.focus();
            onFocusSearch();
          }}
          className="relative flex items-center w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 rounded-lg px-3 py-1.5 transition cursor-text group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 mr-2 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search tasks, modules, or commands..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-normal"
          />
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions: Notification Bell + Primary Emerald CTA + Secondary Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer relative shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs text-slate-700 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Activity & Alerts</span>
                <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-900">Focus Mode Enabled</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Pomodoro intervals and chime notifications are active.
                  </p>
                </div>
                {activePlan && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-900 truncate">
                      {activePlan.subject}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {activePlan.schedule.length} learning modules · {activePlan.target_timeframe}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action CTA: Emerald Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          title={`Create Plan (${shortcutKey})`}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Create Plan</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Secondary Actions Dropdown */}
        {activePlan && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-xs text-slate-700 z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onExportMarkdown();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleCopyICS();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition cursor-pointer"
                >
                  {copiedICS ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Calendar Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export iCal (.ics)</span>
                    </>
                  )}
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onClearCompleted();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-amber-700 hover:text-red-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Checkmarks</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
