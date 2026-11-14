"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { FocusTimer } from "@/components/FocusTimer";
import { PlanHistorySidebar } from "@/components/PlanHistorySidebar";
import { AboutModal } from "@/components/AboutModal";
import { Save, Undo2 } from "lucide-react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    savedPlans,
    activePlanId,
    activePlan,
    hasUnsavedChanges,
    selectPlan,
    deletePlan,
    renamePlan,
    toggleArchivePlan,
    saveDraftChanges,
    discardDraftChanges,
    completedTasksMap,
    toggleTask,
    clearCompletedTasks,
    activeTimer,
    setActiveTimer,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isAboutModalOpen,
    setIsAboutModalOpen,
    searchQuery,
    setSearchQuery,
    exportPDF,
    exportMarkdown,
    exportICS,
  } = useWorkspace();

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeNavTab = pathname.startsWith("/dashboard/curriculum")
    ? "curriculum"
    : pathname.startsWith("/dashboard/analytics")
    ? "analytics"
    : "dashboard";

  const handleSelectNavTab = (tabId: string) => {
    if (tabId === "curriculum") {
      router.push("/dashboard/curriculum");
    } else if (tabId === "analytics") {
      router.push("/dashboard/analytics");
    } else {
      router.push("/dashboard");
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Create Plan
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/create-plan");
        return;
      }

      // [ or Cmd/Ctrl + B -> Toggle sidebar collapse
      if (
        (e.key === "[" &&
          !["INPUT", "TEXTAREA"].includes(
            (e.target as HTMLElement)?.tagName
          )) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b")
      ) {
        e.preventDefault();
        toggleSidebarCollapsed();
        return;
      }

      // / -> Focus search
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex selection:bg-emerald-100 selection:text-emerald-900">
      {/* Subtle Ambient Radial Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(5,150,105,0.06), transparent 70%)",
        }}
      />

      {/* Primary Left Rail Navigation Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={selectPlan}
        onDeletePlan={deletePlan}
        onOpenCreateModal={() => router.push("/create-plan")}
        onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onReturnHome={() => router.push("/")}
        activeTimer={activeTimer}
        completedTasksMap={completedTasksMap}
        activeNavTab={activeNavTab}
        onSelectNavTab={handleSelectNavTab}
      />

      {/* Main Content Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 overflow-x-hidden">
        {/* Workspace Top Navigation Bar */}
        <TopBar
          activePlan={activePlan}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateModal={() => router.push("/create-plan")}
          onOpenHistoryModal={() => setIsHistoryDrawerOpen(true)}
          onExportPDF={exportPDF}
          onExportMarkdown={exportMarkdown}
          onExportICS={exportICS}
          onClearCompleted={clearCompletedTasks}
          onFocusSearch={() => searchInputRef.current?.focus()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAbout={() => setIsAboutModalOpen(true)}
        />

        {/* Manual Save Notification Banner */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50/95 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 sticky top-15 z-20 backdrop-blur-xs animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="font-bold shrink-0">Unsaved Changes:</span>
              <span className="truncate">
                You have modified this curriculum. Changes remain draft until manually saved.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={discardDraftChanges}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 border border-slate-200 bg-white font-medium flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Undo2 className="w-3 h-3 text-slate-500" />
                <span>Discard</span>
              </button>
              <button
                type="button"
                onClick={saveDraftChanges}
                className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Workspace View Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Floating Focus Timer Companion */}
      <FocusTimer
        timer={activeTimer}
        onUpdate={setActiveTimer}
        onCompleteTask={(taskId) => toggleTask(taskId)}
        onClose={() => setActiveTimer(null)}
      />

      {/* Slide-out Plan History Drawer */}
      <PlanHistorySidebar
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        onSelectPlan={selectPlan}
        onDeletePlan={deletePlan}
        onRenamePlan={renamePlan}
        onToggleArchivePlan={toggleArchivePlan}
        completedTasksMap={completedTasksMap}
      />

      {/* About CuratePlan Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
