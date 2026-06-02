"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, FileText, Sparkles, Hash } from "lucide-react";

interface AssetBlock {
  hook: string;
  narrative: string;
  metadataTags: string[];
  language: string;
  sourceSnippet: string;
}

interface AssetGridProps {
  scriptSegments: Array<string | AssetBlock>;
  seoMetadataTags: string[];
  isProcessing: boolean;
  targetLanguage: string;
}

const LANGUAGE_SCRIPT_REGEX: Record<string, RegExp> = {
  hi: /[\u0900-\u097f]/,
  ta: /[\u0b80-\u0bff]/,
};

const normalizeTargetLanguage = (targetLanguage: string) => targetLanguage?.toLowerCase()?.trim() || "en";

const isTargetLanguageText = (text: string, targetLanguage: string): boolean => {
  if (!text) return false;
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const scriptRegex = LANGUAGE_SCRIPT_REGEX[normalizedTarget];
  if (scriptRegex) return scriptRegex.test(text);
  return !Object.values(LANGUAGE_SCRIPT_REGEX).some((regex) => regex.test(text));
};

const extractTargetLanguageLines = (text: string, targetLanguage: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => isTargetLanguageText(line, targetLanguage));

const normalizeText = (item: any): string => {
  if (!item && item !== "") return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if (item.hook && item.narrative && Array.isArray(item.metadataTags)) {
      return `${item.hook}\n\n${item.narrative}`;
    }
    if (item.text) return String(item.text);
    if (item.description) return String(item.description);
    if (item.source) return String(item.source);
    if (item._source) return normalizeText(item._source);
    if (item.content && typeof item.content === "string") return item.content;
    return "";
  }
  return String(item);
};

const detectLanguageHint = (text: string): string => {
  if (LANGUAGE_SCRIPT_REGEX.hi.test(text)) return "Hindi";
  if (LANGUAGE_SCRIPT_REGEX.ta.test(text)) return "Tamil";
  return "English";
};

const extractHook = (text: string): string => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "Create a captivating hook for your short-form story.";

  const candidate = lines[0].length <= 140 ? lines[0] : lines[0].slice(0, 140);
  const sentenceDivider = candidate.match(/([.!?\u0964])/);

  if (sentenceDivider) {
    const index = candidate.indexOf(sentenceDivider[1]) + 1;
    return candidate.slice(0, index).trim();
  }

  return candidate;
};

const extractNarrative = (text: string): string => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return lines[0] || "A compact creator narrative optimized for pacing, emotion, and multilingual context.";
  }
  return lines.slice(1).join(" ");
};

