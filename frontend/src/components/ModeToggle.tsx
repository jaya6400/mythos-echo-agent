"use client";

import React from "react";
import { Zap, Globe2 } from "lucide-react";

interface ModeToggleProps {
  mode: "orchestrate" | "mcp-bridge";
  setMode: (mode: "orchestrate" | "mcp-bridge") => void;
  disabled?: boolean;
}

export default function ModeToggle({ mode, setMode, disabled }: ModeToggleProps) {
  const modes = [
    { id: "orchestrate", label: "Creator Flow", icon: Zap },
    { id: "mcp-bridge", label: "Research Boost", icon: Globe2 },
  ] as const;

  return (
    <div className="flex p-1 bg-slate-950/80 border border-teal-300/20 rounded-xl w-fit">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            disabled={disabled}
            onClick={() => setMode(m.id)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive 
                ? "bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/20" 
                : "text-blue-200 hover:text-white hover:bg-teal-400/10"
            } disabled:opacity-50`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
