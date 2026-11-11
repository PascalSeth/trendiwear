"use client";

import React from "react";
import Image from "next/image";
import {
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  MapPin,
  Tag,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Opportunity } from "@/lib/ai/market-radar/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onViewResearch: (opp: Opportunity) => void;
  isSaved?: boolean;
  onToggleSave?: (opp: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  onViewResearch,
  isSaved = false,
  onToggleSave,
}: OpportunityCardProps) {
  const {
    title,
    category,
    thumbnailUrl,
    moodVibe,
    colorPalette = [],
    whyNow,
    timing,
    metrics,
    geographicScope,
    confidence,
    confidenceReason,
    sourceCount,
    chartData = [],
  } = opportunity;

  // Confidence styling
  const confidenceStyles = {
    HIGH: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    MODERATE: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    LIMITED: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    EVENT_HYPOTHESIS: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  }[confidence];

  // Timing badge styling
  const timingBadgeBg = {
    sell_now: "bg-emerald-950/80 text-emerald-200 border-emerald-500/40",
    peak_demand: "bg-purple-950/80 text-purple-200 border-purple-500/40",
    prepare_now: "bg-blue-950/80 text-blue-200 border-blue-500/40",
    cooldown: "bg-slate-900/80 text-slate-300 border-slate-500/40",
  }[timing.status] || "bg-black/70 text-white border-white/20";

  // Calculate mini-sparkline SVG path
  const sparkPoints = chartData.map((d, i) => {
    const x = (i / 11) * 100;
    const y = 30 - (d.value / 100) * 26;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      {/* 1. Pictorial Editorial Thumbnail Header */}
      <div>
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/15 via-muted to-primary/5 flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">{category}</span>
            </div>
          )}

          {/* Vignette Overlay for Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

          {/* Top Floating Row: Timing Badge & Bookmark Save Button */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-sm ${timingBadgeBg}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {timing.label}
            </span>

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(opportunity);
                }}
                className="p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-105 shadow-sm"
                title={isSaved ? "Remove from saved research" : "Save this opportunity"}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${isSaved ? "fill-primary text-primary" : "text-white"}`}
                />
              </button>
            )}
          </div>

          {/* Bottom Floating Row on Image: Category & TikTok Momentum */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] z-10">
            <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px]">
              {category}
            </span>

            {metrics.secondary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md font-semibold text-amber-300 border border-amber-500/30">
                <Flame className="w-3 h-3 text-amber-400" />
                {metrics.secondary.value}
              </span>
            )}
          </div>
        </div>

        {/* 2. Garment Details & Editorial Copy */}
        <div className="p-4 sm:p-5 space-y-3">
          {moodVibe && (
            <div className="text-[11px] font-semibold tracking-wider uppercase text-primary/90 flex items-center gap-1">
              <span>{moodVibe}</span>
            </div>
          )}

          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {whyNow}
          </p>

          {/* Color Palette Swatches */}
          {colorPalette.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">
                Trending Palette:
              </span>
              <div className="flex items-center gap-1.5">
                {colorPalette.map((color, idx) => (
                  <div
                    key={idx}
                    className="relative group/swatch"
                    title={`${color.name} (${color.role})`}
                  >
                    <div
                      style={{ backgroundColor: color.hex }}
                      className="h-4 w-4 rounded-full border border-border/80 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Seasonality Sparkline & Metrics Barometer */}
          <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
            {/* Primary Demand Index */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>{metrics.primary.label}</span>
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>

              <div className="text-base font-extrabold text-foreground mt-0.5">
                {metrics.primary.value}
              </div>

              {/* Mini Sparkline Curve */}
              {chartData.length > 0 && (
                <div className="w-full h-6 mt-1">
                  <svg viewBox="0 0 100 32" className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary/70"
                      points={sparkPoints}
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Observed Asking Price Sweet Spot */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>Asking Sweet-Spot</span>
                <Tag className="w-3 h-3 text-muted-foreground" />
              </div>

              {metrics.observedPriceRange ? (
                <>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {metrics.observedPriceRange.currency} {metrics.observedPriceRange.sweetSpot}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Range: {metrics.observedPriceRange.min} – {metrics.observedPriceRange.max} ({metrics.observedPriceRange.sampleCount} shops)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    Festive Active
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Bespoke / RTW
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scope and Confidence Tag */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1 text-muted-foreground truncate">
              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
              <span className={`truncate ${geographicScope.isBroaderScope ? "text-amber-700 dark:text-amber-400 font-medium" : ""}`}>
                {geographicScope.actual}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border ${confidenceStyles}`}
              title={confidenceReason}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>{confidence.replace("_", " ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Layers className="w-3 h-3 text-primary" />
            <span>{sourceCount} evidence citation{sourceCount !== 1 ? "s" : ""}</span>
          </div>

          <button
            type="button"
            onClick={() => onViewResearch(opportunity)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs group/btn"
          >
            <span>View research</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
