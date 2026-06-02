"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Loader2,
  Menu,
  TrendingUp,
  X,
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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleLog = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reasoning":
        return <Lightbulb className="h-4 w-4 text-purple-300" />;
      case "database":
        return <TrendingUp className="h-4 w-4 text-amber-300" />;
      case "gateway":
        return <Activity className="h-4 w-4 text-blue-300" />;
      case "analysis":
        return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
      default:
        return <Activity className="h-4 w-4 text-blue-300" />;
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "running":
        return (
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="h-4 w-4 text-blue-300" />
          </motion.span>
        );
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
      case "error":
        return (
          <motion.span animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
            <AlertTriangle className="h-4 w-4 text-rose-300" />
          </motion.span>
        );
      default:
        return <div className="ml-1 mr-1 h-2 w-2 rounded-full bg-blue-400/50" />;
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-toggle"
        aria-label="Open creator strategy drawer"
        whileHover={{ y: -1, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="hidden sm:inline">Creator tips</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="sidebar-drawer"
            initial={{ x: "100%", opacity: 0.82 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.82 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-b border-teal-300/15 bg-cyan-950/30 p-8">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  {isProcessing && (
                    <motion.div
                      className="absolute h-3 w-3 rounded-full bg-teal-300"
                      animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <div className={`relative h-3 w-3 rounded-full ${isProcessing ? "bg-teal-300" : "bg-emerald-400"}`} />
                </div>
                <div>
                  <h2 className="creator-label glowing-navbar-accent">Content Strategy Tips</h2>
                  <p className="mt-2 text-[11px] font-medium text-blue-300">
                    {isProcessing ? "Shaping your story angle..." : "Your ideas are ready to review"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {logs.length === 0 ? (
                <motion.div
                  className="flex h-full flex-col items-center justify-center space-y-3 p-6 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                >
                  <TrendingUp className="h-8 w-8 text-emerald-300" />
                  <p className="empty-state-text">No active content tips yet</p>
                  <p className="text-xs text-blue-300">Start a generation to see story, pacing, and topic guidance.</p>
                </motion.div>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <motion.div
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.26, ease: "easeOut" }}
                      className={`group rounded-xl border ${
                        log.status === "running"
                          ? "border-blue-400/35 bg-blue-500/10"
                          : log.status === "error"
                            ? "border-rose-400/35 bg-rose-500/10"
                            : "border-teal-300/15 bg-slate-950/60"
                      }`}
                    >
                      <div
                        onClick={() => log.details && toggleLog(log.id)}
                        className="flex cursor-pointer select-none items-start justify-between space-x-3 p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-start space-x-3">
                          <div className="mt-0.5 shrink-0 rounded border border-teal-300/15 bg-teal-300/10 p-1">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-xs font-semibold ${
                                log.status === "running"
                                  ? "text-blue-300"
                                  : log.status === "error"
                                    ? "text-rose-300"
                                    : "text-slate-100"
                              }`}
                            >
                              {log.label}
                            </p>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="text-[10px] font-medium uppercase text-emerald-300">Creator step</span>
                              <span className="text-[10px] text-blue-300">•</span>
                              <span className="text-[10px] text-blue-300">{log.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center space-x-2">
                          {getStatusIndicator(log.status)}
                          {log.details && (
                            <div className="text-blue-300 transition-colors group-hover:text-white">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </div>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && log.details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden border-t border-teal-300/15 px-4 pb-4 pt-3 text-[11px] leading-relaxed text-blue-200"
                          >
                            {log.details}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-center border-t border-teal-300/15 bg-slate-950/90 p-6">
              <span className="creator-label glowing-navbar-accent !pb-1 text-[9px]">Audience Signals Ready</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