const extractTags = (text: string, fallbackTags: string[]): string[] => {
  const explicitMatches = text.match(/#([^\s#]+)/g) || [];
  const explicit = Array.from(new Set(explicitMatches.map((tag) => tag.slice(1).toLowerCase()))).filter(Boolean);
  if (explicit.length > 0) {
    return explicit.slice(0, 16);
  }

  const hasNativeScript = Object.values(LANGUAGE_SCRIPT_REGEX).some((regex) => regex.test(text));
  if (hasNativeScript) {
    const tokens = Array.from(
      new Set(
        text
          .replace(/[\u0964\u0965,;:\-/\\"'()[\]{}|]/g, " ")
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length > 1 && /[A-Za-z0-9\u0900-\u097f\u0b80-\u0bff]/.test(token))
      )
    );
    if (tokens.length > 0) {
      return tokens.slice(0, 12).map((tag) => tag.toLowerCase().replace(/^#/, ""));
    }
    return fallbackTags.map((tag) => tag.toLowerCase().replace(/^#/, "")).slice(0, 16);
  }

  const words = Array.from(
    new Set(
      (text.match(/\b([A-Za-z]{3,})\b/g) || [])
        .map((w) => w.toLowerCase())
        .slice(0, 12)
    )
  );

  const fallback = fallbackTags.map((tag) => tag.toLowerCase().replace(/^#/, ""));
  return Array.from(new Set([...explicit, ...words, ...fallback])).slice(0, 16);
};

const buildAssetBlocks = (
  scriptSegments: Array<string | AssetBlock>,
  fallbackTags: string[],
  targetLanguage: string
): AssetBlock[] => {
  const items = scriptSegments.flatMap<string | AssetBlock>((segment) => {
    if (typeof segment === "object" && segment.hook && segment.narrative && Array.isArray(segment.metadataTags)) {
      return isTargetLanguageText(`${segment.hook}\n${segment.narrative}`, targetLanguage) ? [segment] : [];
    }
    const maybeRaw = segment as AssetBlock & { raw?: unknown };
    if (typeof maybeRaw === "object" && typeof maybeRaw.raw === "string") {
      return extractTargetLanguageLines(maybeRaw.raw, targetLanguage);
    }

    const raw = normalizeText(segment);
    if (!raw.trim()) return [];

    const languageLines = extractTargetLanguageLines(raw, targetLanguage);
    const cleaned = languageLines.length > 0 ? languageLines.join("\n") : "";
    if (!cleaned) return [];

    const parsed = cleaned
      .split(/\r?\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    return parsed.length === 0 ? [cleaned] : parsed;
  });

  return items.map((rawText) => {
    const text = normalizeText(rawText);
    return {
      hook: extractHook(text),
      narrative: extractNarrative(text),
      metadataTags: extractTags(text, fallbackTags),
      language: detectLanguageHint(text),
      sourceSnippet: text,
    };
  });
};

export default function AssetGrid({ scriptSegments, seoMetadataTags, isProcessing, targetLanguage }: AssetGridProps) {
  const scriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scriptSegments.length > 0) {
      scriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [scriptSegments]);

  const assetBlocks = useMemo(
    () => buildAssetBlocks(scriptSegments, seoMetadataTags, targetLanguage),
    [scriptSegments, seoMetadataTags, targetLanguage]
  );

  const aggregatedTags = useMemo(() => {
    const blockTags = assetBlocks.flatMap((block) => block.metadataTags);
    return Array.from(new Set([...blockTags, ...seoMetadataTags.map((tag) => tag.toLowerCase())])).slice(0, 20);
  }, [assetBlocks, seoMetadataTags]);

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      <div className="space-y-2">
        <div className="creator-label flex items-center space-x-1.5">
          <Tag className="w-3 h-3 text-teal-200" />
          <span>Creator-ready Content Blocks</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-950/70 border border-teal-300/15 rounded-lg">
          {aggregatedTags.length > 0 ? (
            aggregatedTags.map((tag, idx) => (
              <motion.span
                key={`${tag}-${idx}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="px-2.5 py-1 bg-teal-400/10 border border-teal-300/25 text-teal-200 text-xs rounded-full font-medium"
              >
                #{tag}
              </motion.span>
            ))
          ) : (
            <span className="empty-state-text px-1 text-xs">
              {isProcessing ? "Synthesizing creator hashtags..." : "No creator hashtag tags available yet."}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
        <div className="creator-label flex items-center space-x-1.5">
          <FileText className="w-3 h-3 text-teal-200" />
          <span>Hook + Narrative Engine</span>
        </div>

        <div className="flex-1 min-h-[250px] bg-slate-950/70 border border-teal-300/20 rounded-xl p-4 overflow-y-auto space-y-4 shadow-inner">
          {isProcessing && assetBlocks.length === 0 ? (
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
          ) : assetBlocks.length > 0 ? (
            assetBlocks.map((block, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="space-y-4 rounded-3xl border border-teal-300/15 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/10"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-teal-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{block.language} Creator Block</span>
                    </div>
                    <p className="font-semibold text-slate-100">Hook</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{block.hook}</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950/90 p-4 border border-slate-700/80">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-300 mb-2">Core Narrative</p>
                  <p className="text-sm text-slate-200 leading-7 whitespace-pre-wrap">{block.narrative}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {block.metadataTags.slice(0, 8).map((tag, index) => (
                    <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-teal-300/15 bg-teal-400/10 px-3 py-1 text-[11px] text-teal-100">
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-teal-300/10 rounded-full border border-teal-300/20 text-teal-200 mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <p className="empty-state-text">No content blocks could be extracted yet.</p>
              <p className="mt-2 text-xs text-slate-400">Try a new prompt or verify your backend pipeline output.</p>
            </div>
          )}
          <div ref={scriptEndRef} />
        </div>
      </div>
    </div>
  );
}
