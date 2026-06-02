"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogStep } from "@/components/Sidebar";
import DashboardContainer from "@/components/DashboardContainer";
import ModeToggle from "@/components/ModeToggle";
import QueryForm from "@/components/QueryForm";
import AssetGrid from "@/components/AssetGrid";
import { Sparkles, Compass } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

type CreatorAsset = {
  hook: string;
  narrative: string;
  metadataTags: string[];
  language: string;
  sourceSnippet: string;
};

const LANGUAGE_SCRIPT_REGEX: Record<string, RegExp> = {
  hi: /[\u0900-\u097f]/,
  ta: /[\u0b80-\u0bff]/,
};

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeTargetLanguage = (targetLanguage: string) => targetLanguage?.toLowerCase()?.trim() || "en";

const containsTargetScript = (text: string, targetLanguage: string) => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const scriptRegex = LANGUAGE_SCRIPT_REGEX[normalizedTarget];
  if (scriptRegex) return scriptRegex.test(text);
  return !Object.values(LANGUAGE_SCRIPT_REGEX).some((regex) => regex.test(text));
};

const detectLanguageHint = (text: string) => {
  if (LANGUAGE_SCRIPT_REGEX.hi.test(text)) return "Hindi";
  if (LANGUAGE_SCRIPT_REGEX.ta.test(text)) return "Tamil";
  return "English";
};

const normalizeAttributeTokens = (text: string) =>
  text
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^#/, "").replace(/[^A-Za-z0-9_\u0900-\u097f\u0b80-\u0bff]+/g, ""));

const isTargetLanguageText = (text: string, targetLanguage: string) => {
  if (!text) return false;
  return containsTargetScript(text, targetLanguage);
};

const extractTargetLanguageLines = (text: string, targetLanguage: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => isTargetLanguageText(line, targetLanguage));

const createCreatorAsset = (
  name: string,
  pantheon: string,
  attributes: string,
  description: string,
  sourceSnippet: string,
  targetLanguage: string = "en"
): CreatorAsset => {
  const tagCandidates = normalizeAttributeTokens(attributes);
  const elementTags = [name, pantheon, ...tagCandidates]
    .filter(Boolean)
    .map((item) => item.toLowerCase().replace(/[^A-Za-z0-9_\u0900-\u097f\u0b80-\u0bff]+/g, ""))
    .slice(0, 12);

  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  if (normalizedTarget !== "en") {
    const nativeText = [name, description].filter(Boolean).join(": ");
    return {
      hook: description || nativeText || sourceSnippet,
      narrative: sourceSnippet || nativeText || description,
      metadataTags: Array.from(new Set(elementTags)),
      language: detectLanguageHint(sourceSnippet),
      sourceSnippet,
    };
  }

  const attributePhrase = attributes || "legendary traits";
  return {
    hook: `${name} is a ${pantheon || "mythology"} icon with ${attributePhrase} - built for a fast, high-impact creator hook.`,
    narrative: `Bring ${name} to life with a dynamic voiceover: from the ${pantheon || "mythology"} heritage, through ${attributePhrase.toLowerCase()}, into a cinematic moment. ${description}`,
    metadataTags: Array.from(new Set(elementTags)),
    language: detectLanguageHint(sourceSnippet),
    sourceSnippet,
  };
};

const extractMetadataRows = (text: string, targetLanguage: string): CreatorAsset[] => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const rows = extractTargetLanguageLines(text, targetLanguage);
  const pattern = /Name:\s*(.+?)\s*\|\s*Pantheon:\s*(.+?)\s*\|\s*Attributes:\s*(.+?)\s*\|\s*Description:\s*(.+)/i;
  const localizedNamePattern = /Name\s*(?:\((?:hi|hindi|ta|tamil)\))?\s*:\s*([^|]+)/i;
  const localizedDescriptionPattern = /Description\s*(?:\((?:hi|hindi|ta|tamil)\))?\s*:\s*(.+)/i;
  const assets: CreatorAsset[] = [];

  for (const row of rows) {
    const match = row.match(pattern);
    if (match) {
      const [, name, pantheon, attributes, description] = match;
      assets.push(createCreatorAsset(name, pantheon, attributes, description, row, targetLanguage));
      continue;
    }

    const name = row.match(localizedNamePattern)?.[1]?.trim() || "";
    const description = row.match(localizedDescriptionPattern)?.[1]?.trim() || row;
    if (normalizedTarget !== "en" && description && isTargetLanguageText(description, targetLanguage)) {
      assets.push(createCreatorAsset(name, "", "", description, row, targetLanguage));
    }
  }

  return assets;
};

