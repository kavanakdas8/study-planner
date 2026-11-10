"use client";

import React, { useState } from "react";
import {
  Compass,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface SignupPageProps {
  onBackToLanding: () => void;
  onNavigateLogin: () => void;
}

export function SignupPage({
  onBackToLanding,
  onNavigateLogin,
}: SignupPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDemoMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions to continue.");
      return;
    }

    // Clear sensitive fields immediately; never persist passwords
    setPassword("");
    setConfirmPassword("");
    setDemoMessage(
      `UI-Only Demo: Validation succeeded for ${trimmedName} (${trimmedEmail}). No account was created and no password or personal data was stored.`
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
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669]">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
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

        {/* Centered Sign Up Form */}
        <div className="w-full max-w-md mx-auto my-8 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">
              UI-Only Preview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-[#475569]">
              Preview the registration experience for CuratePlan.
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
                htmlFor="signup-name"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Email address
              </label>
              <input
                id="signup-email"
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
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] cursor-pointer p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#CBD5E1] text-[#059669] focus:ring-[#059669] mt-0.5 shrink-0"
              />
              <span>
                I agree to the{" "}
                <span className="font-semibold text-[#0F172A]">
                  Terms &amp; Conditions
                </span>{" "}
                and understand this is a UI-only registration demo.
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm transition shadow-sm cursor-pointer mt-2"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-xs text-[#475569]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-semibold text-[#059669] hover:text-[#047857] cursor-pointer"
            >
              Login
            </button>
          </p>
        </div>

        {/* Bottom Note */}
        <p className="text-[11px] text-[#94A3B8] text-center lg:text-left">
          UI-only registration form · No account or database is required to plan your studies.
        </p>
      </div>

      {/* Right Decorative Side Panel: Study Analytics & Goal Overview */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8FAFC] p-12 items-center justify-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 70% 25%, rgba(5,150,105,0.08), transparent 65%)",
          }}
        />
        <div className="max-w-md w-full space-y-6 relative z-10">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Weekly Consistency
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">14 hrs / wk</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">
                Turn Long-Term Goals Into Daily Wins
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Break down ambitious topics into manageable focus blocks, track milestones, and measure your real progress.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2.5 text-xs text-[#0F172A] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Custom daily study commitment &amp; duration</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#0F172A] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Roadmap, Kanban, Timeline &amp; Analytics views</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#0F172A] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Integrated Pomodoro focus timer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

