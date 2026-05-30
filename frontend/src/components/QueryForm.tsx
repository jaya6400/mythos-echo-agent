"use client";

import React from "react";
import { Globe, Video, Wand2, Loader2 } from "lucide-react";

interface QueryFormProps {
  inputText: string;
  setInputText: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  platform: string;
  setPlatform: (val: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function QueryForm({
  inputText,
  setInputText,
  language,
  setLanguage,
  platform,
  setPlatform,
  isProcessing,
  onSubmit
}: QueryFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Select */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-500" /> Index Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all"
          >
            <option value="en">English (mythology-dataset-en)</option>
            <option value="hi">Hindi (mythology-dataset-hi)</option>
          </select>
        </div>

        {/* Creator Platform */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Video className="w-3 h-3 text-slate-500" /> Target Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all"
          >
            <option value="YouTube">YouTube Video Script</option>
            <option value="TikTok">TikTok Short Form</option>
            <option value="Instagram">Instagram Reels Narrative</option>
            <option value="Podcast">Audio Podcast Overview</option>
          </select>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter mythology prompt..."
          disabled={isProcessing}
          required
          minLength={5}
          className="w-full bg-slate-900/80 border border-white/15 rounded-xl py-3.5 pl-4 pr-14 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="absolute right-2 p-2 bg-accent-blue hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-md"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}