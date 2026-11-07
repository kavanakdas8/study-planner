"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Compass,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ChatMessage, OnboardingParams, StudyPlan } from "@/types/study";

interface ChatInterfaceProps {
  initialGoal: string;
  onPlanGenerated: (plan: StudyPlan, params: OnboardingParams) => void;
  onBackToLanding: () => void;
  onOpenDashboard?: () => void;
  hasExistingPlans?: boolean;
}

const REASONING_STEPS = [
  "Analyzing subject prerequisites & domain scope...",
  "Structuring pedagogical module milestones...",
  "Calibrating daily study duration & hands-on exercises...",
  "Synthesizing documentation, practice tasks & projects...",
  "Finalizing personalized curriculum roadmap...",
];

export function ChatInterface({
  initialGoal,
  onPlanGenerated,
  onBackToLanding,
  onOpenDashboard,
  hasExistingPlans = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [extractedParams, setExtractedParams] = useState<OnboardingParams>({
    topic: initialGoal,
  });
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, isGeneratingPlan]);

  // Call /api/chat to get conversational reply, extracted parameters, and options
  const processNextChatStep = async (
    allMessages: ChatMessage[],
    currentParams: OnboardingParams
  ) => {
    setIsAiTyping(true);
    setError("");

    try {
      const apiPayload = {
        messages: allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        current_params: currentParams,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        throw new Error(`Chat error (${res.status})`);
      }

      const data = await res.json();

      const updatedParams: OnboardingParams = {
        ...currentParams,
        topic: data.topic || currentParams.topic,
        timeframe: data.timeframe || currentParams.timeframe,
        daily_hours: data.daily_hours !== undefined && data.daily_hours !== null ? data.daily_hours : currentParams.daily_hours,
        experience_level: data.experience_level || currentParams.experience_level,
        objective: data.objective || currentParams.objective,
      };

      setExtractedParams(updatedParams);

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        suggested_options: data.suggested_options || [],
        ready_to_generate: !!data.ready_to_generate,
        extracted_params: updatedParams,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback response if offline or backend error
      const fallbackAiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content:
          "Great! To create the most effective curriculum, what is your current experience level and how much time can you dedicate daily?",
        timestamp: Date.now(),
        suggested_options: [
          "Complete beginner (1 hr/day)",
          "Know the basics (2 hrs/day)",
          "Intermediate (1 hr/day)",
          "Advanced (2 hrs/day)",
        ],
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Initial user goal submission on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialUserMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: initialGoal,
      timestamp: Date.now(),
    };

    setMessages([initialUserMsg]);
    processNextChatStep([initialUserMsg], { topic: initialGoal });
  }, [initialGoal]);

  // Rotate through reasoning messages during full plan generation
  useEffect(() => {
    if (!isGeneratingPlan) return;
    const interval = setInterval(() => {
      setGenerationStepIdx((prev) => (prev + 1) % REASONING_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isGeneratingPlan]);

  // Handle user sending a new message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiTyping || isGeneratingPlan) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");

    processNextChatStep(newMessages, extractedParams);
  };

  // Handle clicking a suggested chip
  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  // Handle full curriculum generation
  const handleGenerateRoadmap = async () => {
    setIsGeneratingPlan(true);
    setError("");

    const topic = extractedParams.topic || initialGoal || "Study Curriculum";
    const timeframe = extractedParams.timeframe || "1 Month";
    const daily_hours = extractedParams.daily_hours || 1.5;
    const experience_level = extractedParams.experience_level || "Beginner";
    const objective = extractedParams.objective || "Practical building";

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          timeframe,
          daily_hours,
          experience_level,
          objective,
        }),
      });

      if (!res.ok) {
        throw new Error(`Generation error (${res.status})`);
      }

      const generatedPlan: StudyPlan = await res.json();
      onPlanGenerated(generatedPlan, {
        topic,
        timeframe,
        daily_hours,
        experience_level,
        objective,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate roadmap.";
      setError(msg);
      setIsGeneratingPlan(false);
    }
  };

  const isReady =
    extractedParams.topic &&
    extractedParams.timeframe &&
    extractedParams.daily_hours &&
    extractedParams.experience_level;

  return (
    <div className="h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between overflow-hidden">
      {/* HEADER */}
      <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#E2E8F0] bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Back to landing"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block leading-tight">
                CuratePlan
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Goal: <strong className="text-slate-700">{extractedParams.topic || initialGoal}</strong>
              </span>
            </div>
          </div>
        </div>

        {hasExistingPlans && onOpenDashboard && (
          <button
            type="button"
            onClick={onOpenDashboard}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200 cursor-pointer"
          >
            Dashboard
          </button>
        )}
      </header>

      {/* CONVERSATION HISTORY SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } animate-fade-in space-y-2`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-br-xs shadow-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs"
                }`}
              >
                {!isUser && (
                  <div className="text-[11px] font-semibold text-emerald-700 mb-1.5">
                    Planner
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Quick Reply Option Chips for AI messages */}
              {!isUser &&
                msg.suggested_options &&
                msg.suggested_options.length > 0 &&
                !isGeneratingPlan && (
                  <div className="flex flex-wrap gap-1.5 pt-1 pl-1 max-w-[85%]">
                    {msg.suggested_options.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleOptionClick(opt)}
                        className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 text-xs font-medium transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Ready to generate confirmation card */}
              {!isUser && msg.ready_to_generate && !isGeneratingPlan && (
                <div className="mt-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 w-full max-w-md shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Learning parameters ready!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Subject
                      </span>
                      <strong className="text-slate-800 truncate block">
                        {extractedParams.topic || initialGoal}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Timeframe
                      </span>
                      <strong className="text-slate-800">
                        {extractedParams.timeframe || "1 Month"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Daily Commitment
                      </span>
                      <strong className="text-slate-800">
                        {extractedParams.daily_hours || 1.5} hrs/day
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Experience
                      </span>
                      <strong className="text-slate-800">
                        {extractedParams.experience_level || "Beginner"}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateRoadmap}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Generate Learning Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAiTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>CuratePlan is analyzing your goal...</span>
          </div>
        )}

        {/* Full Plan Generation Loading Modal / Inline Indicator */}
        {isGeneratingPlan && (
          <div className="p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm text-center space-y-4 max-w-md mx-auto my-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">
                Architecting Your Curriculum
              </h3>
              <p className="text-xs text-slate-500 font-mono transition-all duration-300">
                {REASONING_STEPS[generationStepIdx]}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FIXED BOTTOM MESSAGE COMPOSER */}
      <div className="p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          {/* Quick Action when ready */}
          {isReady && !isGeneratingPlan && (
            <div className="mb-2 flex items-center justify-between text-xs px-1">
              <span className="text-slate-500">
                Ready to preview your curriculum?
              </span>
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Generate Roadmap &rarr;</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isAiTyping || isGeneratingPlan}
              placeholder={
                isGeneratingPlan
                  ? "Generating curriculum roadmap..."
                  : "Type your answer or describe adjustments..."
              }
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isAiTyping || isGeneratingPlan}
              className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
                inputText.trim() && !isAiTyping && !isGeneratingPlan
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
