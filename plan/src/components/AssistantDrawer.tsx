"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SavedPlan, ChatMessage } from "@/types/study";
import { playChime } from "@/lib/utils";

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePlan: SavedPlan | null;
  onApplyPlanUpdate: (updatedPlan: SavedPlan) => void;
}

const QUICK_ACTIONS = [
  "Reschedule my remaining topics",
  "I missed 3 days",
  "Reduce my daily workload",
  "Add more practical projects",
  "Explain this week's topics",
  "Create a practice quiz",
];

export function AssistantDrawer({
  isOpen,
  onClose,
  activePlan,
  onApplyPlanUpdate,
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (activePlan) {
      return [
        {
          id: "init_1",
          role: "assistant",
          content: `Hello! I'm your CuratePlan assistant for "${activePlan.subject}". You can ask me to explain topics, reschedule modules, adjust your study pace, or add more projects.`,
          timestamp: Date.now(),
          suggestedReplies: [
            "Reschedule my remaining topics",
            "Add more practical projects",
            "Reduce my daily workload",
          ],
        },
      ];
    }
    return [];
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedChange, setProposedChange] = useState<{
    summary: string;
    updatedPlan: SavedPlan;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, proposedChange]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading || !activePlan) return;

    setError(null);
    setInputText("");

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);
    playChime("click");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          current_plan: activePlan,
          mode: "assistant",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || "Assistant API request failed.");
      }

      const data = await res.json();

      const asstMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        suggestedReplies: data.suggested_replies || [],
      };

      setMessages([...newHistory, asstMsg]);

      // If AI proposed a curriculum change
      if (data.has_curriculum_change && data.updated_plan) {
        const completeUpdated: SavedPlan = {
          ...activePlan,
          ...data.updated_plan,
          id: activePlan.id,
          lastModifiedAt: Date.now(),
        };
        setProposedChange({
          summary: data.change_summary || "Curriculum schedule updated based on your request.",
          updatedPlan: completeUpdated,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reach assistant.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    if (!proposedChange) return;
    playChime("complete");
    onApplyPlanUpdate(proposedChange.updatedPlan);
    setProposedChange(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: "assistant",
        content: "Curriculum update applied successfully! Your dashboard, tasks, and analytics have been refreshed.",
        timestamp: Date.now(),
      },
    ]);
  };

  const handleDismissUpdate = () => {
    setProposedChange(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: "assistant",
        content: "Update discarded. Your existing curriculum remains unchanged.",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full z-10 animate-fade-in">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 leading-none truncate">
                AI Learning Assistant
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                {activePlan?.subject || "Curriculum Companion"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleSendMessage(action)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 hover:text-emerald-800 font-medium whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-1.5 ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-emerald-600 text-white rounded-br-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Suggested replies for this message */}
                  {!isUser && msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {msg.suggestedReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => handleSendMessage(reply)}
                          className="px-2 py-1 rounded bg-white hover:bg-emerald-50 border border-slate-200 text-[10px] text-slate-600 hover:text-emerald-700 transition cursor-pointer shadow-2xs"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Proposed Plan Update Confirmation Card */}
          {proposedChange && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-fade-in text-xs">
              <div className="flex items-start gap-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Proposed Curriculum Modification</span>
              </div>

              <p className="text-slate-700 leading-relaxed">
                {proposedChange.summary}
              </p>

              <div className="p-2.5 rounded-lg bg-white border border-amber-200/80 text-[11px] space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">
                  New Schedule: {proposedChange.updatedPlan.schedule.length} modules
                </span>
                <span className="block truncate">
                  Timeframe: {proposedChange.updatedPlan.target_timeframe}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmUpdate}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismissUpdate}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium text-xs transition cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-400 p-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Analyzing curriculum...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:bg-white transition"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or request a change..."
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 px-2 py-1 focus:outline-none"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition cursor-pointer shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
