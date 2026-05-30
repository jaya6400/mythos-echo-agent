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
    { id: "orchestrate", label: "Orchestrate", icon: Zap },
    { id: "mcp-bridge", label: "MCP Bridge", icon: Globe2 },
  ] as const;

  return (
    <div className="flex p-1 bg-slate-900/80 border border-white/10 rounded-xl w-fit">
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
                ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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