const findTranslationPayload = (payload: any, targetLanguage: string): any | null => {
  if (!payload || typeof payload !== "object") return null;

  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const aliases: Record<string, string[]> = {
    en: ["en", "english"],
    hi: ["hi", "hindi"],
    ta: ["ta", "tamil"],
  };
  const preferred = aliases[normalizedTarget] || [normalizedTarget];

  const translationSources = payload.translations ?? payload.translation ?? payload.translated ?? payload.translated_text;
  if (!translationSources) return null;

  if (typeof translationSources === "string") {
    return translationSources;
  }

  if (Array.isArray(translationSources)) {
    for (const item of translationSources) {
      if (item && typeof item === "object") {
        const langValue = (item.language || item.lang || item.locale || "").toString().toLowerCase();
        if (preferred.includes(langValue)) {
          return item.text ?? item.content ?? item.description ?? item.name ?? item;
        }
      }
    }
    return translationSources[0] ?? null;
  }

  if (typeof translationSources === "object") {
    for (const alias of preferred) {
      if (alias in translationSources) {
        return translationSources[alias];
      }
    }

    for (const key of Object.keys(translationSources)) {
      if (preferred.some((alias) => key.toLowerCase().includes(alias))) {
        return translationSources[key];
      }
    }

    return translationSources;
  }

  return null;
};

const flattenResponse = (payload: any, targetLanguage: string): any[] => {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    const languageSpecific = payload.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        ((item.language && item.language.toString().toLowerCase() === targetLanguage) ||
          (item.lang && item.lang.toString().toLowerCase() === targetLanguage) ||
          (item.locale && item.locale.toString().toLowerCase() === targetLanguage))
    );
    return (languageSpecific.length > 0 ? languageSpecific : payload).flatMap((item) => flattenResponse(item, targetLanguage));
  }

  if (typeof payload === "string") {
    const parsed = safeJsonParse(payload);
    if (parsed && parsed !== payload) {
      return flattenResponse(parsed, targetLanguage);
    }
    return [payload];
  }

  if (typeof payload === "object") {
    const translationPayload = findTranslationPayload(payload, targetLanguage);
    if (translationPayload) {
      return flattenResponse(translationPayload, targetLanguage);
    }

    if (payload.results) return flattenResponse(payload.results, targetLanguage);
    if (payload.data) return flattenResponse(payload.data, targetLanguage);
    if (payload.result) return flattenResponse(payload.result, targetLanguage);
    if (payload.content) return flattenResponse(payload.content, targetLanguage);
    if (payload.resources) return flattenResponse(payload.resources, targetLanguage);
    if (payload.snippets) return flattenResponse(payload.snippets, targetLanguage);
    if (payload.text) return flattenResponse(payload.text, targetLanguage);
    if (payload._source) return flattenResponse(payload._source, targetLanguage);
    if (payload.raw) return flattenResponse(payload.raw, targetLanguage);

    return [payload];
  }

  return [String(payload)];
};

const parseCreatorAssets = (rawPayload: any, targetLanguage: string = "en"): CreatorAsset[] => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const flattened = flattenResponse(rawPayload, normalizedTarget);
  const assets: CreatorAsset[] = [];

  for (const item of flattened) {
    if (typeof item === "string") {
      assets.push(...extractMetadataRows(item, normalizedTarget));
      continue;
    }

    if (typeof item === "object") {
      if (item.language && typeof item.language === "string" && item.language.toLowerCase().trim() !== normalizedTarget) {
        continue;
      }
      if (item.lang && typeof item.lang === "string" && item.lang.toLowerCase().trim() !== normalizedTarget) {
        continue;
      }

      const snippets = Array.isArray(item.snippets)
        ? item.snippets
        : Array.isArray(item.content?.snippets)
        ? item.content.snippets
        : undefined;

      if (snippets) {
        for (const snippet of snippets) {
          if (typeof snippet === "string") {
            assets.push(...extractMetadataRows(snippet, normalizedTarget));
          }
        }
      }

      if (typeof item.text === "string") {
        assets.push(...extractMetadataRows(item.text, normalizedTarget));
      }

      if (item.name && item.description) {
        const sourceText = [item.name, item.description].filter(Boolean).join(" | ");
        if (!isTargetLanguageText(sourceText, normalizedTarget)) {
          continue;
        }

        assets.push(
          createCreatorAsset(
            String(item.name),
            String(item.pantheon || ""),
            Array.isArray(item.attributes) ? item.attributes.join(", ") : String(item.attributes || ""),
            String(item.description),
            sourceText,
            normalizedTarget
          )
        );
      }
    }
  }

  return assets;
};

