"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SignupPage } from "@/components/auth/SignupPage";

export default function SignupRoute() {
  const router = useRouter();

  return (
    <SignupPage
      onBackToLanding={() => router.push("/")}
      onNavigateLogin={() => router.push("/login")}
    />
  );
}
