"use client";

import { useState } from "react";
import LandingView from "@/components/LandingView";

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const [hasEntered, setHasEntered] = useState(false);

  return hasEntered ? (
    <>{children}</>
  ) : (
    <LandingView onEnter={() => setHasEntered(true)} />
  );
}
