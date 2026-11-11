"use client";

import React, { useState } from "react";
import {
  MapPin,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  X,
  History,
  TrendingUp,
} from "lucide-react";
import {
  RadarLocation,
  RadarViewMode,
  CustomerSegment,
  PriceBand,
} from "@/lib/ai/market-radar/types";

interface MarketRadarFiltersProps {
  location: RadarLocation;
  onOpenLocationModal: () => void;
  category: string;
  onSelectCategory: (cat: string) => void;
  viewMode: RadarViewMode;
  onSelectViewMode: (mode: RadarViewMode) => void;
  month: number;
  year: number;
  onChangeMonthYear: (m: number, y: number) => void;
  customerSegment: CustomerSegment;
  onChangeSegment: (s: CustomerSegment) => void;
  priceBand: PriceBand;
  onChangePriceBand: (b: PriceBand) => void;
  isLoading: boolean;
}

const CATEGORIES = [
  { id: "all", label: "All Clothing" },
  { id: "womenswear", label: "Womenswear" },
  { id: "menswear", label: "Menswear" },
  { id: "tshirts", label: "T-Shirts & Streetwear" },
  { id: "occasionwear", label: "Occasionwear" },
  { id: "childrenswear", label: "Childrenswear" },
];

const MONTHS = [
  { val: 1, name: "January" },
  { val: 2, name: "February" },
  { val: 3, name: "March" },
  { val: 4, name: "April" },
  { val: 5, name: "May" },
  { val: 6, name: "June" },
  { val: 7, name: "July" },
  { val: 8, name: "August" },
  { val: 9, name: "September" },
  { val: 10, name: "October" },
  { val: 11, name: "November" },
  { val: 12, name: "December" },
];

export function MarketRadarFilters({
  location,
  onOpenLocationModal,
  category,
  onSelectCategory,
  viewMode,
  onSelectViewMode,
  month,
  year,
  onChangeMonthYear,
  customerSegment,
  onChangeSegment,
  priceBand,
  onChangePriceBand,
  isLoading,
}: MarketRadarFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isPast = year < currentYear || (year === currentYear && month < currentMonth);
  const isFuture = year > currentYear || (year === currentYear && month > currentMonth);

  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const hasSecondaryFilters = customerSegment !== "all" || priceBand !== "all";

  return (
    <div className="space-y-3">
      {/* Primary Toolbar: Location Pill, Category Tabs, View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Location & Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location setup trigger */}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-muted/70 text-xs font-medium text-foreground transition-all shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {location.city}, {location.country}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
          </button>

          {/* Category Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: View Mode Segmented Controls */}
        <div className="flex items-center gap-1.5 self-start lg:self-auto">
          <div className="inline-flex p-1 rounded-lg bg-muted/60 border border-border/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => onSelectViewMode("sell-now")}
              className={`inline-flex items-center px-3 py-1.5 rounded-md transition-all ${
                viewMode === "sell-now"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Sell now
            </button>
            <button
              type="button"
              onClick={() => onSelectViewMode("prepare-next")}
              className={`inline-flex items-center px-3 py-1.5 rounded-md transition-all ${
                viewMode === "prepare-next"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1.5 text-blue-500" />
              Prepare next
            </button>
            <button
              type="button"
              onClick={() => onSelectViewMode("explore-month")}
              className={`inline-flex items-center px-3 py-1.5 rounded-md transition-all ${
                viewMode === "explore-month"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-3 h-3 mr-1.5 text-purple-500" />
              Explore a month
            </button>
          </div>

          {/* Filter expansion toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`p-1.5 rounded-lg border border-border/80 transition-colors ${
              hasSecondaryFilters || showMoreFilters
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Additional customer and price filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Explore a Month Sub-bar */}
      {viewMode === "explore-month" && (
        <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Target Month & Year:</span>
          </div>

          <select
            value={month}
            onChange={(e) => onChangeMonthYear(Number(e.target.value), year)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m.val} value={m.val}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => onChangeMonthYear(month, Number(e.target.value))}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {isPast && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-[11px] border border-amber-500/20">
              <History className="w-3 h-3" />
              Historical Demand Season
            </span>
          )}

          {isFuture && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-[11px] border border-blue-500/20">
              <TrendingUp className="w-3 h-3" />
              Forward Projection (Estimated)
            </span>
          )}

          {!isPast && !isFuture && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
              Current Calendar Cycle
            </span>
          )}
        </div>
      )}

      {/* Secondary Filters Collapsible Drawer */}
      {showMoreFilters && (
        <div className="p-3 rounded-lg bg-card border border-border/80 shadow-xs space-y-3 text-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Advanced Merchandising Filters</span>
            {hasSecondaryFilters && (
              <button
                type="button"
                onClick={() => {
                  onChangeSegment("all");
                  onChangePriceBand("all");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Segment */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Target Shopper Segment
              </label>
              <div className="flex flex-wrap gap-1">
                {(["all", "local", "diaspora", "tourists", "professionals"] as CustomerSegment[]).map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => onChangeSegment(seg)}
                    className={`px-2 py-1 rounded-md text-[11px] capitalize transition-colors ${
                      customerSegment === seg
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Band */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Target Price Band
              </label>
              <div className="flex flex-wrap gap-1">
                {(["all", "budget", "mid", "premium"] as PriceBand[]).map((pb) => (
                  <button
                    key={pb}
                    type="button"
                    onClick={() => onChangePriceBand(pb)}
                    className={`px-2 py-1 rounded-md text-[11px] capitalize transition-colors ${
                      priceBand === pb
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pb === "all" ? "All Price Bands" : pb}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

