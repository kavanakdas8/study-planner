"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { curriculumStorage } from "@/services/curriculumStorage";

export default function HomeRoute() {
  const router = useRouter();
  const [hasWorkspace, setHasWorkspace] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const plans = curriculumStorage.getPlans();
      setHasWorkspace(plans.length > 0);
    });
  }, []);

  return (
    <LandingPage
      onBuildPlan={() => router.push("/create-plan")}
      onNavigateLogin={() => router.push("/login")}
      onNavigateSignup={() => router.push("/signup")}
      onOpenDashboard={() => router.push("/dashboard")}
      hasExistingWorkspace={hasWorkspace}
    />
  );
}
