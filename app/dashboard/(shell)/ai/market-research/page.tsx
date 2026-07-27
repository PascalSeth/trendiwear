"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  TrendingUp, BarChart3, Loader2, Sparkles, MapPin, 
  Navigation, Shirt, DollarSign, Target, PackageCheck, 
  Send, Globe, Tag, Heart, Copy, Check, Key, X, 
  Settings2, Bot, User, ArrowUpRight, Layers, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

// --- CUSTOM RICH MARKDOWN & TABLE RENDERER ---
function FormattedFashionMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-800 font-sans leading-relaxed text-xs sm:text-sm selection:bg-indigo-100 selection:text-indigo-900">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. MARKDOWN TABLES
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").filter(l => l.trim().startsWith("|"));
          if (lines.length >= 2) {
            const parseRow = (rowStr: string) => 
              rowStr.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());

            const headers = parseRow(lines[0]);
            const isSeparator = (str: string) => /^[:\s-|+]+$/.test(str);
            const dataRows = lines.slice(1).filter(l => !isSeparator(l)).map(parseRow);

            return (
              <div key={bIdx} className="my-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase text-[10px]">
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-2.5 px-3.5 border-b border-slate-800">
                            {renderInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataRows.map((r, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white hover:bg-indigo-50/30" : "bg-slate-50/50 hover:bg-indigo-50/40"}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-3.5 text-slate-700 font-medium">
                              {renderInlineFormatting(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
        }

        // 2. HEADINGS
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              {renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={bIdx} className="text-sm sm:text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-200/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {renderInlineFormatting(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={bIdx} className="text-base sm:text-lg font-black text-slate-900 pt-4 pb-1 border-b-2 border-indigo-600">
              {renderInlineFormatting(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        // 3. HORIZONTAL RULES
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={bIdx} className="my-3 border-slate-200" />;
        }

        // 4. BULLET LISTS
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                  <div className="flex-1">{renderInlineFormatting(item.replace(/^[-*]\s+/, ""))}</div>
                </li>
              ))}
            </ul>
          );
        }

        // 5. CALLOUT QUOTES
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-3 my-2 border-l-4 border-indigo-600 bg-indigo-50/70 rounded-r-xl text-indigo-950 font-medium text-xs leading-relaxed">
              {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        // 6. REGULAR PARAGRAPHS
        return (
          <p key={bIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string) {
  if (!text) return null;
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900 bg-indigo-50/80 px-1 py-0.5 rounded text-[0.95em]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith("`") && cPart.endsWith("`")) {
        return (
          <code key={cIdx} className="font-mono bg-slate-100 text-indigo-900 px-1.5 py-0.5 rounded-md text-[0.85em] border border-slate-200 font-semibold">
            {cPart.slice(1, -1)}
          </code>
        );
      }
      return cPart;
    });
  });
}

