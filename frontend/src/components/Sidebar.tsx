"use client";

import React, { useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Terminal,
  Database,
  Cpu,
  Search
} from "lucide-react";

export interface LogStep {
  id: string;
  status: "pending" | "running" | "success" | "error";
  label: string;
  time: string;
  category: "reasoning" | "database" | "gateway" | "analysis";
  details?: string;
}

interface SidebarProps {
  logs: LogStep[];
  isProcessing: boolean;
}

export default function Sidebar({ logs, isProcessing }: SidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reasoning": return <Cpu className="w-4 h-4 text-accent-purple" />;
      case "database": return <Database className="w-4 h-4 text-accent-amber" />;
      case "gateway": return <Terminal className="w-4 h-4 text-accent-blue" />;
      case "analysis": return <Search className="w-4 h-4 text-accent-emerald" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 text-accent-blue animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-accent-emerald fill-accent-emerald/10" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-accent-rose animate-pulse" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-600 ml-1 mr-1" />;
    }
  };

  return (
    <aside className="w-full md:w-96 border-l border-white/5 bg-slate-950/80 backdrop-blur-xl h-full flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-accent-blue animate-ping absolute opacity-75" />
            <div className={`w-3 h-3 rounded-full ${isProcessing ? "bg-accent-blue" : "bg-accent-emerald"} relative`} />
          </div>
          <div>
            <h2 className="font-semibold text-sm tracking-wide text-slate-200">AGENT THOUGHT LOG</h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {isProcessing ? "Gemini is thinking..." : "Ready & Connected"}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
          MCP 8.12.0
        </div>
      </div>

      {/* Logs Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-white/5 rounded-full border border-white/10 text-slate-500">
              <Terminal className="w-6 h-6 animate-pulse-glow" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Log console inactive</p>
              <p className="text-xs text-slate-500 max-w-[200px] mt-1">Submit a request to stream real-time workspace actions.</p>
            </div>
          </div>
        ) : (
          logs.map((log, index) => {
            const isExpanded = expandedId === log.id;
            return (
              <div 
                key={log.id} 
                className={`group border rounded-lg bg-white/[0.02] transition-all duration-200 animate-slide-in ${
                  log.status === "running" ? "border-accent-blue/30 bg-accent-blue/[0.01]" : 
                  log.status === "error" ? "border-accent-rose/30 bg-accent-rose/[0.01]" : 
                  "border-white/5 hover:border-white/10"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Log Primary Row */}
                <div 
                  onClick={() => log.details && toggleExpand(log.id)}
                  className={`p-3 flex items-start justify-between cursor-pointer space-x-3 select-none`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="mt-0.5 p-1 bg-white/5 rounded border border-white/10 shrink-0">
                      {getCategoryIcon(log.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-mono font-medium truncate ${
                        log.status === "running" ? "text-accent-blue" :
                        log.status === "error" ? "text-accent-rose" :
                        "text-slate-300"
                      }`}>
                        {log.label}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          {log.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600">•</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {log.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {getStatusIndicator(log.status)}
                    {log.details && (
                      <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Log Details Container */}
                {isExpanded && log.details && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5 bg-slate-950/40 text-[11px] font-mono text-slate-400 break-all leading-relaxed whitespace-pre-wrap">
                    {log.details}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>GATEWAY: CONNECTED</span>
        <span>LATENCY: 42ms</span>
      </div>
    </aside>
  );
}
