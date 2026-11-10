"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "w-9 h-6" }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="CuratePlan Logo"
      width={72}
      height={48}
      priority
      className={`object-contain mix-blend-multiply shrink-0 ${className}`}
    />
  );
}

