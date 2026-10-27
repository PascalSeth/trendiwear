"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingDown,
  ShoppingBag,
  Eye,
  AlertTriangle,
  Flame,
  Gem,
  Ghost,
  HelpCircle,
  Search,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ChevronRight,
  Sliders,
  Scissors
} from "lucide-react";
import type { CustomerBehaviorAnalyticsData, BehavioralProductItem, BehavioralQuadrant } from "@/lib/ai/types";

export default function CustomerIntentPage() {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<CustomerBehaviorAnalyticsData | null>(null);
  const [aiBriefing, setAiBriefing] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Your Studio");
  const [activeTab, setActiveTab] = useState<BehavioralQuadrant>("CURIOUS_HESITATOR");

  const fetchData = async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/customer-intent?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setAiBriefing(json.aiBriefing);
        if (json.businessName) setBusinessName(json.businessName);
      }
    } catch (err) {
      console.error("Failed to load customer intent data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(periodDays);
  }, [periodDays]);

  const matrix = data?.matrix || {
    curiousHesitators: [],
    hiddenGems: [],
    cashCows: [],
    deadWeight: [],
  };

  const getProductsForTab = (): BehavioralProductItem[] => {
    switch (activeTab) {
      case "CURIOUS_HESITATOR":
        return matrix.curiousHesitators;
      case "HIDDEN_GEM":
        return matrix.hiddenGems;
      case "CASH_COW":
        return matrix.cashCows;
      case "DEAD_WEIGHT":
        return matrix.deadWeight;
      default:
        return [];
    }
  };

  const currentProducts = getProductsForTab();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-3 sm:p-6 font-sans">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/dashboard/ai-studio"
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft size={13} /> AI Copilot Suite
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 font-semibold">
              Behavioral Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Customer Intent & Friction Diagnostics
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyzing how shoppers click, inspect, hesitate, and abandon products across {businessName}&apos;s storefront.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodDays === days
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(periodDays)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Diagnostics"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Hero: Money Left on the Table & AI Strategic Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Lost Revenue Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1.5">
                <TrendingDown size={13} className="text-rose-400" />
                Revenue Friction Leak
              </span>
              <span className="text-xs text-slate-400">Past {periodDays} Days</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              GH₵ {data?.estimatedLostRevenueGhs?.toLocaleString() ?? "0"}
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Estimated customer spending intent lost to cart abandonment, bespoke sizing hesitation, and checkout drop-offs.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Store Views</div>
              <div className="text-base font-bold text-white mt-0.5">{data?.totalViews ?? 0}</div>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Cart Adds</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">{data?.totalCartAdds ?? 0}</div>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Conversion</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {data?.storewideConversionRate ?? 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Executive Diagnosis */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Diagnostic Briefing</h3>
                  <p className="text-[11px] text-slate-500">Autonomous intent analysis of shopper behavior</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                Deterministic + LLM
              </span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans mt-2">
              {loading ? (
                <div className="space-y-2 py-2 animate-pulse">
                  <div className="h-3.5 bg-slate-200 rounded w-full" />
                  <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                  <div className="h-3.5 bg-slate-200 rounded w-4/6" />
                </div>
              ) : (
                aiBriefing || "Sufficient telemetry is compiling. Browse and inspect products to generate custom diagnostic briefs."
              )}
            </div>
          </div>

          {/* Core Friction Gauges */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Scissors size={12} className="text-amber-500" /> Sizing Anxiety
                </span>
                <span className="font-semibold text-slate-800">
                  {data?.frictionMetrics.measurementAnxietyDropPercent ?? 38}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data?.frictionMetrics.measurementAnxietyDropPercent ?? 38}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-rose-500" /> Turnaround Drop
                </span>
                <span className="font-semibold text-slate-800">
                  {data?.frictionMetrics.productionTurnaroundDropPercent ?? 27}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data?.frictionMetrics.productionTurnaroundDropPercent ?? 27}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <DollarSign size={12} className="text-indigo-500" /> Price Barrier
                </span>
                <span className="font-semibold text-slate-800">
                  {data?.frictionMetrics.priceShockDropPercent ?? 35}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data?.frictionMetrics.priceShockDropPercent ?? 35}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The 2x2 Product Behavioral Matrix */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Behavioral Product Matrix (2x2 Intent Engine)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Categorizing each garment by shopper engagement vs actual buying action.
            </p>
          </div>

          {/* Quadrant Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("CURIOUS_HESITATOR")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "CURIOUS_HESITATOR"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <AlertTriangle size={13} />
              Curious Hesitators ({matrix.curiousHesitators.length})
            </button>

            <button
              onClick={() => setActiveTab("HIDDEN_GEM")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "HIDDEN_GEM"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Gem size={13} />
              Hidden Gems ({matrix.hiddenGems.length})
            </button>

            <button
              onClick={() => setActiveTab("CASH_COW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "CASH_COW"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Flame size={13} />
              Cash Cows ({matrix.cashCows.length})
            </button>

            <button
              onClick={() => setActiveTab("DEAD_WEIGHT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "DEAD_WEIGHT"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Ghost size={13} />
              Ignored ({matrix.deadWeight.length})
            </button>
          </div>
        </div>

        {/* Tab Description Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <div>
            {activeTab === "CURIOUS_HESITATOR" && (
              <span>
                <strong>Curious Hesitators:</strong> Shoppers repeatedly inspect and add these items to their cart, but drop off before purchase.
                Fixing fit anxiety, sizing clarity, or offering ready-to-wear options unlocks immediate revenue.
              </span>
            )}
            {activeTab === "HIDDEN_GEM" && (
              <span>
                <strong>Hidden Gems:</strong> High conversion rate whenever shoppers find them, but they suffer from low traffic.
                Promote them to your hero banner or showcase portfolio to capture ready buyers.
              </span>
            )}
            {activeTab === "CASH_COW" && (
              <span>
                <strong>Cash Cows:</strong> Consistently strong views and high conversions. Ensure your fabric supply is stocked
                and consider building matching accessories or collection variations.
              </span>
            )}
            {activeTab === "DEAD_WEIGHT" && (
              <span>
                <strong>Ignored / Dead Inventory:</strong> Shoppers rarely click these items in the catalogue. Refresh cover photography,
                reposition styling tags, or package them into bundles.
              </span>
            )}
          </div>
        </div>

        {/* Product Cards List */}
        {currentProducts.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Ghost size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No products currently in this quadrant</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              As shopper interaction telemetry aggregates, pieces will dynamically shift between quadrants.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-16 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                      {prod.imageUrl ? (
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate" title={prod.name}>
                        {prod.name}
                      </h4>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        GH₵ {prod.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Eye size={11} className="text-slate-400" /> {prod.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={11} className="text-amber-500" /> {prod.cartAdds} in carts
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-500" /> {prod.orders} sold
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis & Friction Explanation */}
                  {prod.primaryFrictionReason && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 leading-snug">
                      <span className="font-semibold text-slate-800">AI Diagnosis: </span>
                      {prod.primaryFrictionReason}
                    </div>
                  )}

                  {/* Micro-telemetry pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Dwell: {prod.avgDwellSeconds}s
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Abandon: {prod.cartAbandonmentRate}%
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-medium">
                      Conv: {prod.conversionRate}%
                    </span>
                  </div>
                </div>

                {/* Prescribed One-Click Action Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                  <Link
                    href={prod.prescribedAction.href}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <span>{prod.prescribedAction.label}</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phantom Search Demand Radar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Compass size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                Phantom Demand Radar (Unmet Fashion Searches)
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Zero-Result Queries
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                What shoppers searched for that returned 0 results. Use this to design in-demand drops.
              </p>
            </div>
          </div>
        </div>

        {data?.phantomDemand && data.phantomDemand.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.phantomDemand.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Search size={11} className="text-purple-500" />
                      {item.searchCount} search{item.searchCount > 1 ? "es" : ""}
                    </span>
                    {item.category && (
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 capitalize">&ldquo;{item.query}&rdquo;</div>
                </div>

                <Link
                  href={`/dashboard/ai/launch-planner?theme=${encodeURIComponent(item.query)}`}
                  className="mt-3 text-[11px] font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                >
                  Plan Collection for This <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            No zero-result searches logged in this timeframe. As visitors search the marketplace, unmet requests will populate here.
          </div>
        )}
      </div>
    </div>
  );
}
