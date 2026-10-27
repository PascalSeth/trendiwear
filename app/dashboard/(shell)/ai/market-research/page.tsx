"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  TrendingUp, Palette, DollarSign, PackageCheck, 
  Search, Send, MapPin, Sparkles, Copy, Check, 
  Loader2, ArrowRight, RotateCcw, Video, AlertCircle,
  ShoppingBag, ExternalLink, Paperclip, Mic, MicOff,
  Users, Bookmark, BookmarkCheck, History, Trash2,
  ShieldCheck, Info, CheckCircle2, ChevronRight, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { type MarketSuggestion } from "@/lib/ai/market-suggestions";
import { type SourcedResearchReport } from "@/lib/ai/market-research-orchestrator";

// Location Markets
const CITIES = [
  { id: "accra", name: "Accra, Ghana" },
  { id: "lagos", name: "Lagos, Nigeria" },
  { id: "kumasi", name: "Kumasi, Ghana" },
  { id: "london", name: "London, UK" },
  { id: "newyork", name: "New York, USA" },
];

// Target Customer Market Segments
const CUSTOMER_MARKETS = [
  { id: "local", name: "Local Shoppers", desc: "Everyday residents & neighborhood buyers" },
  { id: "diaspora", name: "Diaspora / Overseas", desc: "Buyers in UK, US, & Europe shipping abroad" },
  { id: "tourists", name: "Tourists & Event Guests", desc: "Visitors for weddings, festivals, and December trips" },
  { id: "professionals", name: "Young Professionals", desc: "Office & contemporary ready-to-wear" },
];

// Core Research Topics (Categorized by Decision Type)
const RESEARCH_TOPICS = [
  {
    id: "trend-discovery",
    title: "Trend Discovery",
    desc: "Popular silhouettes, fabrics, colors, and event opportunities",
    icon: TrendingUp,
    badge: "Trends",
    defaultQuery: "What fashion styles, cuts, and fabrics are gaining attention in this market right now?",
  },
  {
    id: "price-research",
    title: "Compare Prices",
    desc: "Comparable garments from accessible shops and sweet-spot price ranges",
    icon: DollarSign,
    badge: "Pricing",
    defaultQuery: "What are other shops charging for custom and ready-to-wear garments in this city?",
  },
  {
    id: "product-validation",
    title: "Validate an Idea",
    desc: "Test whether an outfit idea is worth making before spending money on fabric",
    icon: Sparkles,
    badge: "Idea Check",
    defaultQuery: "I want to make affordable 2-piece linen sets for young professionals. How should I position and price them?",
  },
  {
    id: "whats-selling-now",
    title: "What's Selling Now",
    desc: "High-velocity styles and confirmed purchase amounts",
    icon: PackageCheck,
    badge: "Popular Now",
    defaultQuery: "Which outfits are getting the highest real buyer demand and repeat sales?",
  },
  {
    id: "sales-diagnosis",
    title: "Fix Slow Sales",
    desc: "Diagnose why shoppers view listings but stop before purchasing",
    icon: AlertCircle,
    badge: "Conversions",
    defaultQuery: "Why are shoppers viewing my clothes without checking out?",
  },
  {
    id: "color-trends",
    title: "Colors & Fabrics",
    desc: "Seasonal color palettes and textiles with real hex swatches",
    icon: Palette,
    badge: "Palettes",
    defaultQuery: "What fabrics and seasonal colors are most in-demand for upcoming collections?",
  },
];

interface ExtractedSwatch {
  name: string;
  hex: string;
}

interface StoreTelemetry {
  activeProducts: number;
  totalStock: number;
  activeServices: number;
  totalReviews: number;
  avgRating: string;
  totalBookings: number;
  totalOrders: number;
  totalUnitsSold: number;
  businessName: string;
  highInterestCount: number;
  stagnantCount: number;
  avgMarketPrice?: number;
  topMarketSizes?: string;
}

