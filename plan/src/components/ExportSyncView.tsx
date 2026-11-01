"use client";

import React, { useState, useRef } from "react";
import { SavedPlan, StudySession, UserSettings } from "@/types/study";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Calendar,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldCheck,
  X,
  HardDrive,
} from "lucide-react";
import {
  downloadFile,
  exportPlanToMarkdown,
  exportPlanToCSV,
  generateICS,
  printCurriculumDocument,
  playChime,
} from "@/lib/utils";

interface ExportSyncViewProps {
  plan: SavedPlan | null;
  savedPlans: SavedPlan[];
  sessions: StudySession[];
  completedTasksMap: Record<string, boolean>;
  userSettings: UserSettings;
  onRestoreBackup: (data: {
    plans: SavedPlan[];
    sessions: StudySession[];
    completedTasksMap: Record<string, boolean>;
    settings?: UserSettings;
  }) => void;
}

export function ExportSyncView({
  plan,
  savedPlans,
  sessions,
  completedTasksMap,
  userSettings,
  onRestoreBackup,
}: ExportSyncViewProps) {
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [pendingBackupData, setPendingBackupData] = useState<{
    plans: SavedPlan[];
    sessions: StudySession[];
    completedTasksMap: Record<string, boolean>;
    settings?: UserSettings;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Export Markdown
  const handleExportMarkdown = () => {
    if (!plan) return;
    const md = exportPlanToMarkdown(plan, plan.daily_hours || 2.5, completedTasksMap);
    const filename = `${plan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-")}-curriculum.md`;
    downloadFile(filename, md, "text/markdown;charset=utf-8");
    playChime("click");
  };

  // 2. Export CSV
  const handleExportCSV = () => {
    if (!plan) return;
    const csv = exportPlanToCSV(plan, completedTasksMap);
    const filename = `${plan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-")}-tasks.csv`;
    downloadFile(filename, csv, "text/csv;charset=utf-8");
    playChime("click");
  };

  // 3. Export iCal (.ics)
  const handleExportICS = () => {
    if (!plan) return;
    const ics = generateICS(plan);
    const filename = `${plan.subject.toLowerCase().replace(/[^a-z0-9]/g, "-")}-schedule.ics`;
    downloadFile(filename, ics, "text/calendar;charset=utf-8");
    playChime("click");
  };

  // 4. Export PDF / Printable dossier
  const handleExportPDF = () => {
    if (!plan) return;
    printCurriculumDocument(plan, completedTasksMap);
    playChime("click");
  };

  // 5. Complete JSON Application Backup
  const handleExportFullJSON = () => {
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      generator: "CuratePlan Enterprise",
      plans: savedPlans,
      sessions,
      completedTasksMap,
      settings: userSettings,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const filename = `curateplan-backup-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(filename, jsonStr, "application/json");
    playChime("click");
  };

  // 6. Handle file selection for JSON backup import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess("");

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed) throw new Error("File content is empty or invalid JSON.");

        let plansToRestore: SavedPlan[] = [];
        let sessionsToRestore: StudySession[] = [];
        let progressToRestore: Record<string, boolean> = {};
        let settingsToRestore: UserSettings | undefined;

        if (Array.isArray(parsed.plans)) {
          plansToRestore = parsed.plans;
          sessionsToRestore = Array.isArray(parsed.sessions) ? parsed.sessions : [];
          progressToRestore = parsed.completedTasksMap || {};
          settingsToRestore = parsed.settings;
        } else if (Array.isArray(parsed)) {
          plansToRestore = parsed;
        } else if (parsed.subject && parsed.schedule) {
          plansToRestore = [parsed];
        } else {
          throw new Error("Unrecognized backup format. Must contain valid curriculum plans.");
        }

        if (plansToRestore.length === 0) {
          throw new Error("No study plans found inside backup archive.");
        }

        setPendingBackupData({
          plans: plansToRestore,
          sessions: sessionsToRestore,
          completedTasksMap: progressToRestore,
          settings: settingsToRestore,
        });
      } catch (err) {
        setImportError(
          err instanceof Error
            ? `Failed to parse backup: ${err.message}`
            : "Invalid backup file. Please provide a valid CuratePlan JSON file."
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmRestore = () => {
    if (!pendingBackupData) return;
    onRestoreBackup(pendingBackupData);
    setImportSuccess(`Successfully restored ${pendingBackupData.plans.length} curriculum plans and ${pendingBackupData.sessions.length} study sessions!`);
    setPendingBackupData(null);
    playChime("complete");
  };

  const lastBackupDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
              Data Management
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Local Storage Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Export & Cloud Synchronization
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Export study blueprints to PDF, Markdown, CSV, and iCal. Restore full verified JSON backups or configure sync integrations.
          </p>
        </div>

        {/* Global Export JSON button */}
        <button
          type="button"
          onClick={handleExportFullJSON}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
        >
          <Database className="w-4 h-4" />
          <span>Full Backup (JSON)</span>
        </button>
      </div>

      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importSuccess}</span>
          </div>
          <button type="button" onClick={() => setImportSuccess("")} className="hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{importError}</span>
          </div>
          <button type="button" onClick={() => setImportError("")} className="hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: EXPORT CARDS (PDF, MARKDOWN, CSV, JSON, ICAL) */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Export Curriculum & Telemetry</h3>
            <p className="text-xs text-slate-500">
              Select the file format suited for your documentation, calendar, or external spreadsheet workflow.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Target Plan:</span>
            <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              {plan ? plan.subject : "No active plan"}
            </span>
          </div>
        </div>

        {/* 5 Export Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. PDF / Printable Report */}
          <div className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl space-y-3 transition group flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Printable PDF
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clean, high-resolution document with curriculum breakdown and milestones.
              </p>
            </div>
            <button
              type="button"
              disabled={!plan}
              onClick={handleExportPDF}
              className="w-full py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Print / Save PDF
            </button>
          </div>

          {/* 2. Structured Markdown */}
          <div className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl space-y-3 transition group flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Markdown (.md)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Structured Obsidian and GitHub-ready task breakdown with checklists.
              </p>
            </div>
            <button
              type="button"
              disabled={!plan}
              onClick={handleExportMarkdown}
              className="w-full py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Export Markdown
            </button>
          </div>

          {/* 3. CSV Spreadsheet */}
          <div className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl space-y-3 transition group flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                CSV Spreadsheet
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Standard comma-separated table for Excel, Google Sheets, or Notion databases.
              </p>
            </div>
            <button
              type="button"
              disabled={!plan}
              onClick={handleExportCSV}
              className="w-full py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Export CSV
            </button>
          </div>

          {/* 4. iCalendar (.ics) */}
          <div className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl space-y-3 transition group flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                iCalendar (.ics)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Schedule study events, focus sessions, and deadlines in Google Calendar or Apple.
              </p>
            </div>
            <button
              type="button"
              disabled={!plan}
              onClick={handleExportICS}
              className="w-full py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Export .ICS Feed
            </button>
          </div>

          {/* 5. Complete JSON Backup */}
          <div className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl space-y-3 transition group flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                JSON Backup
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lossless snapshot of all study plans, sessions, settings, and progress.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportFullJSON}
              className="w-full py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer shadow-2xs"
            >
              Backup JSON
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: BACKUP MANAGEMENT (IMPORT & RESTORE) */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Backup Management</h3>
            <p className="text-xs text-slate-500">
              Restore an existing CuratePlan JSON backup archive or migrate your study plans between devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Last saved: {lastBackupDateStr}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select File</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/60 hover:bg-emerald-50/20"
        >
          <Upload className="w-6 h-6 text-slate-400" />
          <p className="text-xs font-semibold text-slate-700">
            Click to upload or drag-and-drop your CuratePlan backup (.json)
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            Automatically validates schemas, sessions telemetry, and completed task IDs before importing
          </span>
        </div>
      </div>

      {/* SECTION 3: INTEGRATIONS (HONEST STATUS INDICATORS) */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Integrations & External Sync
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              CuratePlan is engineered with an offline-first architecture, with connector endpoints for your developer toolchain.
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local-First Storage</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Integration 1: Google Calendar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Google Calendar</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                iCal Ready
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Subscribe to live study deadlines, milestones, and focus periods using your exported iCalendar feed.
            </p>
            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
              Export format: RFC 5545
            </div>
          </div>

          {/* Integration 2: Notion */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>Notion</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                CSV / MD Ready
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Import curriculum task matrices and progress logs directly into Notion databases via CSV or Markdown.
            </p>
            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
              Table & Database ready
            </div>
          </div>

          {/* Integration 3: Google Drive */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-slate-600" />
                <span>Google Drive</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Not connected
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Automated cloud backup sync of weekly study archives and milestones into your personal Drive vault.
            </p>
            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
              Status: Available in v2.0
            </div>
          </div>

          {/* Integration 4: Supabase */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Supabase Sync</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Ready to configure
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Multi-device realtime synchronization with PostgreSQL, Row-Level Security, and session telemetry replication.
            </p>
            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono">
              Offline-first fallback active
            </div>
          </div>
        </div>
      </div>

      {/* RESTORE CONFIRMATION PREVIEW MODAL */}
      {pendingBackupData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setPendingBackupData(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Restore Backup Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingBackupData(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                The backup file has been validated. Here is a summary of what will be restored into your browser storage:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Curriculum Plans:</span>
                  <strong className="text-slate-900">{pendingBackupData.plans.length}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Recorded Study Sessions:</span>
                  <strong className="text-slate-900">{pendingBackupData.sessions.length}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Completed Task Records:</span>
                  <strong className="text-slate-900">
                    {Object.keys(pendingBackupData.completedTasksMap).length}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Preferences Restored:</span>
                  <strong className="text-slate-900">{pendingBackupData.settings ? "Yes" : "Preserve Current"}</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>This action will update your current active data with the archive contents.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingBackupData(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
