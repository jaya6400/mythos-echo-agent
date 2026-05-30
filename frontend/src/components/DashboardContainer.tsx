"use client";

import React from "react";
import Sidebar, { LogStep } from "@/components/Sidebar";

interface DashboardContainerProps {
  children: React.ReactNode;
  logs: LogStep[];
  isProcessing: boolean;
}

export default function DashboardContainer({ children, logs, isProcessing }: DashboardContainerProps) {
  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950/40 border border-white/5 rounded-xl backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Main Content Generating Area */}
      <div className="flex-1 flex flex-col h-[700px] md:h-auto min-w-0 p-6 space-y-6 overflow-y-auto">
        {children}
      </div>

      {/* Thought Log Sidebar */}
      <Sidebar logs={logs} isProcessing={isProcessing} />
    </div>
  );
}
