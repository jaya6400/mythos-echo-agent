"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogStep } from "@/components/Sidebar";
import DashboardContainer from "@/components/DashboardContainer";
import ModeToggle from "@/components/ModeToggle";
import QueryForm from "@/components/QueryForm";
import AssetGrid from "@/components/AssetGrid";
import { Sparkles, Compass } from "lucide-react";

// Update this to your localtunnel URL when testing publicly
// e.g., "https://poor-horses-own.loca.lt"
const API_BASE_URL = "http://localhost:8000";

export default function Home() {
  // State
  const [mode, setMode] = useState<"orchestrate" | "mcp-bridge">("orchestrate"); // Internally same, UI changed
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("en");
  const [platform, setPlatform] = useState("YouTube");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptSegments, setScriptSegments] = useState<string[]>([]);
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
      details: "Choosing the best story shape for this format."
    };
    setLogs([step1]);

    await new Promise(r => setTimeout(r, 600));
    setLogs(prev => prev.map(l => l.id === "step-1" ? { ...l, status: "success" } : l));

    const step2: LogStep = {
      id: "step-2",
      status: "running",
      label: "Drafting your script...",
      time: getLogTime(),
      category: "gateway",
      details: "Building a clear hook, pace, and scene flow for creators."
    };
    setLogs(prev => [...prev, step2]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/mythology/${mode}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "bypass-tunnel-reminder": "true" 
        },
        body: mode === "orchestrate" 
          ? JSON.stringify({
              user_prompt: inputText,
              language: language,
              creator_platform: platform,
            })
          : JSON.stringify({ 
              user_prompt: inputText,
              language: language 
            }), // Match Agent Studio Tool Schema + Context
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();
      
      // Branch data extraction: Orchestrate wraps in .data
      // We also handle JSON-RPC response unwrapping for the MCP bridge
      let data = mode === "orchestrate" ? result.data : result;
      if (data?.jsonrpc === "2.0" && data.result) {
        data = data.result;
      }

      // Check for MCP-level errors returned in the result object
      if (data?.isError) {
        const errorMsg = data.content?.[0]?.text || "Unknown MCP Error";
        throw new Error(`MCP Tool Error: ${errorMsg}`);
      }

      setLogs(prev => prev.map(l => l.id === "step-2" ? { 
        ...l, 
        status: "success", 
        details: "Useful story context found and shaped for the selected platform." 
      } : l));

      // Enhanced Robust Data Parser to handle pipeline results, MCP content blocks, and raw Elastic hits
      let rawSegments = data.script_segments || data.assets || data.content;
      
      if (!rawSegments) {
        if (Array.isArray(data)) rawSegments = data;
        else if (data.hits?.hits) rawSegments = data.hits.hits;
        else rawSegments = [];
      }

      const formattedSegments = (Array.isArray(rawSegments) ? rawSegments : []).flatMap((item: any) => {
        if (typeof item === 'string') return [item];
        
        // Handle MCP Content blocks that might contain stringified JSON results
        if (item.type === 'text' && item.text) {
          try {
            const nested = JSON.parse(item.text);
            // Deep dive into Elastic MCP Resource List format
            if (nested.results) {
              return nested.results.flatMap((res: any) => 
                res.data?.resources?.map((r: any) => {
                  const snippets = r.content?.snippets || [];
                  // Sort by length to pick the most descriptive snippet (the full vector text)
                  return snippets.sort((a: string, b: string) => b.length - a.length)[0] || "No content available";
                }) || []
              );
            }
          } catch (e) {
            // If not JSON, fall through to returning raw text
          }
          return [item.text];
        }
        
        // Handle Elastic search hit objects
        if (item._source) return [item._source.description || item._source.vector_text || JSON.stringify(item._source)];
        return [JSON.stringify(item)];
      });
      
      setScriptSegments(formattedSegments);
      setSeoMetadataTags(data.seo_metadata_tags || []);

      const step3: LogStep = {
        id: "step-3",
        status: "success",
        label: "Ready to refine",
        time: getLogTime(),
        category: "analysis",
        details: "Review the script beats, tags, and production notes."
      };
      setLogs(prev => [...prev, step3]);
    } catch (error: any) {
      console.error("API Integration failed:", error);
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last) {
          return prev.map(l => l.id === last.id ? { 
            ...l, 
            status: "error", 
            details: `Integration failed: ${error.message}\nEnsure your FastAPI server is online at ${API_BASE_URL}.` 
          } : l);
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
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="studio-shell"
      >
        {/* Simplified Controls */}
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
            inputText={inputText} setInputText={setInputText}
            language={language} setLanguage={setLanguage}
            platform={platform} setPlatform={setPlatform}
            isProcessing={isProcessing} onSubmit={handleOrchestrate}
          />

          {/* Suggestions */}
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
          />
          </DashboardContainer>
        </motion.div>
      </motion.div>
    </main>
  );
}
