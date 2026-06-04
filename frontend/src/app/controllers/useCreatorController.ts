import { useState, useEffect, useRef } from "react";
import { LogStep } from "@/components/Sidebar";
import { CreatorAsset } from "../types";
import { fetchCreatorAsset, API_BASE_URL } from "./api";
import { parseCreatorAssets, filterSegmentsForLanguage } from "./parserHelpers";

export default function useCreatorController() {
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

  const triggerResearchBoost = async () => {
    const queryText = inputText.trim();
    if (isProcessing || !queryText) return;

    setIsProcessing(true);
    setScriptSegments([]);
    setSeoMetadataTags([]);

    const step1: LogStep = {
      id: "step-1",
      status: "running",
      label: "Initiating Research Boost...",
      time: getLogTime(),
      category: "gateway",
      details: `Searching Elasticsearch index for translated creator asset: "${queryText}"`,
    };
    setLogs([step1]);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const asset = await fetchCreatorAsset(queryText, language, platform);
      if (asset) {
        setScriptSegments([asset]);
        setSeoMetadataTags(asset.metadataTags || []);
        
        setLogs([
          {
            id: "step-1",
            status: "success",
            label: "Research Boost complete",
            time: getLogTime(),
            category: "gateway",
            details: `Successfully fetched asset for "${queryText}".`,
          },
          {
            id: "step-2",
            status: "success",
            label: "Asset loaded",
            time: getLogTime(),
            category: "analysis",
            details: `Platform: ${platform}, Language: ${language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : 'English'}.`,
          }
        ]);
      } else {
        throw new Error(`No creator asset found for "${queryText}"`);
      }
    } catch (error: any) {
      console.error("Research Boost failed:", error);
      setLogs([
        {
          id: "step-1",
          status: "error",
          label: "Research Boost failed",
          time: getLogTime(),
          category: "gateway",
          details: error.message || "Failed to retrieve creator asset from backend.",
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrchestrate = async () => {
    const queryText = inputText.trim();
    if (!queryText || isProcessing) return;

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
      const response = await fetch(`${API_BASE_URL}/api/v1/mythology/orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({
          user_prompt: queryText,
          language,
          creator_platform: platform,
        }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();

      let data = result.data;
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    if (mode === "mcp-bridge") {
      await triggerResearchBoost();
    } else {
      await handleOrchestrate();
    }
  };

  const prevModeRef = useRef(mode);
  const prevLanguageRef = useRef(language);
  const prevPlatformRef = useRef(platform);

  useEffect(() => {
    const isModeChanged = prevModeRef.current !== mode;
    const isLanguageChanged = prevLanguageRef.current !== language;
    const isPlatformChanged = prevPlatformRef.current !== platform;

    prevModeRef.current = mode;
    prevLanguageRef.current = language;
    prevPlatformRef.current = platform;

    if (mode === "mcp-bridge" && inputText.trim().length >= 5) {
      if (isModeChanged || isLanguageChanged || isPlatformChanged) {
        triggerResearchBoost();
      }
    }
  }, [mode, language, platform]);

  return {
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
  };
}
