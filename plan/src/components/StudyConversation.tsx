"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ChatMessage, StudyPlan } from "@/types/study";
import { playChime } from "@/lib/utils";

interface StudyConversationProps {
  initialPrompt?: string;
  onPlanReady: (plan: StudyPlan, collectedInfo: Record<string, unknown>) => void;
  onBackToLanding: () => void;
  conversationHistory: ChatMessage[];
  onUpdateHistory: (msgs: ChatMessage[]) => void;
  collectedInfo: Record<string, unknown>;
  onUpdateCollectedInfo: (info: Record<string, unknown>) => void;
}

export function StudyConversation({
  initialPrompt,
  onPlanReady,
  onBackToLanding,
  conversationHistory,
  onUpdateHistory,
  collectedInfo,
  onUpdateCollectedInfo,
}: StudyConversationProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialSentRef = useRef(false);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, loading, isGeneratingRoadmap]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message to the backend
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading || isGeneratingRoadmap) return;

    setError(null);
    setInputText("");

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const newHistory = [...conversationHistory, userMsg];
    onUpdateHistory(newHistory);
    setLoading(true);
    playChime("click");

    try {
      // Backend chat request
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          collected_info: collectedInfo,
          mode: "onboarding",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.detail || `API returned status ${res.status}. Check backend.`
        );
      }

      const data = await res.json();

      // Update collected info
      if (data.collected_info) {
        onUpdateCollectedInfo(data.collected_info);
      }

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        suggestedReplies: data.suggested_replies || [],
      };

      const updatedWithReply = [...newHistory, assistantMsg];
      onUpdateHistory(updatedWithReply);

      // If roadmap is ready and plan was returned
      if (data.ready_to_generate && data.plan) {
        setIsGeneratingRoadmap(true);
        playChime("complete");
        setTimeout(() => {
          onPlanReady(data.plan, data.collected_info || collectedInfo);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to AI study planner backend.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  // If an initialPrompt was provided from the landing page, send it automatically once
  useEffect(() => {
    if (initialPrompt && !initialSentRef.current && conversationHistory.length === 0) {
      initialSentRef.current = true;
      handleSendMessageRef.current(initialPrompt);
    }
  }, [initialPrompt, conversationHistory.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleChipClick = (chipText: string) => {
    handleSendMessage(chipText);
  };

  // Extract current focus topic if present
  const currentTopic = String(collectedInfo.topic || "Your Study Roadmap");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation Bar */}
      <header className="h-15 px-4 sm:px-6 bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Back to Landing"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Compass className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-none block truncate">
                CuratePlan AI
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block truncate">
                {currentTopic}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Boolean(collectedInfo.daily_hours) && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
              {String(collectedInfo.daily_hours)}h/day
            </span>
          )}
          {Boolean(collectedInfo.timeframe) && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              {String(collectedInfo.timeframe)}
            </span>
          )}
        </div>
      </header>

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto space-y-6">
        {conversationHistory.length === 0 && !loading && (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 mx-auto flex items-center justify-center text-emerald-600 shadow-2xs">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Let&apos;s architect your study plan</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tell me what skill, technology, or exam you want to master. I&apos;ll ask a few targeted questions to tailor your roadmap.
            </p>
          </div>
        )}

        {conversationHistory.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isLatestAssistant =
            !isUser && idx === conversationHistory.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Suggested Quick Reply Chips */}
                {!isUser && isLatestAssistant && msg.suggestedReplies && msg.suggestedReplies.length > 0 && !loading && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedReplies.map((replyText) => (
                      <button
                        key={replyText}
                        type="button"
                        onClick={() => handleChipClick(replyText)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 hover:text-emerald-800 font-medium transition cursor-pointer shadow-2xs"
                      >
                        {replyText}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Roadmap Synthesis Animation */}
        {isGeneratingRoadmap && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fade-in">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Architecting your personalized curriculum roadmap...</span>
            </div>
            <p className="text-[11px] text-emerald-700/80">
              Structuring modules, balancing practice tasks, and scheduling milestones.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (conversationHistory.length > 0) {
                  const lastUser = [...conversationHistory].reverse().find((m) => m.role === "user");
                  if (lastUser) handleSendMessage(lastUser.content);
                }
              }}
              className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Fixed Bottom Input Area */}
      <footer className="p-4 sm:p-5 bg-white border-t border-slate-200 sticky bottom-0 z-20">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl w-full mx-auto flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:bg-white rounded-2xl p-2 transition-all shadow-xs"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading || isGeneratingRoadmap}
            placeholder="Type your response or follow-up question..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 px-3 py-1.5 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading || isGeneratingRoadmap}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
            title="Send message"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}

