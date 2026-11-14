"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/auth/LoginPage";

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginPage
      onBackToLanding={() => router.push("/")}
      onNavigateSignup={() => router.push("/signup")}
    />
  );
}
