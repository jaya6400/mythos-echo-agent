"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar, { LogStep } from "@/components/Sidebar";
import { 
  Sparkles, 
  Wand2, 
  RefreshCcw, 
  Loader2, 
  Send, 
  Globe, 
  Video, 
  FileText, 
  Tag, 
  Compass 
} from "lucide-react";

export default function Home() {
  // Creator Form Settings State
  const [inputText, setInputText] = useState("");
  const [language, setLanguage] = useState("en");
  const [platform, setPlatform] = useState("YouTube");
  const [isProcessing, setIsProcessing] = useState(false);

  // API Data States
  const [scriptSegments, setScriptSegments] = useState<string[]>([]);
  const [seoMetadataTags, setSeoMetadataTags] = useState<string[]>([]);
  const [thoughtProcessStep, setThoughtProcessStep] = useState("");

  // System Execution Logs State
  const [logs, setLogs] = useState<LogStep[]>([]);

  // Auto-scroll ref
  const scriptEndRef = useRef<HTMLDivElement>(null);

  const getLogTime = () => {
    return new Date().toTimeString().split(" ")[0];
  };

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
    setThoughtProcessStep("");
    setLogs([]);
  };

  const handleOrchestrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setScriptSegments([]);
    setSeoMetadataTags([]);
    setThoughtProcessStep("");
    
    // Step 1: Initialize reasoning
    const step1: LogStep = {
      id: "step-1",
      status: "running",
      label: "1. Initializing Query Reasoning...",
      time: getLogTime(),
      category: "reasoning",
      details: `Parsing creator prompt: "${inputText}"\nLanguage target: ${language.toUpperCase()}\nPlatform destination: ${platform}`
    };
    setLogs([step1]);

    await new Promise(r => setTimeout(r, 600));
    setLogs(prev => prev.map(l => l.id === "step-1" ? { ...l, status: "success" } : l));

    // Step 2: Querying Elastic MCP Search
    const step2: LogStep = {
      id: "step-2",
      status: "running",
      label: "2. Invoking Elastic Search Vector Indexing...",
      time: getLogTime(),
      category: "gateway",
      details: `Outgoing search payload target index: "mythology-dataset-${language.toLowerCase()}"\nQuery: "${inputText}"`
    };
    setLogs(prev => [...prev, step2]);

    try {
      // Connect to our live FastAPI endpoint
      const response = await fetch("http://localhost:8000/api/v1/mythology/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_prompt: inputText,
          language: language,
          creator_platform: platform,
        }),
      });

      if (!response.ok) {
        throw new Error(`FastAPI Server returned status ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== "success" || !result.data) {
        throw new Error(result.detail || "Orchestration request returned an invalid structure.");
      }

      const data = result.data;

      // Update Step 2 to Success
      setLogs(prev => prev.map(l => l.id === "step-2" ? { 
        ...l, 
        status: "success", 
        details: `Successfully completed Elastic lookup.\nContext parsed: Retrieved historical dataset entries matches.` 
      } : l));

      // Step 3: Synthesis
      const step3: LogStep = {
        id: "step-3",
        status: "running",
        label: "3. Executing Gemini Multilingual Synthesis...",
        time: getLogTime(),
        category: "analysis",
        details: "Invoking Google GenAI Client (gemini-3.5-flash) to structure narration script and metadata tags..."
      };
      setLogs(prev => [...prev, step3]);

      await new Promise(r => setTimeout(r, 800));

      // Update Step 3 to Success
      setLogs(prev => prev.map(l => l.id === "step-3" ? { 
        ...l, 
        status: "success", 
        details: `Gemini Synthesis finished.\nThought Process Details:\n${data.thought_process_step}` 
      } : l));

      // Bind data directly to interactive React states
      setScriptSegments(data.script_segments || []);
      setSeoMetadataTags(data.seo_metadata_tags || []);
      setThoughtProcessStep(data.thought_process_step || "");

    } catch (error: any) {
      console.error("API Integration failed:", error);
      // Mark active step as error
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last) {
          return prev.map(l => l.id === last.id ? { 
            ...l, 
            status: "error", 
            details: `Integration failed: ${error.message}\nEnsure your FastAPI server is online at http://localhost:8000.` 
          } : l);
        }
        return prev;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scriptSegments.length > 0) {
      scriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [scriptSegments]);

  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto justify-center">
      <div className="w-full flex-1 flex flex-col justify-center space-y-6">
        
        {/* Banner/Hero description */}
        <div className="flex items-center justify-between text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-accent-blue animate-ping" : "bg-accent-emerald animate-pulse-glow"}`} />
            <span>Mythos Echo Gateway Active</span>
          </div>
          
          <button 
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-slate-400 hover:text-slate-200"
            title="Reset Workflow"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950/40 border border-white/5 rounded-xl backdrop-blur-md shadow-2xl overflow-hidden">
          
          {/* Main Content Generating Area */}
          <div className="flex-1 flex flex-col h-[700px] md:h-auto min-w-0 p-6 space-y-6 overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
              <div className="p-2.5 bg-gradient-to-tr from-accent-purple/20 to-accent-blue/20 rounded-xl border border-accent-purple/30">
                <Sparkles className="w-6 h-6 text-accent-purple" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-wide text-slate-100 flex items-center gap-1.5 animate-fade-in">
                  Mythos Echo Campaign Dashboard 
                  <span className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2 py-0.5 rounded font-mono font-normal">v1.0.0</span>
                </h1>
                <p className="text-xs text-slate-400">Asynchronous mythology content planning and vector search synthesis workspace</p>
              </div>
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleOrchestrate} className="space-y-4">
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

              {/* Creator Text Prompt Input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter mythology prompt (e.g. 'Describe Shiva's power' or 'Explain Thor's hammer Mjolnir')..."
                  disabled={isProcessing}
                  required
                  minLength={5}
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl py-3.5 pl-4 pr-14 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="absolute right-2 p-2 bg-accent-blue hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-accent-blue/20"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            {/* Suggestions Block (Visible only when empty) */}
            {scriptSegments.length === 0 && !isProcessing && (
              <div className="space-y-2.5 animate-fade-in">
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Sample Prompts to Try
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("Explain the power of Thor's hammer Mjolnir", "en", "YouTube")}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-lg text-left text-xs text-slate-300 transition-all group"
                  >
                    <span className="font-semibold text-accent-purple block mb-0.5">Norse Mythology</span>
                    <span className="text-slate-400 group-hover:text-slate-200">Explain the power of Thor's hammer Mjolnir (English, YouTube)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("Detail Vayu wind speed attributes", "en", "TikTok")}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-lg text-left text-xs text-slate-300 transition-all group"
                  >
                    <span className="font-semibold text-accent-amber block mb-0.5">Hindu Mythology</span>
                    <span className="text-slate-400 group-hover:text-slate-200">Detail Vayu wind speed attributes (English, TikTok)</span>
                  </button>
                </div>
              </div>
            )}

            {/* SEO Metadata Badge Array */}
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
                      className="px-2.5 py-1 bg-accent-blue/10 border border-accent-blue/20 hover:border-accent-blue/40 text-accent-blue text-xs rounded-full cursor-default font-medium transition-all animate-fade-in"
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

            {/* Main Script Window */}
            <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <FileText className="w-3 h-3 text-slate-500" />
                <span>Generated Script Chapters</span>
              </div>
              
              <div className="flex-1 min-h-[250px] bg-slate-900/40 border border-white/10 rounded-xl p-4 overflow-y-auto space-y-4 shadow-inner">
                {isProcessing && scriptSegments.length === 0 ? (
                  /* Loading Shimmer Skeletons */
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                        <div className="h-3.5 bg-slate-800 rounded w-24" />
                        <div className="h-3 bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-800 rounded w-5/6" />
                      </div>
                    ))}
                  </div>
                ) : scriptSegments.length > 0 ? (
                  /* Rendered Segments */
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
                  /* Empty state */
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500 text-center space-y-3">
                    <div className="p-3 bg-white/5 rounded-full border border-white/10 text-slate-600">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Script viewer empty</p>
                      <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1">
                        Select a sample prompt or write your own custom campaign guidelines to generate content.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={scriptEndRef} />
              </div>
            </div>

          </div>

          {/* Thought Log Sidebar */}
          <Sidebar logs={logs} isProcessing={isProcessing} />

        </div>
      </div>
    </main>
  );
}
