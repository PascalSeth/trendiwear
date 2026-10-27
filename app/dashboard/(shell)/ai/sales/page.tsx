"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  ArrowLeft, ArrowUpRight, BarChart3, RefreshCw, AlertCircle, Sparkles, CheckCircle2 
} from "lucide-react";
import type { SalesAnalyticsData } from "@/lib/ai/types";

export default function SalesAnalystPage() {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [salesData, setSalesData] = useState<SalesAnalyticsData | null>(null);
  const [commentary, setCommentary] = useState<string>("");

  const fetchSales = async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/sales-analyst?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setSalesData(json.data);
        setCommentary(json.commentary);
      }
    } catch (err) {
      console.error("Failed to load sales data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(periodDays);
  }, [periodDays]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link 
              href="/dashboard/ai-studio" 
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft size={13} /> AI Copilot
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Sales Intelligence
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Sales Analyst</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic revenue tracking, order velocity, and grounded AI trend explanations.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium self-start md:self-auto">
          {[
            { label: "7 Days", days: 7 },
            { label: "30 Days", days: 30 },
            { label: "90 Days", days: 90 },
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setPeriodDays(item.days)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                periodDays === item.days
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => fetchSales(periodDays)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors ml-0.5"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-wider">Querying verified sales data...</p>
        </div>
      ) : (
        <>
          {/* AI Grounded Commentary Card */}
          <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-white p-4 sm:p-5 rounded-xl border border-amber-200/80 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={14} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold">
                  AI Sales Commentary ({periodDays}-Day Window)
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{commentary}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Verified against completed Paystack order items. Zero synthetic assumptions.
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase">
                <span>Gross Revenue</span>
                <DollarSign size={14} className="text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                GH₵{salesData?.currentRevenue.toLocaleString() || "0"}
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {(salesData?.revenueChangePercent || 0) >= 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                    <TrendingUp size={12} /> +{salesData?.revenueChangePercent}%
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold flex items-center gap-0.5">
                    <TrendingDown size={12} /> {salesData?.revenueChangePercent}%
                  </span>
                )}
                <span className="text-slate-400">vs prior {periodDays}d</span>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase">
                <span>Completed Orders</span>
                <ShoppingBag size={14} className="text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                {salesData?.currentOrderCount || 0}
              </div>
              <div className="text-[11px] text-slate-400">
                Prior: {salesData?.previousOrderCount || 0} orders
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase">
                <span>Avg Order Value</span>
                <BarChart3 size={14} className="text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                GH₵{salesData?.averageOrderValue.toLocaleString() || "0"}
              </div>
              <div className="text-[11px] text-slate-400">Per completed order</div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase">
                <span>Top Category Share</span>
                <CheckCircle2 size={14} className="text-slate-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {salesData?.categoryBreakdown[0]?.name || "N/A"}
              </div>
              <div className="text-[11px] text-slate-400">
                {salesData?.categoryBreakdown[0]?.sharePercent || 0}% of gross revenue
              </div>
            </div>
          </div>

          {/* Top Products & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Top Selling Products */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Top Selling Garments</h3>
              {(!salesData?.topSellingProducts || salesData.topSellingProducts.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No products sold in this period.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {salesData.topSellingProducts.map((p, idx) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono text-slate-400 w-3 shrink-0">{idx + 1}</span>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-cover rounded-lg border border-slate-100 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs shrink-0">🧵</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">GH₵{p.price} / unit</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900 font-mono">GH₵{p.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{p.unitsSold} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Revenue Distribution */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Revenue by Category</h3>
              {(!salesData?.categoryBreakdown || salesData.categoryBreakdown.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No category sales recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {salesData.categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-800">{cat.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">GH₵{cat.revenue.toLocaleString()} ({cat.sharePercent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(2, cat.sharePercent))}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
