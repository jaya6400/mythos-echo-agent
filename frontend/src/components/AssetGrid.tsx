"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
        <div className="creator-label flex items-center space-x-1.5">
          <Tag className="w-3 h-3 text-teal-200" />
          <span>SEO Optimization Tags</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-950/70 border border-teal-300/15 rounded-lg">
          {seoMetadataTags.length > 0 ? (
            seoMetadataTags.map((tag, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="px-2.5 py-1 bg-teal-400/10 border border-teal-300/25 text-teal-200 text-xs rounded-full font-medium"
              >
                #{tag}
              </motion.span>
            ))
          ) : (
            <span className="empty-state-text px-1 text-xs">
              {isProcessing ? "Generating tags..." : "No keywords synthesized yet."}
            </span>
          )}
        </div>
      </div>

      {/* Script Window */}
      <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
        <div className="creator-label flex items-center space-x-1.5">
          <FileText className="w-3 h-3 text-teal-200" />
          <span>Generated Production Elements</span>
        </div>
        
        <div className="flex-1 min-h-[250px] bg-slate-950/70 border border-teal-300/20 rounded-xl p-4 overflow-y-auto space-y-4 shadow-inner">
          {isProcessing && scriptSegments.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <motion.div
                  key={n}
                  className="p-4 bg-cyan-950/35 border border-teal-300/10 rounded-lg space-y-2"
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: n * 0.08 }}
                >
                  <div className="h-3.5 bg-teal-300/20 rounded w-24" />
                  <div className="h-3 bg-blue-300/20 rounded w-full" />
                </motion.div>
              ))}
            </div>
          ) : scriptSegments.length > 0 ? (
            scriptSegments.map((segment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="p-4 bg-slate-950/70 border border-teal-300/15 hover:border-teal-300/35 rounded-lg transition-colors"
              >
                <div className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Segment {idx + 1}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                </div>
                <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
                  {segment}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-teal-300/10 rounded-full border border-teal-300/20 text-teal-200 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <p className="empty-state-text">Script viewer empty</p>
            </div>
          )}
          <div ref={scriptEndRef} />
        </div>
      </div>
    </div>
  );
}
