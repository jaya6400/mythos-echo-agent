"use client";

import React, { useState } from "react";
import { LogStep } from "@/components/Sidebar";
import DashboardContainer from "@/components/DashboardContainer";
import ModeToggle from "@/components/ModeToggle";
import QueryForm from "@/components/QueryForm";
import AssetGrid from "@/components/AssetGrid";
import { Sparkles, RefreshCcw, Compass } from "lucide-react";

// Update this to your localtunnel URL when testing publicly
// e.g., "https://poor-horses-own.loca.lt"
const API_BASE_URL = "http://localhost:8000";

export default function Home() {
  // State
  const [mode, setMode] = useState<"orchestrate" | "mcp-bridge">("orchestrate");
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

  const handleReset = () => {
    setInputText("");
    setLanguage("en");
    setPlatform("YouTube");
    setScriptSegments([]);
    setSeoMetadataTags([]);
    setLogs([]);
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
      label: `1. Initializing ${mode === 'orchestrate' ? 'Orchestration' : 'MCP Bridge'}...`,
      time: getLogTime(),
      category: "reasoning",
      details: `Targeting Endpoint: /${mode}\nPayload: ${inputText}`
    };
    setLogs([step1]);

    await new Promise(r => setTimeout(r, 600));
    setLogs(prev => prev.map(l => l.id === "step-1" ? { ...l, status: "success" } : l));

    const step2: LogStep = {
      id: "step-2",
      status: "running",
      label: "2. Invoking Backend Pipeline...",
      time: getLogTime(),
      category: "gateway",
      details: `POST ${API_BASE_URL}/api/v1/mythology/${mode}`
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
        details: "API Handshake Successful." 
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
        label: "3. Synthesis Complete",
        time: getLogTime(),
        category: "analysis",
        details: `Parsed ${formattedSegments.length} segments.`
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
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto justify-center">
      <div className="w-full flex-1 flex flex-col justify-center space-y-6">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between text-center md:text-left">
          <ModeToggle mode={mode} setMode={setMode} disabled={isProcessing} />
          
          <button 
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <DashboardContainer logs={logs} isProcessing={isProcessing}>
          {/* Page Header */}
          <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
            <div className="p-2.5 bg-gradient-to-tr from-accent-purple/20 to-accent-blue/20 rounded-xl border border-accent-purple/30">
              <Sparkles className="w-6 h-6 text-accent-purple" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-slate-100 flex items-center gap-1.5 animate-fade-in">
                Mythos Echo Dashboard 
                <span className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2 py-0.5 rounded font-mono font-normal">v1.1.0</span>
              </h1>
              <p className="text-xs text-slate-400">Component-driven content planning workspace</p>
            </div>
          </div>

          <QueryForm 
            inputText={inputText} setInputText={setInputText}
            language={language} setLanguage={setLanguage}
            platform={platform} setPlatform={setPlatform}
            isProcessing={isProcessing} onSubmit={handleOrchestrate}
          />

          {/* Suggestions */}
          {scriptSegments.length === 0 && !isProcessing && (
            <div className="space-y-2.5 animate-fade-in">
              <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Sample Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Explain the power of Thor's hammer Mjolnir", "en", "YouTube")}
                  className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-lg text-left text-xs text-slate-300 transition-all"
                >
                  <span className="font-semibold text-accent-purple block mb-0.5">Norse Mythology</span>
                  <span className="text-slate-400">Explain the power of Thor's hammer Mjolnir (EN, YT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Detail Vayu wind speed attributes", "en", "TikTok")}
                  className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-lg text-left text-xs text-slate-300 transition-all"
                >
                  <span className="font-semibold text-accent-amber block mb-0.5">Hindu Mythology</span>
                  <span className="text-slate-400">Detail Vayu wind speed attributes (EN, TikTok)</span>
                </button>
              </div>
            </div>
          )}
          
          <AssetGrid 
            scriptSegments={scriptSegments} 
            seoMetadataTags={seoMetadataTags} 
            isProcessing={isProcessing} 
          />
        </DashboardContainer>
      </div>
    </main>
  );
}
