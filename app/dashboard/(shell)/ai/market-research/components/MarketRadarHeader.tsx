"use client";

import React from "react";
import { RefreshCw, Bookmark, Sparkles, Clock, MapPin } from "lucide-react";
import { MarketRadarContext } from "@/lib/ai/market-radar/types";

interface MarketRadarHeaderProps {
  context?: MarketRadarContext;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSaved: () => void;
  savedCount: number;
}

export function MarketRadarHeader({
  context,
  isLoading,
  onRefresh,
  onOpenSaved,
  savedCount,
}: MarketRadarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Market Radar
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3 h-3" />
              Live Discovery
            </span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Location-grounded, seasonal fashion intelligence for sellers in{" "}
          <span className="font-medium text-foreground underline decoration-primary/40 underline-offset-2">
            {context?.location.city || "Accra"}, {context?.location.country || "Ghana"}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onOpenSaved}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/60 text-foreground transition-colors shadow-xs"
        >
          <Bookmark className="w-3.5 h-3.5 text-primary" />
          <span>Saved</span>
          {savedCount > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-bold">
              {savedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted/60 text-foreground transition-colors shadow-xs disabled:opacity-50"
          title="Refresh live research telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {context?.analysisDate && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/50">
            <Clock className="w-3 h-3 text-muted-foreground/80" />
            <span>Updated: {context.analysisDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}