const filterSegmentsForLanguage = (segments: any[], targetLanguage: string) =>
  segments
    .flatMap((segment) => {
      if (typeof segment !== "string") return [segment];
      return extractTargetLanguageLines(segment, targetLanguage);
    })
    .filter(Boolean);

export default function Home() {
  const [mode, setMode] = useState<"orchestrate" | "mcp-bridge">("orchestrate");
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("en");
  const [platform, setPlatform] = useState("YouTube");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptSegments, setScriptSegments] = useState<Array<string | CreatorAsset>>([]);
  const [seoMetadataTags, setSeoMetadataTags] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogStep[]>([]);

  const getLogTime = () => new Date().toTimeString().split(" ")[0];

  const handleSuggestionClick = (prompt: string, lang: string, plat: string) => {
    setInputText(prompt);
    setLanguage(lang);
    setPlatform(plat);
  };

  const handleOrchestrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setScriptSegments([]);
    setSeoMetadataTags([]);

    const step1: LogStep = {
      id: "step-1",
      status: "running",
      label: "Preparing creator brief...",
      time: getLogTime(),
      category: "reasoning",
      details: "Choosing the best story shape for this format.",
    };
    setLogs([step1]);

    await new Promise((resolve) => setTimeout(resolve, 600));
    setLogs((prev) => prev.map((l) => (l.id === "step-1" ? { ...l, status: "success" } : l)));

    const step2: LogStep = {
      id: "step-2",
      status: "running",
      label: "Drafting your script...",
      time: getLogTime(),
      category: "gateway",
      details: "Building a clear hook, pace, and story flow for creators.",
    };
    setLogs((prev) => [...prev, step2]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/mythology/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "bypass-tunnel-reminder": "true",
        },
        body:
          mode === "orchestrate"
            ? JSON.stringify({
                user_prompt: inputText,
                language,
                creator_platform: platform,
              })
            : JSON.stringify({
                user_prompt: inputText,
                language,
              }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();

      let data = mode === "orchestrate" ? result.data : result;
      if (data?.jsonrpc === "2.0" && data.result) {
        data = data.result;
      }

      if (data?.isError) {
        const errorMsg = data.content?.[0]?.text || "Unknown MCP Error";
        throw new Error(`MCP Tool Error: ${errorMsg}`);
      }

      setLogs((prev) =>
        prev.map((l) =>
          l.id === "step-2"
            ? {
                ...l,
                status: "success",
                details: "Useful story context found and shaped for the selected platform.",
              }
            : l
        )
      );

      const parsedAssets = parseCreatorAssets(data, language);
      const rawSegments =
        parsedAssets.length > 0
          ? parsedAssets
          : Array.isArray(data.script_segments)
          ? filterSegmentsForLanguage(data.script_segments, language)
          : data.assets || data.content || [];

      setScriptSegments(parsedAssets.length > 0 ? parsedAssets : rawSegments);
      setSeoMetadataTags(data.seo_metadata_tags || []);

      const step3: LogStep = {
        id: "step-3",
        status: "success",
        label: "Ready to refine",
        time: getLogTime(),
        category: "analysis",
        details: "Review the script beats, tags, and production notes.",
      };
      setLogs((prev) => [...prev, step3]);
    } catch (error: any) {
      console.error("API Integration failed:", error);
      setLogs((prev) => {
        const last = prev[prev.length - 1];
        if (last) {
          return prev.map((l) =>
            l.id === last.id
              ? {
                  ...l,
                  status: "error",
                  details: `Integration failed: ${error.message}\nEnsure your FastAPI server is online at ${API_BASE_URL}.`,
                }
              : l
          );
        }
        return prev;
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
              onSubmit={handleOrchestrate}
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
