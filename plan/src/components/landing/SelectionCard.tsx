"use client";

import React from "react";
import { Check } from "lucide-react";

interface SelectionCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export function SelectionCard({
  label,
  sublabel,
  selected,
  onClick,
  icon,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
        selected
          ? "bg-[#ECFDF5] border-[#059669] ring-2 ring-[#059669]/15 text-[#0F172A] shadow-2xs"
          : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
              selected
                ? "bg-[#059669] text-white"
                : "bg-[#F1F5F9] text-[#475569]"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <span
            className={`text-sm font-semibold block truncate ${
              selected ? "text-[#059669]" : "text-[#0F172A]"
            }`}
          >
            {label}
          </span>
          {sublabel && (
            <span className="text-xs text-[#475569] block truncate mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition border ${
          selected
            ? "bg-[#059669] border-[#059669] text-white"
            : "bg-white border-[#E2E8F0]"
        }`}
      >
        {selected && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
    </button>
  );
}