// MODULE CARDS CONSTANTS
const MODULE_CARDS = [
  { id: "trend_discovery", actionKey: "trend-discovery", label: "Trend Discovery", desc: "Scan TikTok & Instagram signals for viral aesthetics", icon: Shirt, color: "text-pink-600", bg: "bg-pink-50 border-pink-100" },
  { id: "whats_selling", actionKey: "whats-selling-now", label: "What's Selling Now", desc: "Top moving SKUs, growth % & market average prices", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  { id: "color_trends", actionKey: "color-trends", label: "Color Analysis", desc: "Pantone swatches, earth tones & hex codes", icon: Tag, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
  { id: "opportunity_finder", actionKey: "opportunity-finder", label: "Opportunity Finder", desc: "Identify budget-backed product stocking gaps", icon: Target, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  { id: "price_intelligence", actionKey: "price-intelligence", label: "Price Intelligence", desc: "Compare current prices against competitor benchmarks", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
  { id: "regional_trends", actionKey: "regional-trends", label: "Regional Forecast", desc: "Accra vs Kumasi vs Takoradi vs Lagos vs Diaspora", icon: Globe, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
  { id: "size_demand", actionKey: "size-demand", label: "Size Demand Analytics", desc: "Prevent overstocking with size velocity ratios", icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
  { id: "customer_reviews", actionKey: "customer-reviews", label: "Review Intelligence", desc: "Customer likes, dislikes & quality control fixes", icon: Heart, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
  { id: "inventory_advisor", actionKey: "inventory-advisor", label: "Inventory & Bundles", desc: "Reorder bestsellers & high-converting outfit bundles", icon: PackageCheck, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
];

const CITY_HUBS = [
  { id: "accra", name: "Accra (Osu & East Legon)", flag: "🇬🇭" },
  { id: "lagos", name: "Lagos (VI & Lekki)", flag: "🇳🇬" },
  { id: "kumasi", name: "Kumasi (Adum)", flag: "🇬🇭" },
  { id: "london", name: "London (Brixton)", flag: "🇬🇧" },
  { id: "newyork", name: "New York (SoHo)", flag: "🇺🇸" },
];

const SUGGESTED_PROMPTS = [
  "What should I restock this week for Accra weddings?",
  "Which colors are trending in West Africa right now?",
  "Which dresses are most popular with women aged 18–25?",
  "How should I price a luxury silk kaftan set?",
  "What products should I bundle together for higher AOV?",
];

interface ExtractedSwatch { name: string; hex: string; }

interface ChatMessage {
  id: string;
  sender: "user" | "trendi";
  text: string;
  timestamp: string;
  actionLabel?: string;
  engineUsed?: string;
}

export default function TrendiChatMarketResearchTerminalPage() {
  const [viewMode, setViewMode] = useState<"copilot" | "modules" | "result">("copilot");

  // App State
  const [cityLocation, setCityLocation] = useState<string>("Accra (Osu & East Legon)");
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [copilotQuery, setCopilotQuery] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "trendi",
      text: `Hello! I'm **Trendi**, your AI Fashion Copilot. 

I combine your store's **Prisma DB telemetry** with **DeepSeek AI market intelligence** for **${cityLocation}**. 

Ask me anything about trend forecasts, local fabric pricing, sizing velocity, or inventory restocking!`,
      timestamp: "Just now",
      actionLabel: "Trendi AI Welcome",
    }
  ]);

  // Loading & Result State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentActionLabel, setCurrentActionLabel] = useState<string>("Trendi AI Intelligence");
  const [, setEngineUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [, setTelemetry] = useState<unknown | null>(null);

  const [extractedSwatches, setExtractedSwatches] = useState<ExtractedSwatch[]>([]);

  // Pre-fetch telemetry on mount
  useEffect(() => {
    fetch("/api/ai/market-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seller-health", payload: { cityLocation } }),
    })
      .then(res => res.json())
      .then(data => { if (data.telemetry) setTelemetry(data.telemetry); })
      .catch(() => {});
  }, [cityLocation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (viewMode === "copilot") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, viewMode]);

  // Process color swatches
  useEffect(() => {
    if (!result) return;
    const hexRegex = /#([A-Fa-f0-9]{6})/g;
    const matches = Array.from(result.matchAll(hexRegex));
    const uniqueHexes = Array.from(new Set(matches.map(m => m[0])));
    const swatches = uniqueHexes.slice(0, 6).map((hex, idx) => ({ name: `Colorway ${idx + 1}`, hex }));

    if (swatches.length === 0 && (viewMode === "result" || viewMode === "modules")) {
      setExtractedSwatches([
        { name: "Ghanaian Sunset", hex: "#E67E22" },
        { name: "Savannah Olive", hex: "#7D8A4E" },
{ name: "Accra Clay", hex: "#C4734A" },
        { name: "Deep Cocoa", hex: "#5D4037" },
      ]);
    } else {
      setExtractedSwatches(swatches);
    }
  }, [result, viewMode]);

  const runAnalysis = async (action: string, label: string, customPayload: Record<string, unknown> = {}) => {
    setLoading(true);
    setCurrentActionLabel(label);

    const userMsgId = `user-${Date.now()}`;
    
    if (customPayload.customQuery) {
      setMessages(prev => [
        ...prev,
        { 
          id: userMsgId, 
          sender: "user", 
          text: customPayload.customQuery as string, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    }

    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          payload: {
            cityLocation,
            ...customPayload
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Intelligence query failed");

      setResult(data.result);
      if (data.engineUsed) setEngineUsed(data.engineUsed);
      if (data.swatches && Array.isArray(data.swatches)) {
        setExtractedSwatches(data.swatches);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "trendi",
          text: data.result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionLabel: label,
          engineUsed: data.engineUsed,
        }
      ]);

      if (viewMode !== "copilot") setViewMode("result");
      toast.success("Trendi AI analysis updated!");
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    const q = copilotQuery;
    setCopilotQuery("");
    runAnalysis("fashion-copilot", "Copilot Response", { customQuery: q });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || "Detected Area";
          setCityLocation(`${city}, ${data.address?.country || ""}`);
          toast.success(`Location set to ${city}`);
        } catch {
          toast.error("Could not resolve location");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setDetectingLocation(false);
      }
    );
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-white text-slate-900 overflow-hidden relative font-sans border-0 shadow-none">

      {/* FLUSH HEADER */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/80 z-20">
        
        {/* TrendiChat Avatar & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative group cursor-pointer" onClick={() => setViewMode("copilot")}>
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-2xs group-hover:scale-105 transition-transform bg-slate-100 flex items-center justify-center shrink-0">
              <Image 
                src="/trendichat.png" 
                alt="TrendiChat AI Avatar" 
                width={36} 
                height={36} 
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base">TrendiChat AI</h1>
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold rounded-md border border-indigo-200/60 uppercase tracking-wider">
                Prisma DB
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Intelligence Copilot for <span className="text-indigo-600 font-bold">{cityLocation}</span>
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Location Button */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode("copilot")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "copilot" ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/60" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <MessageSquare size={12} /> TrendiChat
            </button>
            <button
              onClick={() => setViewMode("modules")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                (viewMode === "modules" || viewMode === "result") ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/60" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={12} /> Modules
            </button>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="p-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <MapPin size={12} className="text-indigo-600" />
            <span className="hidden md:inline text-[11px]">{cityLocation.split(" ")[0]}</span>
            <Settings2 size={12} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* SETTINGS DRAWER */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity animate-in fade-in" onClick={() => setShowSettings(false)} />
          <div className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 relative z-10 p-5 space-y-5 animate-in slide-in-from-right-10 text-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Settings2 size={14} className="text-indigo-600" /> Target Market Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Select City / Market</h4>
              <div className="space-y-1">
                {CITY_HUBS.map(hub => (
                  <button key={hub.id} onClick={() => { setCityLocation(hub.name); toast.success(`Location set to ${hub.name}`); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${cityLocation.includes(hub.name.split(" ")[0]) ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs" : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"}`}>
                    <span>{hub.flag} {hub.name}</span>
                    {cityLocation.includes(hub.name.split(" ")[0]) && <Check size={14} className="text-indigo-600" />}
                  </button>
                ))}
                <button onClick={handleDetectLocation} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all">
                  {detectingLocation ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  <span>📍 Detect My Location</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Key size={12} className="text-amber-500" /> DeepSeek API Key Override
              </h4>
              <p className="text-[11px] text-slate-500">Enter custom DeepSeek key for unthrottled API access.</p>
              <input
                type="password"
                placeholder="sk-..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* FULL-HEIGHT WORKSPACE */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">

        {/* =========================================================================
            VIEWMODE 1: TRENDICHAT CONVERSATIONAL COPILOT (FULL HEIGHT & PINNED BOTTOM INPUT)
            ========================================================================= */}
        {viewMode === "copilot" && (
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden bg-slate-50/50">
            
            {/* MESSAGES SCROLL AREA (EXPANDS TO FILL TOP PORTION) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4">
              <div className="max-w-4xl mx-auto space-y-4">
                
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2`}
                  >
                    {/* AVATAR */}
                    {msg.sender === "trendi" ? (
                      <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-2xs shrink-0 bg-white flex items-center justify-center mt-1">
                        <Image src="/trendichat.png" alt="TrendiChat Avatar" width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-1">
                        <User size={14} />
                      </div>
                    )}

                    {/* BUBBLE */}
                    <div className={`max-w-2xl rounded-2xl p-3.5 sm:p-4 shadow-2xs ${
                      msg.sender === "user" 
                        ? "bg-indigo-600 text-white font-medium rounded-tr-xs" 
                        : "bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs"
                    }`}>
                      {msg.sender === "trendi" && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                          <span className="font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                            <Sparkles size={12} /> {msg.actionLabel || "Trendi Intelligence"}
                          </span>
                          {msg.engineUsed && (
                            <span className="text-[9px] font-mono text-slate-400">
                              {msg.engineUsed}
                            </span>
                          )}
                        </div>
                      )}

                      {msg.sender === "trendi" ? (
                        <FormattedFashionMarkdown content={msg.text} />
                      ) : (
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      )}

                      <div className={`mt-2 text-[9px] text-right font-medium ${msg.sender === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-start gap-2.5 animate-in fade-in">
                    <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-slate-200 shrink-0 bg-white mt-1">
                      <Image src="/trendichat.png" alt="TrendiChat Avatar" width={32} height={32} className="object-cover w-full h-full" />
                    </div>
                    <div className="p-3 bg-white text-slate-900 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2 text-xs">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span className="font-bold text-slate-700">Trendi analyzing data for {cityLocation}...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ULTRA-COMPACT BOTTOM INPUT & PROMPTS BAR (PINNED TO VERY BOTTOM AT ALL TIMES) */}
            <div className="shrink-0 px-3 py-2 sm:px-4 bg-white border-t border-slate-200/80 space-y-1.5 z-10 mt-auto">
              
              {/* SLIM 1-LINE PROMPTS STRIP WITH HIDDEN SCROLLBAR */}
              <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto text-[10px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                  <Sparkles size={10} className="text-indigo-600" /> Prompts:
                </span>
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCopilotQuery(promptText);
                      runAnalysis("fashion-copilot", "Copilot Answer", { customQuery: promptText });
                    }}
                    className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 text-slate-600 font-medium px-2.5 py-0.5 rounded-lg transition-all whitespace-nowrap shrink-0"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>

              {/* SLIM COMPACT INPUT BAR */}
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <div className="absolute left-2.5 w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                    <Image src="/trendichat.png" alt="Trendi Avatar" width={24} height={24} className="object-cover w-full h-full" />
                  </div>
                  <input
                    type="text"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    placeholder={`Ask Trendi about trends, fabric prices, or restocking in ${cityLocation}...`}
                    className="w-full pl-10 pr-24 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading || !copilotQuery.trim()}
                    className="absolute right-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Ask</span>
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* =========================================================================
            VIEWMODE 2: MERCHANDISING MODULES & REPORTS
            ========================================================================= */}
        {(viewMode === "modules" || viewMode === "result") && (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-50/40">
            
            {/* LEFT SIDEBAR */}
            <div className="w-full lg:w-72 border-r border-slate-200/80 p-3.5 overflow-y-auto space-y-3 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <BarChart3 size={12} className="text-indigo-600" /> Merchandising Modules
                </h3>
                <span className="text-[9px] text-indigo-600 font-mono font-bold">9 Tools</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {MODULE_CARDS.map((mod) => {
                  const IconComp = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => runAnalysis(mod.actionKey, mod.label)}
                      className="group p-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-left transition-all duration-200 flex items-start gap-2.5 shadow-2xs"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${mod.bg} ${mod.color}`}>
                        <IconComp size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{mod.label}</h4>
                          <ArrowUpRight size={11} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{mod.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT CANVAS */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 text-center p-6">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <h3 className="text-xs font-bold text-slate-900">Analyzing Telemetry for {cityLocation}...</h3>
                  <p className="text-[11px] text-slate-500 max-w-xs">Synthesizing store sales velocity and regional market trends.</p>
                </div>
              ) : result ? (
                <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
                  
                  {/* TOP BAR */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-md">
                        {currentActionLabel}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
                        Fashion Market Intelligence Report
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result || "");
                        setCopied(true);
                        toast.success("Report copied!");
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-1 transition-all"
                    >
                      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copied ? "Copied!" : "Copy Report"}</span>
                    </button>
                  </div>

                  {/* SWATCHES */}
                  {extractedSwatches.length > 0 && (
                    <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Tag size={11} className="text-indigo-600" /> Pantone Palette ({cityLocation.split(" ")[0]}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {extractedSwatches.map((swatch, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { navigator.clipboard.writeText(swatch.hex); toast.success(`Copied ${swatch.hex}`); }}
                            className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer hover:border-indigo-300 transition-all"
                          >
                            <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: swatch.hex }} />
                            <div>
                              <p className="text-[10px] font-bold text-slate-900">{swatch.name}</p>
                              <p className="text-[8px] font-mono text-slate-500 uppercase">{swatch.hex}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MARKDOWN DISPLAY */}
                  <div className="p-5 sm:p-6 bg-white text-slate-900 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <FormattedFashionMarkdown content={result} />
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
                  <Bot size={36} className="text-indigo-600 opacity-20" />
                  <h3 className="text-xs font-bold text-slate-700">Select any Merchandising Module to Begin</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs">Click a tool on the left sidebar to generate research for {cityLocation}.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}