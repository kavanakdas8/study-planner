"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  onBack?: () => void;
  className?: string;
  fallbackHref?: string;
}

export function BackButton({ onBack, className = "", fallbackHref = "/" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== "undefined") {
      const stateIdx = window.history.state?.idx;
      const hasInternalHistory =
        typeof stateIdx === "number" ? stateIdx > 0 : window.history.length > 1;

      if (hasInternalHistory) {
        router.back();
        return;
      }
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      title="Go back"
      className={`inline-flex items-center justify-center p-2 rounded-lg text-[#64748B] hover:text-[#059669] hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] transition cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
    </button>
  );
}

