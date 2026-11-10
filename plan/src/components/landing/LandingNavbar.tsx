"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
  const [activeLink, setActiveLink] = useState<string>("home");

  const handleNavClick = (section: string) => {
    setActiveLink(section);
    setMobileMenuOpen(false);
    if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How It Works" },
    { id: "about", label: "About" },
  ];

  return (
    <header className="w-full bg-transparent relative z-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[76px] flex items-center justify-between gap-6">
        {/* Left: CuratePlan Logo & Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("home");
          }}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <BrandLogo className="w-10 h-7" />
          <span className="font-display text-lg font-bold text-[#0F172A] tracking-tight">
            CuratePlan
          </span>
        </a>

        {/* Center: Minimal Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeLink === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`transition cursor-pointer py-1 ${
                  isActive
                    ? "text-[#059669] font-semibold"
                    : "text-[#0F172A]/75 hover:text-[#0F172A]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {hasExistingWorkspace && onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="text-[#059669] hover:text-[#047857] font-semibold transition cursor-pointer py-1"
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* Right: Lightweight Auth Actions */}
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-sm font-medium text-[#0F172A]/80 hover:text-[#0F172A] transition cursor-pointer"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onNavigateSignup}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white transition shadow-2xs cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg border border-[#E2E8F0] bg-transparent text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-5 space-y-4 animate-fade-in">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2.5 text-left text-sm font-medium rounded-lg transition cursor-pointer ${
                  activeLink === item.id
                    ? "text-[#059669] bg-[#ECFDF5] font-semibold"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                {item.label}
              </button>
            ))}
            {hasExistingWorkspace && onOpenDashboard && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDashboard();
                }}
                className="px-3 py-2.5 text-left text-sm font-semibold text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition cursor-pointer"
              >
                Open Dashboard
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateLogin();
              }}
              className="w-full py-2.5 rounded-full text-sm font-semibold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSignup();
              }}
              className="w-full py-2.5 rounded-full text-sm font-semibold bg-[#059669] hover:bg-[#047857] text-white transition cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
