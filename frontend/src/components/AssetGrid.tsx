"use client";

import React, { useRef, useEffect } from "react";
import { Tag, FileText } from "lucide-react";

interface AssetGridProps {
  scriptSegments: string[];
  seoMetadataTags: string[];
  isProcessing: boolean;
}

export default function AssetGrid({ scriptSegments, seoMetadataTags, isProcessing }: AssetGridProps) {
  const scriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scriptSegments.length > 0) {
      scriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [scriptSegments]);

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <Tag className="w-3 h-3 text-slate-500" />
          <span>SEO Metadata Tags</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-900/30 border border-white/5 rounded-lg">
          {seoMetadataTags.length > 0 ? (
            seoMetadataTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs rounded-full font-medium animate-fade-in"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500 italic px-1">
              {isProcessing ? "Generating tags..." : "No keywords synthesized yet."}
            </span>
          )}
        </div>
      </div>

      {/* Script Window */}
      <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          <FileText className="w-3 h-3 text-slate-500" />
          <span>Generated Script Chapters</span>
        </div>
        
        <div className="flex-1 min-h-[250px] bg-slate-900/40 border border-white/10 rounded-xl p-4 overflow-y-auto space-y-4 shadow-inner">
          {isProcessing && scriptSegments.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <div className="h-3.5 bg-slate-800 rounded w-24" />
                  <div className="h-3 bg-slate-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : scriptSegments.length > 0 ? (
            scriptSegments.map((segment, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 border border-white/5 hover:border-white/10 rounded-lg transition-all animate-fade-in"
              >
                <div className="text-[10px] font-mono text-accent-blue uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Segment {idx + 1}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {segment}
                </p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500 text-center">
              <div className="p-3 bg-white/5 rounded-full border border-white/10 text-slate-600 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-slate-400">Script viewer empty</p>
            </div>
          )}
          <div ref={scriptEndRef} />
        </div>
      </div>
    </div>
  );
}