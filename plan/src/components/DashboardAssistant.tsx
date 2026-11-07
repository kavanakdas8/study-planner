"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { SavedPlan, AssistantMessage, PlanModificationProposal } from "@/types/study";
import { normalizePlanToCurriculum } from "@/lib/curriculumAdapter";

interface DashboardAssistantProps {
  activePlan: SavedPlan | null;
  completedTasksMap: Record<string, boolean>;
  activeTimerTaskId?: string | null;
  onPlanModified: (updatedPlan: SavedPlan) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: "Explain this topic simply", prompt: "Explain the active topic in simple terms with an intuitive analogy." },
  { label: "Give a practical code example", prompt: "Give me a practical, hands-on code example for the current topic." },
  { label: "Create 5 practice questions", prompt: "Create 5 practice quiz questions on this topic with answers and explanations." },
  { label: "What should I study next?", prompt: "Based on my curriculum and completed tasks, what should I focus on next?" },
];

export function DashboardAssistant({
  activePlan,
  completedTasksMap,
  activeTimerTaskId,
  onPlanModified,
  isOpen,
  onClose,
}: DashboardAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "initial_assistant_msg",
      role: "assistant",
      content:
        "Hello! I am your AI learning assistant. Ask me to explain concepts, generate practice questions, or modify your study roadmap anytime.",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingModification, setPendingModification] = useState<PlanModificationProposal | null>(null);
  const [isApplyingMod, setIsApplyingMod] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive current study context
  let currentTaskTitle = "General Study";
  let currentPeriodLabel = "Active Module";
  let completedCount = 0;
  let totalTasks = 0;

  if (activePlan) {
    activePlan.schedule.forEach((p, pIdx) => {
      p.tasks.forEach((t, tIdx) => {
        totalTasks++;
        const tId = `${activePlan.id}_${pIdx}_${tIdx}`;
        if (completedTasksMap[tId]) {
          completedCount++;
        } else if (currentTaskTitle === "General Study") {
          currentTaskTitle = t.title;
          currentPeriodLabel = p.period_label;
        }

        if (activeTimerTaskId === tId) {
          currentTaskTitle = t.title;
          currentPeriodLabel = p.period_label;
        }
      });
    });
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, pendingModification]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || inputText).trim();
    if (!text || loading) return;

    setError("");
    const userMsg: AssistantMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    // Check if the user is asking to modify curriculum
    const isModifying =
      text.toLowerCase().includes("finish in") ||
      text.toLowerCase().includes("add revision") ||
      text.toLowerCase().includes("remove") ||
      text.toLowerCase().includes("reschedule") ||
      text.toLowerCase().includes("make this module") ||
      text.toLowerCase().includes("weeks instead of") ||
      text.toLowerCase().includes("modify my plan");

    if (isModifying && activePlan) {
      try {
        const completedIds = Object.keys(completedTasksMap).filter((k) => completedTasksMap[k]);
        const res = await fetch("/api/modify-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_plan: {
              subject: activePlan.subject,
              target_timeframe: activePlan.target_timeframe,
              overview: activePlan.overview,
              schedule: activePlan.schedule,
            },
            instruction: text,
            completed_task_ids: completedIds,
          }),
        });

        if (!res.ok) throw new Error(`Modify error (${res.status})`);

        const modData: PlanModificationProposal = await res.json();
        setPendingModification(modData);

        const aiReply: AssistantMessage = {
          id: `msg_${Date.now()}_ai`,
          role: "assistant",
          content: `${modData.explanation}\n\nReview the proposed adjustments below. Click **Confirm & Apply Changes** to update your curriculum.`,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiReply]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to modify plan.";
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard Study Tutor interaction
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          topic_context: {
            subject: activePlan?.subject,
            period: currentPeriodLabel,
            task: currentTaskTitle,
            completedTasks: completedCount,
            totalTasks,
          },
          plan_overview: activePlan?.overview,
        }),
      });

      if (!res.ok) throw new Error(`Assistant error (${res.status})`);

      const data = await res.json();

      const aiReply: AssistantMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        follow_ups: data.follow_ups || [],
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch {
      const fallbackReply: AssistantMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: `Here is a study tip for **${currentTaskTitle}**: Focus on breaking down the implementation step-by-step. Dedicate your next focus session to testing edge cases.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyModification = () => {
    if (!pendingModification || !activePlan) return;
    setIsApplyingMod(true);

    const updatedSavedPlan: SavedPlan = {
      ...activePlan,
      subject: pendingModification.modified_plan.subject,
      target_timeframe: pendingModification.modified_plan.target_timeframe,
      overview: pendingModification.modified_plan.overview,
      schedule: pendingModification.modified_plan.schedule,
      lastModifiedAt: Date.now(),
    };

    const normalized = normalizePlanToCurriculum(updatedSavedPlan, completedTasksMap);
    onPlanModified(normalized);

    setPendingModification(null);
    setIsApplyingMod(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_confirm`,
        role: "assistant",
        content: "Curriculum successfully updated! Your roadmap, timeline, and table views have been refreshed while preserving all completed work.",
        timestamp: Date.now(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-fade-in">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              AI Study Assistant
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium">
              Context: {currentPeriodLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          aria-label="Close assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CONTEXT BANNER */}
      <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-[11px] text-slate-600 font-mono shrink-0">
        <span className="truncate pr-2">
          Task: <strong className="text-slate-800">{currentTaskTitle}</strong>
        </span>
        <span className="text-emerald-700 font-semibold shrink-0">
          {completedCount}/{totalTasks} Done
        </span>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } space-y-1.5`}
            >
              <div
                className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-br-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {/* Follow-up suggestion pills */}
              {!isUser && msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 max-w-[90%]">
                  {msg.follow_ups.map((fu, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSend(fu)}
                      className="text-[10px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition cursor-pointer"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* PENDING PLAN MODIFICATION PROPOSAL CARD */}
        {pendingModification && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 animate-fade-in text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sliders className="w-4 h-4 text-amber-700" />
              <span>Proposed Curriculum Changes</span>
            </div>

            <ul className="space-y-1 pl-4 list-disc text-amber-800 text-[11px]">
              {pendingModification.proposed_changes.map((ch, idx) => (
                <li key={idx}>{ch}</li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingModification(null)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white text-xs"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleApplyModification}
                disabled={isApplyingMod}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Apply</span>
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Thinking...</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK ACTIONS & INPUT COMPOSER */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-2.5 shrink-0">
        {/* Preset Prompt Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_ACTIONS.map((qa, i) => (
            <button
              type="button"
              key={i}
              onClick={() => handleSend(qa.prompt)}
              className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI or say 'Change to 4 weeks'..."
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-100 disabled:text-slate-400 transition cursor-pointer shadow-xs flex items-center justify-center shrink-0"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
