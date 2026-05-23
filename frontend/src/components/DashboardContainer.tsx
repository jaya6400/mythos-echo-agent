"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar, { LogStep } from "./Sidebar";
import { Send, Sparkles, Wand2, RefreshCcw, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "agent";
  content: string;
  time: string;
}

export default function DashboardContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "user",
      content: "I want to create a campaign centered around the Hindu pantheon, specifically looking for characters related to storm and wind.",
      time: "20:38"
    },
    {
      id: "m2",
      sender: "agent",
      content: "Understood. Searching for storm and wind deities in the Hindu pantheon. I will query the Elastic vector indexes via the MCP gateway and compile their mythological attributes, key symbols, and relationships.",
      time: "20:39"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogStep[]>([
    {
      id: "l1",
      status: "success",
      label: "1. Initializing Query Reasoning...",
      time: "20:38:15",
      category: "reasoning",
      details: "Parsed query parameters:\n{\n  \"pantheon\": \"Hindu\",\n  \"keywords\": [\"storm\", \"wind\"],\n  \"task\": \"character-extraction\"\n}"
    },
    {
      id: "l2",
      status: "success",
      label: "2. Invoking Elastic MCP Search over Hindu Pantheon...",
      time: "20:38:17",
      category: "gateway",
      details: "POST /gateway/mcp/search\nHeaders: Authorization API-Key\nPayload: {\n  \"index\": \"hindu-pantheon-vectors\",\n  \"query_vector\": [...],\n  \"k\": 5\n}"
    },
    {
      id: "l3",
      status: "success",
      label: "3. Found 3 matching deities in index",
      time: "20:38:18",
      category: "database",
      details: "Results returned:\n1. Rudra (Storm Deity, Rigvedic, Score: 0.94)\n2. Indra (King of Devas, Storms & Lightning, Score: 0.89)\n3. Vayu (Deity of Wind, Score: 0.87)"
    },
    {
      id: "l4",
      status: "success",
      label: "4. Executing Gemini Multilingual Synthesis...",
      time: "20:39:02",
      category: "analysis",
      details: "Invoked gemini-1.5-pro content synthesis. Response generated in 1.4s."
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsProcessing(true);

    // Dynamic Simulation of Gemini Thought Log Workflow Steps
    const queryTime = new Date();
    const formatLogTime = (offsetSecs: number) => {
      const d = new Date(queryTime.getTime() + offsetSecs * 1000);
      return d.toTimeString().split(' ')[0];
    };

    setLogs([]); // Reset logs for the new stream simulation

    // Step 1: Initializing
    await new Promise(r => setTimeout(r, 600));
    const step1: LogStep = {
      id: "step1",
      status: "running",
      label: "1. Initializing Query Reasoning...",
      time: formatLogTime(0),
      category: "reasoning",
      details: `Resolving semantic context for creator input: "${userMsg.content}"\nDetecting language models, system constraints and guardrails.`
    };
    setLogs([step1]);

    // Step 2: Database Query
    await new Promise(r => setTimeout(r, 1000));
    setLogs(prev => prev.map(l => l.id === "step1" ? { ...l, status: "success" } : l));
    const step2: LogStep = {
      id: "step2",
      status: "running",
      label: "2. Invoking Elastic MCP Search over indexing vectors...",
      time: formatLogTime(1),
      category: "gateway",
      details: `Outgoing request to Elastic MCP Client API.\nSearch Parameters: {\n  "query": "${userMsg.content}",\n  "embedding_model": "text-embedding-004"\n}`
    };
    setLogs(prev => [...prev, step2]);

    // Step 3: Database Success
    await new Promise(r => setTimeout(r, 1200));
    setLogs(prev => prev.map(l => l.id === "step2" ? { ...l, status: "success" } : l));
    const step3: LogStep = {
      id: "step3",
      status: "success",
      label: "3. Retreived vector elements from indexing",
      time: formatLogTime(2),
      category: "database",
      details: `Fetched index items. Matched mythological records:\n- Norse: Thor, Odin\n- Hindu: Rudra, Indra\n- Greek: Zeus`
    };
    setLogs(prev => [...prev, step3]);

    // Step 4: Content Generation
    await new Promise(r => setTimeout(r, 800));
    const step4: LogStep = {
      id: "step4",
      status: "running",
      label: "4. Executing Gemini Multilingual Synthesis...",
      time: formatLogTime(3),
      category: "analysis",
      details: "Synthesizing detailed narrative context including translation matrix and character templates."
    };
    setLogs(prev => [...prev, step4]);

    // Step 5: Finished
    await new Promise(r => setTimeout(r, 1200));
    setLogs(prev => prev.map(l => l.id === "step4" ? { ...l, status: "success" } : l));
    
    const agentResponse: Message = {
      id: (Date.now() + 1).toString(),
      sender: "agent",
      content: `I've analyzed your request and located matching deities using the Elastic MCP Gateway search. Based on your prompt, here is a structured breakdown for your campaign:

1. **Rudra (Hindu Storm Deity)**: The terrifying form of Shiva. Associated with wild storms, medicine, and destructive cosmic winds.
2. **Vayu (Hindu Deity of Wind)**: The god of the wind and the breath of life. Sleek, swift, and riding a golden chariot.
3. **Indra (King of the Devas)**: Wields the thunderbolt (Vajra), controls the rainclouds and thunderstorms.

How would you like to incorporate these figures into your mythos layout?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, agentResponse]);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "m1",
        sender: "user",
        content: "I want to create a campaign centered around the Hindu pantheon, specifically looking for characters related to storm and wind.",
        time: "20:38"
      },
      {
        id: "m2",
        sender: "agent",
        content: "Understood. Searching for storm and wind deities in the Hindu pantheon. I will query the Elastic vector indexes via the MCP gateway and compile their mythological attributes, key symbols, and relationships.",
        time: "20:39"
      }
    ]);
    setLogs([
      {
        id: "l1",
        status: "success",
        label: "1. Initializing Query Reasoning...",
        time: "20:38:15",
        category: "reasoning",
        details: "Parsed query parameters:\n{\n  \"pantheon\": \"Hindu\",\n  \"keywords\": [\"storm\", \"wind\"],\n  \"task\": \"character-extraction\"\n}"
      },
      {
        id: "l2",
        status: "success",
        label: "2. Invoking Elastic MCP Search over Hindu Pantheon...",
        time: "20:38:17",
        category: "gateway",
        details: "POST /gateway/mcp/search\nPayload: {\n  \"index\": \"hindu-pantheon-vectors\",\n  \"query_vector\": [...]\n}"
      },
      {
        id: "l3",
        status: "success",
        label: "3. Found 3 matching deities in index",
        time: "20:38:18",
        category: "database",
        details: "Results returned:\n1. Rudra (Storm Deity, Score: 0.94)\n2. Indra (King of Devas, Score: 0.89)\n3. Vayu (Deity of Wind, Score: 0.87)"
      },
      {
        id: "l4",
        status: "success",
        label: "4. Executing Gemini Multilingual Synthesis...",
        time: "20:39:02",
        category: "analysis",
        details: "Invoked gemini-1.5-pro content synthesis. Response generated in 1.4s."
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950/40 border border-white/5 rounded-xl backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Chat Workspace */}
      <div className="flex-1 flex flex-col h-[600px] md:h-auto min-w-0">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-accent-purple/20 to-accent-blue/20 rounded-lg border border-accent-purple/30">
              <Sparkles className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-slate-100 flex items-center gap-1.5">
                Mythos Echo <span className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-1.5 py-0.5 rounded font-mono font-normal">v1.0.0</span>
              </h1>
              <p className="text-[11px] text-slate-400">Gemini-backed campaign generator for multilingual mythology</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            title="Reset Simulation"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${
                msg.sender === "user" ? "ml-auto items-end animate-fade-in" : "mr-auto items-start animate-fade-in"
              }`}
            >
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                msg.sender === "user" 
                  ? "bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 border-accent-purple/30 text-slate-200 rounded-tr-none shadow-lg shadow-accent-purple/5" 
                  : "bg-white/5 border-white/5 text-slate-300 rounded-tl-none"
              }`}>
                {msg.sender === "agent" ? (
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1.5 px-1">{msg.time}</span>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center space-x-2 bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none mr-auto max-w-[85%]">
              <Loader2 className="w-4 h-4 text-accent-blue animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Thought process in queue...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/5 bg-slate-950/20">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask Gemini to retrieve and generate campaigns... (e.g. 'Query Norse thunder deities')"
              disabled={isProcessing}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-4 pr-14 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="absolute right-2 p-2 bg-accent-blue hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center space-x-4 mt-3 px-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Wand2 className="w-3 h-3" /> Auto-synthesize mythology campaigns</span>
            <span>•</span>
            <span>MCP index searching enabled</span>
          </div>
        </div>

      </div>

      {/* Thought Log Sidebar */}
      <Sidebar logs={logs} isProcessing={isProcessing} />
    </div>
  );
}
