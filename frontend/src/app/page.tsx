"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogStep } from "@/components/Sidebar";
import DashboardContainer from "@/components/DashboardContainer";
import ModeToggle from "@/components/ModeToggle";
import QueryForm from "@/components/QueryForm";
import AssetGrid from "@/components/AssetGrid";
import { Sparkles, Compass } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type CreatorAsset = {
  hook: string;
  narrative: string;
  metadataTags: string[];
  language: string;
  sourceSnippet: string;
};

type CreatorFields = {
  name: string;
  pantheon: string;
  attributes: string[];
  description: string;
  raw: string;
};

const LANGUAGE_SCRIPT_REGEX: Record<string, RegExp> = {
  hi: /[\u0900-\u097f]/,
  ta: /[\u0b80-\u0bff]/,
};

const RAW_FIELD_LABEL_PATTERN =
  /\b(?:Name|Pantheon|Attributes|Description|Title|Context|Snippet|Text)\s*(?:\((?:hi|hindi|ta|tamil|en|english)\))?\s*:\s*/gi;

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

const cleanRawFieldText = (value: string) =>
  value
    .replace(RAW_FIELD_LABEL_PATTERN, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueClean = (items: string[]) =>
  Array.from(
    new Set(
      items
        .map((item) => cleanRawFieldText(item).replace(/^#/, "").trim())
        .filter(Boolean)
    )
  );

const extractLabeledValue = (text: string, label: string, language?: string) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const languageGroup = language ? `\\((?:${language})\\)` : "(?:\\((?:hi|hindi|ta|tamil|en|english)\\))?";
  const pattern = new RegExp(`${escapedLabel}\\s*${languageGroup}\\s*:\\s*([^|\\n\\r]+)`, "i");
  return text.match(pattern)?.[1]?.trim() || "";
};

const extractLocalizedText = (text: string, targetLanguage: string) => {
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
  const languagePattern = normalizedTarget === "hi" ? "hi|hindi" : normalizedTarget === "ta" ? "ta|tamil" : "en|english";

  const name =
    extractLabeledValue(text, "Name", languagePattern) ||
    extractLabeledValue(text, "Title", languagePattern);
  const description =
    extractLabeledValue(text, "Description", languagePattern) ||
    extractLabeledValue(text, "Text", languagePattern) ||
    extractLabeledValue(text, "Snippet", languagePattern);
  const attributes =
    extractLabeledValue(text, "Attributes", languagePattern) ||
    extractLabeledValue(text, "Powers", languagePattern);
  const pantheon = extractLabeledValue(text, "Pantheon", languagePattern);

  return {
    name: cleanRawFieldText(name),
    pantheon: cleanRawFieldText(pantheon),
    attributes: uniqueClean(attributes.split(/[,|]/)),
    description: cleanRawFieldText(description),
  };
};

const extractEnglishMetadata = (text: string) => {
  const metadataPattern = /Name:\s*(.+?)\s*\|\s*Pantheon:\s*(.+?)\s*\|\s*Attributes:\s*(.+?)\s*\|\s*Description:\s*(.+?)(?=\s*\|\s*Name\s*\(|$)/i;
  const match = text.match(metadataPattern);
  if (!match) {
    return {
      name: cleanRawFieldText(extractLabeledValue(text, "Name")),
      pantheon: cleanRawFieldText(extractLabeledValue(text, "Pantheon")),
      attributes: uniqueClean(extractLabeledValue(text, "Attributes").split(/[,|]/)),
      description: cleanRawFieldText(extractLabeledValue(text, "Description")),
    };
  }

  const [, name, pantheon, attributes, description] = match;
  return {
    name: cleanRawFieldText(name),
    pantheon: cleanRawFieldText(pantheon),
    attributes: uniqueClean(attributes.split(/[,|]/)),
    description: cleanRawFieldText(description),
  };
};

const translateTokenToHindi = (token: string) => {
  const normalized = token.toLowerCase().trim();
  // Translation now happens on the backend
  return "";
};

const buildHindiTags = (fields: CreatorFields) => {
  // Translation now happens on the backend via /creator-asset endpoint
  return uniqueClean(["पौराणिककथा", "देवकथा"]).slice(0, 12);
};

const createHindiCreatorAsset = (fields: CreatorFields): CreatorAsset => {
  // This function is deprecated - use backend /creator-asset endpoint instead
  const name = fields.name || "यह देवता";
  const pantheon = fields.pantheon || "पौराणिक कथा";
  const description = fields.description || `${name} से जुडी यह कथा रहस्य, शक्ति और गति से भरपूर है।`;
  
  return {
    hook: `⚡ वायरल वीडियो हुक: ${name}`,
    narrative: `आज की कहानी '${name}' की है। ${description}`,
    metadataTags: buildHindiTags(fields),
    language: "Hindi",
    sourceSnippet: fields.raw,
  };
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

  // Use backend translation service for non-English languages
  const normalizedTarget = normalizeTargetLanguage(targetLanguage);
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
  const assets: CreatorAsset[] = [];

  // For non-English languages, try to extract from localized text first
  if (normalizedTarget === "hi" || normalizedTarget === "ta") {
    const localized = extractLocalizedText(text, normalizedTarget);
    if (localized.name || localized.description) {
      assets.push(createCreatorAsset(localized.name, localized.pantheon, localized.attributes.join(", "), localized.description, text, normalizedTarget));
      return assets;
    }
  }

  // Otherwise extract from English metadata format
  const english = extractEnglishMetadata(text);
  if (english.name || english.description) {
    assets.push(createCreatorAsset(english.name, english.pantheon, english.attributes.join(", "), english.description, text, normalizedTarget));
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
    if (payload.script_segments) return flattenResponse(payload.script_segments, targetLanguage);
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
  const seen = new Set<string>();

  for (const item of flattened) {
    if (typeof item === "string") {
      for (const asset of extractMetadataRows(item, normalizedTarget)) {
        const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
        if (!seen.has(key)) {
          seen.add(key);
          assets.push(asset);
        }
      }
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
            for (const asset of extractMetadataRows(snippet, normalizedTarget)) {
              const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
              if (!seen.has(key)) {
                seen.add(key);
                assets.push(asset);
              }
            }
          }
        }
      }

      if (typeof item.text === "string") {
        for (const asset of extractMetadataRows(item.text, normalizedTarget)) {
          const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
          if (!seen.has(key)) {
            seen.add(key);
            assets.push(asset);
          }
        }
      }

      if (item.name && item.description) {
        const sourceText = [item.name, item.description].filter(Boolean).join(" | ");
        if (!isTargetLanguageText(sourceText, normalizedTarget)) {
          continue;
        }

        const asset = createCreatorAsset(
          String(item.name),
          String(item.pantheon || ""),
          Array.isArray(item.attributes) ? item.attributes.join(", ") : String(item.attributes || ""),
          String(item.description),
          sourceText,
          normalizedTarget
        );
        const key = `${asset.language}:${asset.hook}:${asset.narrative}`;
        if (!seen.has(key)) {
          seen.add(key);
          assets.push(asset);
        }
      }
    }
  }

  return assets;
};

const filterSegmentsForLanguage = (segments: any[], targetLanguage: string) =>
  segments
    .flatMap((segment) => {
      if (typeof segment !== "string") return [segment];
      return extractTargetLanguageLines(segment, targetLanguage).map(cleanRawFieldText).filter(Boolean);
    })
    .filter(Boolean);

/**
 * Fetch creator asset with translations from backend API
 * Queries the Elasticsearch index for entity translations
 */
const fetchCreatorAsset = async (
  entityName: string,
  targetLanguage: string = "en",
  platform: string = "YouTube"
): Promise<CreatorAsset | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/mythology/creator-asset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true",
      },
      body: JSON.stringify({
        entity_name: entityName,
        target_language: targetLanguage,
        creator_platform: platform,
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch creator asset for ${entityName}: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result.status === "success" && result.data) {
      return result.data as CreatorAsset;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching creator asset for ${entityName}:`, error);
    return null;
  }
};

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
      let finalAssets: Array<string | CreatorAsset> = [];

      // For non-English languages, fetch proper backend translations for identified entities
      if (language !== "en" && Array.isArray(data.entity_names) && data.entity_names.length > 0) {
        for (const entityName of data.entity_names) {
          if (entityName && entityName.trim()) {
            const translatedAsset = await fetchCreatorAsset(entityName.trim(), language, platform);
            if (translatedAsset) {
              finalAssets.push(translatedAsset);
            }
          }
        }
      }

      // If no translations fetched from entity names, use parsed assets
      if (finalAssets.length === 0) {
        finalAssets =
          parsedAssets.length > 0
            ? parsedAssets
            : Array.isArray(data.script_segments)
            ? filterSegmentsForLanguage(data.script_segments, language)
            : data.assets || data.content || [];
      }

      setScriptSegments(finalAssets);
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
