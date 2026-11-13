"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

interface LoginPageProps {
  onBackToLanding: () => void;
  onNavigateSignup: () => void;
}

export function LoginPage({
  onBackToLanding,
  onNavigateSignup,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDemoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // Clear password immediately and display explicit UI-only demo feedback
    setPassword("");
    setDemoMessage(
      `UI-Only Demo: Form validation passed for ${trimmedEmail}. No backend authentication is enabled and no credentials were stored or verified.`
    );
  };

  const handleForgotPassword = () => {
    setError(null);
    setDemoMessage(
      "UI-Only Demo: Password recovery is not connected to an authentication server in this frontend preview."
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row selection:bg-[#ECFDF5] selection:text-[#047857]">
      {/* Left Form Column */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white border-r border-[#E2E8F0]">
        {/* Top Brand & Back Link */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <BrandLogo className="w-10 h-7" />
            <span className="text-base font-bold text-[#0F172A] tracking-tight group-hover:text-[#059669] transition">
              CuratePlan
            </span>
          </button>

          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Centered Login Form */}
        <div className="w-full max-w-md mx-auto my-10 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">
              UI-Only Preview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-[#475569]">
              Enter your details below to preview the login interface.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {demoMessage && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] text-xs text-[#047857] flex items-start gap-2.5 animate-fade-in"
            >
              <Info className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="leading-relaxed font-medium">{demoMessage}</p>
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="text-xs font-bold underline hover:text-[#0F172A] cursor-pointer"
                >
                  Return to Course Planner →
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] cursor-pointer p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-[#475569] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#059669] focus:ring-[#059669]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-[#059669] hover:text-[#047857] cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm transition shadow-sm cursor-pointer mt-2"
            >
              Login
            </button>
          </form>

          <p className="text-center text-xs text-[#475569]">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onNavigateSignup}
              className="font-semibold text-[#059669] hover:text-[#047857] cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Bottom Note */}
        <p className="text-[11px] text-[#94A3B8] text-center lg:text-left">
          UI-only login form · You can use CuratePlan&apos;s local study planner without signing in.
        </p>
      </div>

      {/* Right Decorative Side Panel: Learning Roadmap Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8FAFC] p-12 items-center justify-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(5,150,105,0.08), transparent 65%)",
          }}
        />
        <div className="max-w-md w-full space-y-6 relative z-10">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] px-2.5 py-1 rounded-md">
                Structured Learning Path
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">1h / day</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Machine Learning &amp; AI Foundations
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                3-month curriculum · Python, mathematical models &amp; neural networks
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#D1FAE5] flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span className="text-xs font-semibold text-[#0F172A]">
                  Month 1 · Python &amp; Exploratory Data Analysis
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
                <Layers className="w-4 h-4 text-[#475569] shrink-0" />
                <span className="text-xs font-semibold text-[#0F172A]">
                  Month 2 · Supervised Models &amp; Cost Functions
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#475569] shrink-0" />
                <span className="text-xs font-semibold text-[#0F172A]">
                  Month 3 · Neural Networks &amp; Production Inference
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#475569] text-center leading-relaxed">
            Stay consistent with structured daily blocks, visual roadmaps, and measurable milestones.
          </p>
        </div>
      </div>
    </div>
  );
}