// Clean preprocessing of markdown
function preprocessMarkdown(raw: string): string {
  if (!raw) return "";

  let text = raw.replace(/\r\n/g, "\n");

  // 1. Separate common intelligence headings that may have a leading bullet, dash, or are stuck to list items
  const commonHeaders = [
    "Strategic Recommendations & Benchmark Pricing",
    "Tactical \\d+-Day Implementation Directives",
    "Tactical 7-Day Implementation Directives",
    "Top \\d+ Pieces to Sew & Sell This Week",
    "Simple Tips for Buying Fabric",
    "Best Clothes to Sew & Sell",
    "What Buyers Want in [^\\n:]+",
    "Market Advice[^\\n:]*",
    "Immediate Reorder Priorities",
    "High-Converting Outfit & Service Bundles",
    "Local Market Pricing Benchmarks",
    "Profit Margin Expansion Tactics",
    "Primary Conversion Bottlenecks",
    "7-Day Revenue Action Plan",
    "Actionable Quality Control Directives",
    "Actionable Quality Control",
    "Executive Summary",
    "Key Directives",
    "Top Viral Recommendation",
  ];

  for (const h of commonHeaders) {
    const regex = new RegExp(`(?:[-*•#\\s]*\\b(${h})\\b[:.]?)\\s*(?=(\\d+\\.|[-*•]|[A-Z]))`, "gi");
    text = text.replace(regex, "\n\n### $1\n\n");
  }

  // 2. Break inline numbered list items bunched onto a single line
  text = text.replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([.!?])\s+(\d{1,2}\.\s+)/g, "$1\n\n$2");

  // 3. Break inline bullet items bunched onto a single line
  text = text.replace(/([^\n])\s+([-*•]\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([.!?])\s+([-*•]\s+)/g, "$1\n\n$2");

  // 4. Ensure any header (#, ##, ###) has empty lines before AND after it
  text = text.replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, "$1\n\n$2");
  text = text.replace(/(#{1,6}\s+[^\n]+)\n([^\n#])/g, "$1\n\n$2");

  // 5. Ensure numbered list items have empty lines if preceded by a non-list line
  text = text.replace(/([^\n0-9])\n(\d+\.\s+)/g, "$1\n\n$2");

  // 6. Ensure bullet items have empty lines if preceded by non-bullet line
  text = text.replace(/([^\n\-*])\n([-*]\s+)/g, "$1\n\n$2");

  // 7. Ensure table lines are separated from non-table lines
  text = text.replace(/([^\n|])\n(\|)/g, "$1\n\n$2");
  text = text.replace(/(\|\n)([^\n|])/g, "$1\n\n$2");

  return text.trim();
}

function renderInlineFormatting(text: string) {
  if (!text) return null;

  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|#[A-Fa-f0-9]{6}\b|GH₵\s*\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-slate-900 mx-0.5">
          {boldText}
        </strong>
      );
    }

    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            <span>{match[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 inline shrink-0" />
          </a>
        );
      }
    }

    if (/^#[A-Fa-f0-9]{6}$/i.test(part)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold align-middle shadow-2xs mx-0.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-2xs shrink-0 inline-block"
            style={{ backgroundColor: part }}
          />
          {part.toUpperCase()}
        </span>
      );
    }

    if (/^GH₵\s*\d+/i.test(part)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono text-[11px] font-bold mx-0.5 align-middle"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

function SimpleFormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const preprocessed = preprocessMarkdown(content);
  const blocks = preprocessed.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-slate-800 font-sans leading-relaxed text-xs sm:text-sm">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed || /^#+\s*$/.test(trimmed)) return null;

        // Formatted Markdown Tables
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").filter((l) => l.trim().startsWith("|"));
          if (lines.length >= 2) {
            const parseRow = (rowStr: string) =>
              rowStr
                .split("|")
                .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
                .map((c) => c.trim());

            const headers = parseRow(lines[0]);
            const isSeparator = (str: string) => /^[:\s-|+]+$/.test(str);
            const dataRows = lines.slice(1).filter((l) => !isSeparator(l)).map(parseRow);

            return (
              <div key={bIdx} className="my-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold text-[11px]">
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">
                            {renderInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataRows.map((r, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white hover:bg-blue-50/20" : "bg-slate-50/40 hover:bg-blue-50/20"}>
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

        // Headings (Block-level with inline dots to prevent flex row wrapping bugs)
        if (trimmed.startsWith("# ")) {
          const lines = trimmed.split("\n");
          return (
            <div key={bIdx} className="space-y-1.5 pt-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 pt-1 pb-1 border-b-2 border-blue-600 block">
                {renderInlineFormatting(lines[0].replace(/^#\s+/, ""))}
              </h1>
              {lines.slice(1).map((l, lIdx) => (
                <p key={lIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {renderInlineFormatting(l)}
                </p>
              ))}
            </div>
          );
        }

        if (trimmed.startsWith("## ")) {
          const lines = trimmed.split("\n");
          return (
            <div key={bIdx} className="space-y-1.5 pt-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 pt-1.5 pb-1 border-b border-slate-200/80 block">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2 align-middle" />
                <span className="align-middle">{renderInlineFormatting(lines[0].replace(/^##\s+/, ""))}</span>
              </h2>
              {lines.slice(1).map((l, lIdx) => (
                <p key={lIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {renderInlineFormatting(l)}
                </p>
              ))}
            </div>
          );
        }

        if (trimmed.startsWith("### ")) {
          const lines = trimmed.split("\n");
          return (
            <div key={bIdx} className="space-y-1.5 pt-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 pt-1 pb-0.5 block">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 align-middle" />
                <span className="align-middle">{renderInlineFormatting(lines[0].replace(/^###\s+/, ""))}</span>
              </h3>
              {lines.slice(1).map((l, lIdx) => (
                <p key={lIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {renderInlineFormatting(l)}
                </p>
              ))}
            </div>
          );
        }

        // Numbered Action Steps (styled as clean action cards)
        if (/^\d+\.\s+/.test(trimmed)) {
          const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
          return (
            <div key={bIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(\d+)\.\s+([\s\S]*)$/);
                const num = match ? match[1] : `${lIdx + 1}`;
                const body = match ? match[2] : line.replace(/^\d+\.\s+/, "");
                return (
                  <div
                    key={lIdx}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs sm:text-sm"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {num}
                    </span>
                    <div className="flex-1 text-slate-800 leading-relaxed font-normal">
                      {renderInlineFormatting(body)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Bullet Items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <div key={bIdx} className="space-y-1.5 my-1.5 pl-1">
              {items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm leading-relaxed">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <div className="flex-1 font-normal">
                    {renderInlineFormatting(item.replace(/^[-*]\s+/, ""))}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        // Blockquotes
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={bIdx} className="p-3 my-2 border-l-4 border-blue-600 bg-blue-50/70 rounded-r-xl text-blue-950 font-medium text-xs sm:text-sm leading-relaxed">
              {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        const lines = trimmed.split("\n").filter(Boolean);
        return (
          <div key={bIdx} className="text-slate-700 leading-relaxed text-xs sm:text-sm space-y-1">
            {lines.map((l, lineIdx) => (
              <p key={lineIdx}>{renderInlineFormatting(l)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// Research Suggestions Deck (Actionable recommendations grounded in facts)
function ResearchSuggestionsDeck({
  suggestions,
  city,
  title = "Real Fact Suggestions for Your Shop",
  subtitle = "Based on verified facts from your store and marketplace buyers",
}: {
  suggestions: MarketSuggestion[];
  city: string;
  title?: string;
  subtitle?: string;
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200 shadow-2xs">
                {city.split(",")[0]}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
          {suggestions.length} clear steps
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((item) => {
          const badgeStyles =
            item.badgeColor === "emerald"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : item.badgeColor === "blue"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : item.badgeColor === "amber"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-purple-50 text-purple-800 border-purple-200";

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-2xs ${badgeStyles}`}>
                    {item.badge}
                  </span>
                  {item.metrics?.potentialGain && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.metrics.potentialGain}
                    </span>
                  )}
                  {item.metrics?.suggestedPrice && !item.metrics?.potentialGain && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      GH₵ {item.metrics.suggestedPrice}
                    </span>
                  )}
                  {item.metrics?.viewsCount && (
                    <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.metrics.viewsCount} Views
                    </span>
                  )}
                  {item.metrics?.stuckUnits && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.metrics.stuckUnits} Unsold
                    </span>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h4>

                <div className="space-y-1.5 text-[11px] pt-1">
                  {item.storeFact && (
                    <div className="flex items-start gap-1.5 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-900 shrink-0">🏪 Your Shop:</span>
                      <span className="leading-relaxed">{item.storeFact}</span>
                    </div>
                  )}

                  {item.marketFact && (
                    <div className="flex items-start gap-1.5 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-blue-700 shrink-0">📈 Market Fact:</span>
                      <span className="leading-relaxed">{item.marketFact}</span>
                    </div>
                  )}

                  {item.recommendation && (
                    <div className="flex items-start gap-1.5 text-blue-900 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                      <span className="font-bold shrink-0">💡 What to do:</span>
                      <span className="leading-relaxed">{item.recommendation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                {item.secondaryActionText && item.secondaryActionUrl ? (
                  <Link
                    href={item.secondaryActionUrl}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    {item.secondaryActionText}
                  </Link>
                ) : (
                  <span />
                )}

                <Link
                  href={item.actionUrl}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sourced Research Report Card
function SourcedResearchReportView({
  report,
  onCopy,
  copied,
  onClose,
  onSave,
  isSaved,
}: {
  report: SourcedResearchReport;
  onCopy: () => void;
  copied: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
      
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
              📍 {report.location.split(",")[0]}
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-md">
              👥 {report.customerMarket}
            </span>
            {report.webSearchProvider && (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                🌐 {report.webSearchProvider}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {report.question}
          </h2>
          <span className="text-[11px] text-slate-400 block font-normal">
            Research compiled as of {report.retrievalTimestamp}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <button
            onClick={onSave}
            className={`h-8 px-2.5 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
              isSaved
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title="Save finding for later"
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" /> : <Bookmark className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>

          <button
            onClick={onCopy}
            className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Close Report"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* A. DIRECT ANSWER                                                   */}
      {/* ================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            A. Direct Answer
          </h3>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-100/90 space-y-2.5">
          <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
            {report.answerSummary}
          </p>

          {report.detectedGarmentFromImage && (
            <div className="flex items-center gap-2 pt-2 border-t border-blue-200/60 text-xs text-blue-900 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>Analyzed Reference Image:</strong> {report.detectedGarmentFromImage.name}
                {report.detectedGarmentFromImage.fabric ? ` (${report.detectedGarmentFromImage.fabric})` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* B. WHAT THE RESEARCH FOUND                                         */}
      {/* ================================================================== */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              B. What the Research Found
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {report.comparableItems.length} verifiable source{report.comparableItems.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Narrative findings */}
        {report.reasoning && (
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Market Analysis &amp; Findings
            </span>
            <p className="leading-relaxed whitespace-pre-line font-normal">
              {report.reasoning}
            </p>
          </div>
        )}

        {/* Investigated Styles */}
        {report.investigatedStyles && report.investigatedStyles.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              Styles Worth Investigating
            </span>

            <div className="space-y-2.5">
              {report.investigatedStyles.map((style, idx) => {
                const isObserved = style.evidenceStatus === "verified_observation";
                const isInference = style.evidenceStatus === "supported_inference";
                const isUnverified = style.evidenceStatus === "insufficient_evidence";

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {style.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({style.categoryOrOccasion})
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1 ${
                        isObserved
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isInference
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : isUnverified
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-purple-50 text-purple-800 border-purple-200"
                      }`}>
                        <span>Evidence status: {style.evidenceStatusLabel}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {style.description}
                    </p>

                    {style.tradeOffs && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5 leading-relaxed">
                        <span className="font-bold text-slate-700 shrink-0">Trade-offs:</span>
                        <span>{style.tradeOffs}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Statistics Bar */}
        {report.priceStats && (
          <div className="space-y-2 pt-1">
            <div className={`grid grid-cols-1 ${report.priceStats.bespokeRange ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-2.5`}>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ready-to-Wear Asking Range
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {report.priceStats.readyToWearRange
                    ? `GH₵ ${report.priceStats.readyToWearRange.min} – GH₵ ${report.priceStats.readyToWearRange.max}`
                    : report.priceStats.observedRange
                    ? `GH₵ ${report.priceStats.observedRange.min} – GH₵ ${report.priceStats.observedRange.max}`
                    : "No Listings Found"}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {report.comparableItems.filter((i) => i.productionType === "ready_to_wear").length > 0
                    ? `From ${report.comparableItems.filter((i) => i.productionType === "ready_to_wear").length} ready-to-wear listing(s)`
                    : "0 ready-to-wear listings"}
                </span>
              </div>

              {/* Listing Benchmark */}
              {report.priceStats.hasSufficientComparableData && report.priceStats.recommendedPriceRange?.sweetSpot ? (
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Listing Benchmark
                  </span>
                  <span className="text-sm font-extrabold text-emerald-900 block mt-0.5">
                    GH₵ {report.priceStats.recommendedPriceRange.sweetSpot}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">Ready-to-wear center point</span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Listing Benchmark
                  </span>
                  <span className="text-xs font-bold text-slate-700 block mt-1">
                    Not enough comparable prices found
                  </span>
                  <span className="text-[10px] text-slate-400 block">Need ≥ 3 comparable listings</span>
                </div>
              )}

              {report.priceStats.bespokeRange && (
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                    Bespoke / Custom
                  </span>
                  <span className="text-sm font-bold text-purple-900 block mt-0.5">
                    GH₵ {report.priceStats.bespokeRange.min} – GH₵ {report.priceStats.bespokeRange.max}
                  </span>
                  <span className="text-[10px] text-purple-600 block">Client custom fittings</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Confirmed Sales
                </span>
                <span className="text-sm font-bold text-indigo-900 block mt-0.5">
                  {report.priceStats.confirmedSalesRange
                    ? `GH₵ ${report.priceStats.confirmedSalesRange.min} – GH₵ ${report.priceStats.confirmedSalesRange.max}`
                    : "No Confirmed Sales"}
                </span>
                <span className="text-[10px] text-indigo-600 block">
                  {report.priceStats.confirmedSalesRange ? "Verified orders on TrendiZip" : "0 local orders recorded"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                <strong>Pricing Note:</strong> A competitor's asking price shows what they ask, not verified sales volume. Calculating profit margin requires your specific fabric yardage and tailor costs.
              </span>
            </div>
          </div>
        )}

        {/* Comparable Products Comparisons (Desktop Table + Mobile Stacked Cards) */}
        {report.comparableItems.length > 0 ? (
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              Comparable Products &amp; Prices
            </span>

            {/* Desktop Table View (hidden on mobile, visible on md+) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold text-[11px]">
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Garment &amp; Style</th>
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Fabric</th>
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Price</th>
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Price Type</th>
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Production Type</th>
                      <th className="py-2.5 px-3.5 border-b border-slate-800 whitespace-nowrap">Location &amp; Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.comparableItems.slice(0, 8).map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-blue-50/20" : "bg-slate-50/40 hover:bg-blue-50/20"}>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800">
                          {item.title}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                          {item.fabric || "Textile"}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                          {item.currency} {item.price}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {item.priceType === "confirmed_sale" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Confirmed Sale</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                              <span>🏷️ Listed Asking Price</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {item.productionType === "bespoke_custom" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold text-[10px]">
                              <span>✂️ Bespoke / Custom</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[10px]">
                              <span>👗 Ready-to-Wear</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          <div className="flex items-center gap-1">
                            <span>{item.location} ({item.sourceName})</span>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Cards View (visible on mobile, hidden on md+) */}
            <div className="block md:hidden space-y-2.5">
              {report.comparableItems.slice(0, 8).map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 leading-snug">{item.title}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0 text-sm">
                      {item.currency} {item.price}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {item.priceType === "confirmed_sale" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Confirmed Sale</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        <span>🏷️ Listed Asking Price</span>
                      </span>
                    )}

                    {item.productionType === "bespoke_custom" ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                        ✂️ Bespoke
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                        👗 Ready-to-Wear
                      </span>
                    )}

                    {item.fabric && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                        🧵 {item.fabric}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>📍 {item.location} ({item.sourceName})</span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
            <span className="text-xs font-bold text-slate-800 block">
              We found some relevant listings, but not enough evidence to establish overall market demand.
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-lg mx-auto">
              We did not find verified local competitor sales records matching this exact garment in {report.location.split(",")[0]}. General fashion recommendations and test-production steps are provided below.
            </p>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* C. WHAT THIS MEANS FOR THE SELLER                                  */}
      {/* ================================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            C. What This Means for the Seller
          </h3>
        </div>

        <div className="space-y-2">
          {report.shopImplications.nextSteps.map((step, sIdx) => (
            <div
              key={sIdx}
              className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs sm:text-sm"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {sIdx + 1}
              </span>
              <div className="flex-1">
                <span className="font-bold text-slate-900 block">{step.title}</span>
                <span className="text-slate-700 leading-relaxed font-normal block mt-0.5">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assumptions Made
            </span>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              {report.shopImplications.assumptions.map((a, aIdx) => (
                <li key={aIdx} className="leading-relaxed">{a}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Details Still Needed from You
            </span>
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              {report.shopImplications.missingInformation.map((m, mIdx) => (
                <li key={mIdx} className="leading-relaxed">{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* D. RECOMMENDED NEXT STEP                                           */}
      {/* ================================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            D. Recommended Next Step
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended Validation Action</span>
          </div>
          <p className="text-slate-800 font-medium leading-relaxed">
            {report.shopImplications.smallTestBatch}
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* E. SOURCES AND LIMITATIONS                                         */}
      {/* ================================================================== */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            E. Sources and Limitations
          </h3>
        </div>

        {report.sources && report.sources.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sources Used &amp; Retrieval Dates
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {report.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                >
                  <span>{s.title}</span>
                  <span className="text-slate-400 text-[10px]">({s.date})</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}

        {report.evidenceQuality.limitationsNote && (
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900 leading-relaxed">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Scope &amp; Limitations: </span>
              <span>{report.evidenceQuality.limitationsNote}</span>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Anti-Hallucination &amp; Data Verification Policy</span>
          </div>
          <p className="leading-relaxed">
            Every product listing or price shown comes from a retrieved source or validated platform database record. A competitor's listed asking price shows what they ask, not verified customer sales volume. Statistical market benchmarks are suppressed when fewer than 3 comparable listings exist to protect sellers from misleading data.
          </p>
        </div>
      </div>

    </div>
  );
}

const EXAMPLE_QUESTIONS = [
  "What clothing styles should I consider selling in Accra?",
  "How much do similar linen dresses cost?",
  "Is this design worth making?",
  "Which fabrics should I use for this outfit?",
];

const LOADING_STEPS = [
  "Understanding your question…",
  "Looking for relevant fashion listings…",
  "Comparing available prices…",
  "Preparing your findings…",
];

export default function MarketResearchPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Fashion Creator";

  const [selectedCity, setSelectedCity] = useState<string>("Accra, Ghana");
  const [customerMarket, setCustomerMarket] = useState<string>("Local Shoppers");
  const [isCustomCity, setIsCustomCity] = useState<boolean>(false);
  const [customCityInput, setCustomCityInput] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReportTitle, setActiveReportTitle] = useState<string>("");
  
  // Results: Structured Sourced Report + Plain Markdown Fallback
  const [sourcedReport, setSourcedReport] = useState<SourcedResearchReport | null>(null);
  const [reportResult, setReportResult] = useState<string | null>(null);
  
  const [extractedSwatches, setExtractedSwatches] = useState<ExtractedSwatch[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [storeTelemetry, setStoreTelemetry] = useState<StoreTelemetry | null>(null);
  const [suggestions, setSuggestions] = useState<MarketSuggestion[]>([]);

  // Saved Research History (Persisted in localStorage)
  const [savedReports, setSavedReports] = useState<SourcedResearchReport[]>([]);

  // Voice & File Upload States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileBase64, setAttachedFileBase64] = useState<string | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Progressive Loading Step Timer
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  // Load Saved Reports from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("trendizip_saved_market_research_v1");
      if (stored) {
        setSavedReports(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Save/Delete Report Handlers
  const handleSaveReport = (rep: SourcedResearchReport) => {
    try {
      const exists = savedReports.some((r) => r.id === rep.id || r.question === rep.question);
      let updated: SourcedResearchReport[];
      if (exists) {
        updated = savedReports.filter((r) => r.id !== rep.id && r.question !== rep.question);
        toast.info("Removed from saved research");
      } else {
        updated = [rep, ...savedReports].slice(0, 10);
        toast.success("Saved to your research history");
      }
      setSavedReports(updated);
      localStorage.setItem("trendizip_saved_market_research_v1", JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem("trendizip_saved_market_research_v1", JSON.stringify(updated));
    } catch {}
    toast.success("Removed from history");
  };

  // Sync Telemetry on City Change
  useEffect(() => {
    const activeCity = isCustomCity && customCityInput.trim() ? customCityInput.trim() : selectedCity;
    fetch("/api/ai/market-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "seller-health", 
        payload: { cityLocation: activeCity, customerMarket } 
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
        if (data.telemetry) {
          setStoreTelemetry({
            activeProducts: data.telemetry.activeProducts || 0,
            totalStock: data.telemetry.totalStock || 0,
            activeServices: data.telemetry.activeServices || 0,
            totalReviews: data.telemetry.totalReviews || 0,
            avgRating: data.telemetry.avgRating || "5.0",
            totalBookings: data.telemetry.totalBookings || 0,
            totalOrders: data.telemetry.totalOrders || 0,
            totalUnitsSold: data.telemetry.totalUnitsSold || 0,
            businessName: data.telemetry.businessName || "Your Store",
            highInterestCount: data.telemetry.highInterestCount || 0,
            stagnantCount: data.telemetry.stagnantCount || 0,
            avgMarketPrice: data.telemetry.avgMarketPrice || data.avgMarketPrice || 280,
            topMarketSizes: data.telemetry.topMarketSizes || data.topMarketSizes || "Medium and Large",
          });
        }
      })
      .catch(() => {});
  }, [selectedCity, customerMarket, isCustomCity, customCityInput]);

  // Extract Swatches for Color Queries
  useEffect(() => {
    const textToScan = sourcedReport?.markdownReport || reportResult;
    if (!textToScan) {
      setExtractedSwatches([]);
      return;
    }
    const hexRegex = /#([A-Fa-f0-9]{6})/g;
    const matches = Array.from(textToScan.matchAll(hexRegex));
    const uniqueHexes = Array.from(new Set(matches.map((m) => m[0])));
    const swatches = uniqueHexes.slice(0, 6).map((hex, idx) => ({
      name: `Color ${idx + 1}`,
      hex,
    }));
    setExtractedSwatches(swatches);
  }, [sourcedReport, reportResult]);

  // Run Query
  const handleQuery = async (action: string, title: string, customQuery?: string) => {
    if (loading) return;
    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);
    setActiveReportTitle(title);
    setSourcedReport(null);
    setReportResult(null);

    const activeCity = isCustomCity && customCityInput.trim() ? customCityInput.trim() : selectedCity;

    try {
      const res = await fetch("/api/ai/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          payload: {
            cityLocation: activeCity,
            customerMarket,
            customQuery: customQuery || title,
            attachedFile: attachedFileName,
            attachedFileBase64: attachedFileBase64 || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research is temporarily unavailable. Please try again shortly.");

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }

      if (data.sourcedReport) {
        setSourcedReport(data.sourcedReport);
      }
      setReportResult(data.result);
      toast.success("Market research ready");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      const fallbackMsg = "Research is temporarily unavailable. Please try again shortly.";
      setErrorMessage(errObj.message || fallbackMsg);
      toast.error(errObj.message || fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (!searchQuery.trim() && !attachedFileName) return;
    const q = searchQuery.trim() || `Analyze design reference: ${attachedFileName}`;
    setSearchQuery("");
    handleQuery("fashion-copilot", `Question: "${q}"`, q);
  };

  // Voice Input Speech Recognition
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Please type your query.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... ask your fashion question");
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          toast.success(`Heard: "${transcript}"`);
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setAttachedFileBase64(res);
        setAttachedFilePreview(res);
        toast.success(`Attached reference: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFileName(null);
    setAttachedFileBase64(null);
    setAttachedFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Check if current report is already saved
  const isCurrentSaved = Boolean(
    sourcedReport &&
    savedReports.some((r) => r.id === sourcedReport.id || r.question === sourcedReport.question)
  );

  return (
    <div
      className="w-full min-h-[calc(100dvh-4.25rem)] flex flex-col font-sans select-none relative pb-16"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 35%, #f1f5f9 70%, #eff6ff 100%)",
      }}
    >
      {/* Decorative Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ================================================================== */}
        {/* 1. TITLE & DESCRIPTION                                             */}
        {/* ================================================================== */}
        <div className="text-center pt-2 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Market Research Made Simple
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">
            Find fashion trends, compare prices, and discover what to make next.
          </p>
        </div>

        {/* Dynamic Mascot Greeting */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-1">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-sm hover:scale-105 transition-transform duration-300">
            <Image
              src="/trendichat.png"
              alt="Trendi Mascot"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xs border border-slate-200/80 text-xs text-slate-700 text-center sm:text-left space-y-0.5">
            <div className="font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
              <span>Trendi Market Assistant</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded-full font-bold border border-emerald-200">
                Verified Evidence
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              {sourcedReport
                ? `Researched "${activeReportTitle || sourcedReport.question}" across ${sourcedReport.location.split(",")[0]} (${customerMarket}) with ${sourcedReport.evidenceQuality.sampleSize} verified sources.`
                : `Hi ${userName}! Ask any question about clothing styles, prices, or what to sew next in your market.`}
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 2. FOCUSED RESEARCH WORKSPACE (SINGLE QUESTION BOX + LOCATION)    */}
        {/* ================================================================== */}
        <div className="max-w-2xl sm:max-w-3xl mx-auto space-y-3">
          
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
            
            {/* Location & Market Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Market Being Researched:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* City Selector */}
                {!isCustomCity ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors">
                    <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setIsCustomCity(true);
                        } else {
                          setSelectedCity(e.target.value);
                        }
                      }}
                      className="bg-transparent outline-none cursor-pointer text-xs font-semibold text-slate-800 pr-1"
                      title="Change target location"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="custom">✏️ Other City / Custom Location...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-400 rounded-xl text-xs">
                    <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Takoradi, Ghana"
                      value={customCityInput}
                      onChange={(e) => setCustomCityInput(e.target.value)}
                      className="outline-none text-xs text-slate-800 font-semibold w-36"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCity(false);
                        setCustomCityInput("");
                      }}
                      className="text-slate-400 hover:text-slate-700 font-bold ml-1 text-xs cursor-pointer"
                      title="Return to preset cities"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Customer Segment */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors">
                  <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                  <select
                    value={customerMarket}
                    onChange={(e) => setCustomerMarket(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer text-xs font-semibold text-slate-800 pr-1"
                    title="Change customer market segment"
                  >
                    {CUSTOMER_MARKETS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Attached Image Preview if Uploaded */}
            {attachedFilePreview && (
              <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-blue-200 shrink-0 relative">
                    <img
                      src={attachedFilePreview}
                      alt="Attached preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {attachedFileName || "Design Reference"}
                    </span>
                    <span className="text-[10px] text-blue-700 font-medium block">
                      📷 Design ready for visual &amp; fabric analysis
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeAttachment}
                  className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove image"
                >
                  Remove
                </button>
              </div>
            )}

            {/* One Large Question Input */}
            <form onSubmit={handleCustomSearchSubmit} className="relative">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs p-2 sm:p-2.5 flex items-center gap-2.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask any question... e.g. What clothing styles should I consider selling in Accra?"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  disabled={loading}
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Attach product or design sketch"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Speech Input */}
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    disabled={loading}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isListening
                        ? "bg-rose-500 text-white animate-pulse"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                    }`}
                    title="Speak question"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Clear Research Button */}
                  <button
                    type="submit"
                    disabled={loading || (!searchQuery.trim() && !attachedFileBase64)}
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    title="Start Research"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Research</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Rotating / Selectable Example Questions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block px-0.5">
                Examples you can research with one click:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_QUESTIONS.map((exampleQ, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(exampleQ);
                      handleQuery("fashion-copilot", `Question: "${exampleQ}"`, exampleQ);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium border border-slate-200/80 hover:border-blue-300 transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    "{exampleQ}"
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. ERROR & PROGRESS STATES                                         */}
        {/* ================================================================== */}
        {errorMessage && !loading && (
          <div className="max-w-2xl sm:max-w-3xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Research Temporarily Unavailable</span>
              <p className="text-amber-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 4. RESEARCH RESULTS DISPLAY                                        */}
        {/* ================================================================== */}
        <div ref={resultsRef} className="max-w-2xl sm:max-w-3xl mx-auto">
          
          {/* Progressive Loading State (Requirement 10) */}
          {loading && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 p-2.5 shadow-2xs flex items-center justify-center">
                <Image
                  src="/trendichat.png"
                  alt="Trendi Mascot"
                  width={52}
                  height={52}
                  className="object-contain animate-bounce"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 animate-pulse">
                  {LOADING_STEPS[loadingStep]}
                </h3>
                <p className="text-xs text-slate-500">
                  Researching {isCustomCity && customCityInput ? customCityInput : selectedCity.split(",")[0]} for {customerMarket}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {LOADING_STEPS.map((stepText, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === loadingStep
                        ? "w-8 bg-blue-600"
                        : idx < loadingStep
                        ? "w-4 bg-emerald-500"
                        : "w-4 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sourced Report Card View (Primary High-Trust Experience) */}
          {!loading && sourcedReport && (
            <SourcedResearchReportView
              report={sourcedReport}
              onCopy={() => {
                navigator.clipboard.writeText(sourcedReport.markdownReport);
                setCopied(true);
                toast.success("Research report copied to clipboard");
                setTimeout(() => setCopied(false), 2000);
              }}
              copied={copied}
              onClose={() => {
                setSourcedReport(null);
                setReportResult(null);
              }}
              onSave={() => handleSaveReport(sourcedReport)}
              isSaved={isCurrentSaved}
            />
          )}

          {/* Fallback Markdown View (if plain text report) */}
          {!loading && !sourcedReport && reportResult && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
              
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {selectedCity.split(",")[0]}
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {activeReportTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportResult);
                      setCopied(true);
                      toast.success("Report copied to clipboard");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={() => setReportResult(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Close Report"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Extracted Swatches (if color analysis) */}
              {extractedSwatches.length > 0 && (
                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    Trending Colors for This Season:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {extractedSwatches.map((swatch, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          navigator.clipboard.writeText(swatch.hex);
                          toast.success(`Copied ${swatch.hex}`);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md cursor-pointer hover:border-blue-300 transition-colors shadow-2xs"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-xs font-mono font-semibold text-slate-700 uppercase">
                          {swatch.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Markdown Content */}
              <div className="pt-1">
                <SimpleFormattedMarkdown content={reportResult} />
              </div>

            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* 6. SAVED RESEARCH HISTORY SHELF                                   */}
        {/* ================================================================== */}
        {savedReports.length > 0 && (
          <div className="max-w-2xl sm:max-w-3xl mx-auto p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Saved Research Reports ({savedReports.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setSavedReports([]);
                  try {
                    localStorage.removeItem("trendizip_saved_market_research_v1");
                  } catch {}
                  toast.success("Saved research history cleared");
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2">
              {savedReports.map((saved) => (
                <div
                  key={saved.id}
                  onClick={() => {
                    setSourcedReport(saved);
                    setActiveReportTitle(saved.question);
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                    toast.info(`Loaded report: "${saved.question}"`);
                  }}
                  className="p-3 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate block">
                      {saved.question}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      📍 {saved.location.split(",")[0]} • 👥 {saved.customerMarket} • {saved.retrievalTimestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleDeleteSavedReport(saved.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}