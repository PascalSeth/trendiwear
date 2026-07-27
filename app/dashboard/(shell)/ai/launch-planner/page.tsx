"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Rocket, Calendar, Video, Mail, Loader2, Sparkles,
  BarChart3, Users, Gift, PackageCheck, Camera, CheckSquare, MessageSquare,
  Layers, Target, Copy, Check
} from "lucide-react";
import { toast } from "sonner";

// --- LIGHT THEME RICH MARKDOWN RENDERER ---
function FormattedLightMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-700 font-sans leading-relaxed text-xs sm:text-sm selection:bg-amber-100 selection:text-amber-900">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();

        // 1. TABLES
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").filter(l => l.trim().startsWith("|"));
          if (lines.length >= 2) {
            const parseRow = (str: string) => str.split("|").filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
            const headers = parseRow(lines[0]);
            const dataRows = lines.slice(1).filter(l => !/^[:\s-|+]+$/.test(l)).map(parseRow);

            return (
              <div key={bIdx} className="my-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase text-[10px]">
                        {headers.map((h, i) => <th key={i} className="py-3 px-4 border-b border-slate-800">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataRows.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white hover:bg-amber-50/30" : "bg-slate-50/50 hover:bg-amber-50/40"}>
                          {r.map((cell, cIdx) => <td key={cIdx} className="py-2.5 px-4 font-medium text-slate-700">{cell}</td>)}
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
        if (trimmed.startsWith("### ")) return <h3 key={bIdx} className="text-xs sm:text-sm font-bold text-slate-900 pt-2 pb-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-600" />{renderInline(trimmed.replace(/^###\s+/, ""))}</h3>;
        if (trimmed.startsWith("## ")) return <h2 key={bIdx} className="text-sm sm:text-base font-extrabold text-slate-900 pt-3 pb-1 border-b border-slate-200 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-600" />{renderInline(trimmed.replace(/^##\s+/, ""))}</h2>;
        if (trimmed.startsWith("# ")) return <h1 key={bIdx} className="text-base sm:text-lg font-black tracking-tight text-slate-900 pt-4 pb-1 border-b-2 border-amber-600">{renderInline(trimmed.replace(/^#\s+/, ""))}</h1>;

        // 3. BULLETS
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter(l => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                  <div className="flex-1 leading-relaxed">{renderInline(item.replace(/^[-*]\s+/, ""))}</div>
                </li>
              ))}
            </ul>
          );
        }

        // 4. CALLOUTS
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-3.5 my-3 border-l-4 border-amber-600 bg-amber-50/70 rounded-r-2xl text-amber-950 font-medium text-xs sm:text-sm leading-relaxed">
              {renderInline(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        // 5. PARAGRAPHS
        return <p key={bIdx} className="leading-relaxed text-xs sm:text-sm text-slate-700">{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  if (!text) return null;
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx} className="font-extrabold text-slate-900 bg-amber-50 px-1 py-0.5 rounded text-[0.95em]">{part.slice(2, -2)}</strong>;
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith("`") && cPart.endsWith("`")) return <code key={cIdx} className="font-mono bg-slate-100 text-amber-900 px-1.5 py-0.5 rounded-md text-[0.85em] border border-slate-200 font-semibold">{cPart.slice(1, -1)}</code>;
      return cPart;
    });
  });
}

// --- LAUNCH PLANNER TOOLS SPECIFICATIONS ---
type LaunchTool = 
  | "launch-setup"
  | "launch-timeline"
  | "content-calendar"
  | "reel-scripts"
  | "email-sequence"
  | "goals-tracker"
  | "influencer-planner"
  | "promo-planner"
  | "inventory-readiness"
  | "content-checklist"
  | "command-center"
  | "post-launch-review"
  | "launch-coach";

const LAUNCH_TOOLS: { id: LaunchTool; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "launch-setup", title: "🚀 1. Collection Setup", subtitle: "Define collection parameters, budget, products, and sales targets.", icon: Rocket },
  { id: "launch-timeline", title: "📅 2. 30-Day Timeline", subtitle: "Week 1 Awareness ➔ Week 2 Interest ➔ Week 3 Intent ➔ Week 4 Launch.", icon: Calendar },
  { id: "content-calendar", title: "📱 3. Social Media Calendar", subtitle: "30-day day-by-day Reels, TikToks, Stories & Carousels schedule.", icon: Layers },
  { id: "reel-scripts", title: "🎬 4. AI Reel Scripts", subtitle: "Short-form video scripts (Hook, Scenes, & CTA).", icon: Video },
  { id: "email-sequence", title: "📧 5. Email Campaign Builder", subtitle: "6-Email sequence (Coming Soon ➔ Sneak Peek ➔ Launch Day ➔ Last Chance).", icon: Mail },
  { id: "goals-tracker", title: "🎯 6. Launch Goals Tracker", subtitle: "Revenue, orders, followers, subscribers & traffic targets.", icon: Target },
  { id: "influencer-planner", title: "👥 7. Influencer Collab Plan", subtitle: "Micro/Macro creators, deliverables, deadlines & schedule.", icon: Users },
  { id: "promo-planner", title: "🎁 8. Promotion Strategy", subtitle: "Early bird, Buy 2 Get 1, Free shipping, & VIP early access.", icon: Gift },
  { id: "inventory-readiness", title: "📦 9. Inventory Readiness Audit", subtitle: "Verify stock sufficiency, size counts, & listing completeness.", icon: PackageCheck },
  { id: "content-checklist", title: "📸 10. Content Checklist", subtitle: "Track product photos, try-on videos, close-ups, & size guides.", icon: Camera },
  { id: "command-center", title: "✅ 11. Launch Day Command Center", subtitle: "Live launch-day task execution dashboard.", icon: CheckSquare },
  { id: "post-launch-review", title: "📊 12. Post-Launch Review", subtitle: "Best sellers, conversion rates, traffic sources, & next campaign ROI.", icon: BarChart3 },
  { id: "launch-coach", title: "🤖 13. AI Launch Coach", subtitle: "Ask AI launch questions ('Is my date good?', 'What discount works?').", icon: MessageSquare },
];

export default function LaunchPlannerPage() {
  // Input State
  const [collectionName, setCollectionName] = useState<string>("Summer Escape 2026");
  const [theme, setTheme] = useState<string>("Resort Wear & Linen Sets");
  const [targetLaunchDate, setTargetLaunchDate] = useState<string>("2026-08-15");
  const [targetAudience, setTargetAudience] = useState<string>("Women 18–35 interested in summer fashion & vacation wear");
  const [budget, setBudget] = useState<number>(2000);
  const [productsIncluded, setProductsIncluded] = useState<string>("12 Dresses, 5 Sandals, 8 Handbags");
  const [salesGoal, setSalesGoal] = useState<number>(15000);
  const [customCoachQuestion, setCustomCoachQuestion] = useState<string>("Is August 15 a good launch date for a summer collection?");

  // Active Tool & State
  const [activeTool, setActiveTool] = useState<LaunchTool>("launch-setup");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateLaunchPlan = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "launch-planner",
          payload: {
            tool: activeTool,
            collectionName,
            theme,
            targetLaunchDate,
            targetAudience,
            budget,
            productsIncluded,
            salesGoal,
            customCoachQuestion,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate collection launch plan");

      setResult(data.result);
      if (data.engineUsed) setEngineUsed(data.engineUsed);
      toast.success("Launch Plan Strategy Ready!");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj.message || "Failed to generate launch plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied launch plan to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 space-y-6 overflow-y-auto">

      {/* TOP HEADER WITH TRENDICHAT AVATAR */}
      <header className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-amber-500/40 shadow-md shadow-amber-500/10 bg-slate-100 flex items-center justify-center">
              <Image 
                src="/trendichat.png" 
                alt="TrendiChat Avatar" 
                width={48} 
                height={48} 
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">AI Collection Launch Planner</h1>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full border border-amber-200 uppercase tracking-widest">
                Campaign Strategist
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              End-to-end marketing manager &amp; launch execution coordinator for fashion collections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-100 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Launch Date</span>
            <span className="text-xs font-black text-slate-900 font-mono">{targetLaunchDate}</span>
          </div>
          <div className="px-3.5 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 block">Sales Target</span>
            <span className="text-xs font-black text-amber-800 font-mono">GH₵ {salesGoal.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* MAIN RESPONSIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: 13 LAUNCH TOOLS & COLLECTION SETUP (LG: 5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* 13 LAUNCH TOOLS SELECTOR GRID */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Rocket size={14} className="text-amber-600" /> Select Launch Tool:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LAUNCH_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveTool(tool.id); setResult(null); }}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-start gap-2.5 ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-200/80 text-slate-700"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-extrabold tracking-tight line-clamp-1">{tool.title}</h3>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? "text-slate-300" : "text-slate-500"}`}>{tool.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLLECTION PARAMETERS FORM */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Collection Parameters</span>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {activeTool}
              </span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Collection Name</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Collection Theme</label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Launch Date</label>
                  <input
                    type="text"
                    value={targetLaunchDate}
                    onChange={(e) => setTargetLaunchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Budget (GH₵)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Sales Revenue Goal (GH₵)</label>
                  <input
                    type="number"
                    value={salesGoal}
                    onChange={(e) => setSalesGoal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Products Included in Collection</label>
                <input
                  type="text"
                  value={productsIncluded}
                  onChange={(e) => setProductsIncluded(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                  placeholder="e.g. 12 Dresses, 5 Sandals, 8 Handbags"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              {activeTool === "launch-coach" && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-amber-700 block mb-1">Ask AI Launch Coach</label>
                  <textarea
                    rows={2}
                    value={customCoachQuestion}
                    onChange={(e) => setCustomCoachQuestion(e.target.value)}
                    className="w-full p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-amber-500"
                    placeholder="Ask any launch question..."
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI LAUNCH CANVAS & PLAN OUTPUT (LG: 7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 min-h-[520px] flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl overflow-hidden ring-1 ring-amber-500/40 shrink-0 bg-slate-100">
                    <Image src="/trendichat.png" alt="TrendiChat Avatar" width={28} height={28} className="object-cover w-full h-full" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    TrendiChat Launch Plan Strategy
                  </h3>
                </div>

                {result && (
                  <button
                    onClick={handleCopyText}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl border border-amber-200 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Strategy"}</span>
                  </button>
                )}
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleGenerateLaunchPlan}
                disabled={loading}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{loading ? "Generating Campaign Roadmap..." : `✨ Generate Plan for "${collectionName}"`}</span>
              </button>

              {/* REPORT RESULT */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                  <Loader2 className="w-9 h-9 text-amber-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">TrendiChat Building End-to-End Launch Plan for {collectionName}...</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">Organizing 30-day campaign schedule, reel scripts, email sequences, and launch command center.</p>
                </div>
              ) : result ? (
                <div className="animate-in fade-in">
                  <FormattedLightMarkdown content={result} />
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                  <Rocket size={44} className="text-amber-600 opacity-20" />
                  <h4 className="text-xs font-bold text-slate-700">Select any launch tool on the left and click generate</h4>
                  <p className="text-xs text-slate-400 max-w-xs">Generate 30-day timelines, reel scripts, email sequences, influencer collabs, and launch day command center.</p>
                </div>
              )}
            </div>

            {engineUsed && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Model Engine: {engineUsed}</span>
                <span>Collection: {collectionName}</span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
