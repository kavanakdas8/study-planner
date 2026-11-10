"use client";

import React, { useState } from "react";
import { Compass, Menu, X } from "lucide-react";

interface LandingNavbarProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
  onOpenDashboard?: () => void;
  hasExistingWorkspace?: boolean;
}

export function LandingNavbar({
  onNavigateLogin,
  onNavigateSignup,
  onOpenDashboard,
  hasExistingWorkspace = false,
}: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] flex items-center justify-center text-[#059669] shadow-2xs group-hover:border-[#059669]/40 transition">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-[#0F172A] tracking-tight leading-none">
              CuratePlan
            </span>
            <span className="text-[10px] font-medium text-[#94A3B8] mt-0.5 hidden sm:block">
              Plan Smarter. Learn Better.
            </span>
          </div>
        </a>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
          <button
            type="button"
            onClick={() => scrollToSection("features")}
            className="hover:text-[#059669] transition cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="hover:text-[#059669] transition cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="hover:text-[#059669] transition cursor-pointer"
          >
            About
          </button>
          {hasExistingWorkspace && onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="text-[#059669] hover:text-[#047857] font-semibold transition cursor-pointer"
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* Right: Auth CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0] transition cursor-pointer"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onNavigateSignup}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-xs transition cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-4 space-y-3 animate-fade-in">
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="px-3 py-2 text-left text-sm font-medium text-[#475569] hover:text-[#059669] hover:bg-[#F8FAFC] rounded-lg transition cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="px-3 py-2 text-left text-sm font-medium text-[#475569] hover:text-[#059669] hover:bg-[#F8FAFC] rounded-lg transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="px-3 py-2 text-left text-sm font-medium text-[#475569] hover:text-[#059669] hover:bg-[#F8FAFC] rounded-lg transition cursor-pointer"
            >
              About
            </button>
            {hasExistingWorkspace && onOpenDashboard && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDashboard();
                }}
                className="px-3 py-2 text-left text-sm font-semibold text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition cursor-pointer"
              >
                Open Dashboard
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateLogin();
              }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSignup();
              }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white transition cursor-pointer shadow-xs"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

