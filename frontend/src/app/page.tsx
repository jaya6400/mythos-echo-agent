"use client";

import React from "react";
import { motion } from "framer-motion";
import DashboardContainer from "@/components/DashboardContainer";
import ModeToggle from "@/components/ModeToggle";
import QueryForm from "@/components/QueryForm";
import AssetGrid from "@/components/AssetGrid";
import { Sparkles, Compass } from "lucide-react";
import useCreatorController from "./controllers/useCreatorController";

export default function Home() {
  const {
    mode,
    setMode,
    inputText,
    setInputText,
    language,
    setLanguage,
    platform,
    setPlatform,
    isProcessing,
    scriptSegments,
    seoMetadataTags,
    logs,
    handleSuggestionClick,
    onSubmit,
  } = useCreatorController();

  return (
    <main className="studio-container selection:bg-teal-500/30">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="studio-shell"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
          className="flex items-center justify-between text-center md:text-left"
        >
          <div className="flex items-center space-x-6">
            <h2 className="glowing-navbar-accent creator-label !mb-0 !text-sm">Content Generation Pipeline</h2>
            <ModeToggle mode={mode} setMode={setMode} disabled={isProcessing} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.14 }}
        >
          <DashboardContainer logs={logs} isProcessing={isProcessing}>
            <div className="studio-header">
              <Sparkles className="w-6 h-6 text-teal-400" />
              <h1 className="font-bold text-xl tracking-wide text-slate-100 uppercase">Video Script Generator</h1>
            </div>

            <QueryForm
              inputText={inputText}
              setInputText={setInputText}
              language={language}
              setLanguage={setLanguage}
              platform={platform}
              setPlatform={setPlatform}
              isProcessing={isProcessing}
              onSubmit={onSubmit}
            />

            {scriptSegments.length === 0 && !isProcessing && (
              <motion.div
                className="space-y-2.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              >
                <p className="creator-label flex items-center gap-1.5 !text-teal-400">
                  <Compass className="w-3.5 h-3.5" /> Creator Workspace Inspiration
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("Explain the power of Thor's hammer Mjolnir", "en", "YouTube")}
                    className="media-card p-6 text-left group"
                  >
                    <span className="media-card__hook block mb-2 group-hover:translate-x-1 transition-transform">Norse Mythology</span>
                    <span className="text-blue-200">Explain the power of Thor's hammer Mjolnir for YouTube.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("Detail Vayu wind speed attributes", "en", "TikTok")}
                    className="media-card p-6 text-left group"
                  >
                    <span className="media-card__hook !text-amber-400 block mb-2 group-hover:translate-x-1 transition-transform">Hindu Mythology</span>
                    <span className="text-blue-200">Detail Vayu wind speed attributes for a TikTok story.</span>
                  </button>
                </div>
              </motion.div>
            )}

            <AssetGrid
              scriptSegments={scriptSegments}
              seoMetadataTags={seoMetadataTags}
              isProcessing={isProcessing}
              targetLanguage={language}
            />
          </DashboardContainer>
        </motion.div>
      </motion.div>
    </main>
  );
}
