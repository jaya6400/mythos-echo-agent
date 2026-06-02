"use client";

import { motion } from "framer-motion";
import { Sparkles, Compass, Globe, Play } from "lucide-react";

interface LandingViewProps {
  onEnter: () => void;
}

export default function LandingView({ onEnter }: LandingViewProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-6xl rounded-[32px] border border-teal-300/10 bg-slate-900/85 backdrop-blur-xl shadow-2xl shadow-slate-950/40"
      >
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] p-8 md:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
              <Sparkles className="w-4 h-4" /> Creative AI Studio
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Mythos Echo Agent
              </h1>
              <p className="max-w-xl text-slate-300 text-base leading-8 sm:text-lg">
                Step into a cinematic creator portal that blends Elastic MCP search, Gemini-powered script generation, and multilingual lore context into ready-to-share content blocks.
              </p>
            </div>
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={onEnter}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                <Play className="w-4 h-4" /> Enter Creator Workspace
              </button>
              <span className="text-sm text-slate-400">
                No route change required — one smooth app transition.
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Immersive Showcase Tiles",
                description: "Interactive creative prompts and live catalogs keep the launch experience cinematic.",
                icon: Compass,
              },
              {
                title: "Multilingual Content Blocks",
                description: "Auto-extract hooks, narration scripts, and hashtag groups from folklore fragments.",
                icon: Globe,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 * idx }}
                  className="rounded-3xl border border-teal-300/10 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/20"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">{feature.title}</h2>
                  <p className="mt-2 text-slate-400 text-sm leading-6">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
