"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "w-9 h-5" }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="CuratePlan Logo"
      width={70}
      height={38}
      priority
      className={`object-contain shrink-0 ${className}`}
    />
  );
}
