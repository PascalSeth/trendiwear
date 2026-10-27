'use client';
import React from "react";
import { Sparkles, TrendingUp, Search, BarChart3 } from "lucide-react";

interface SearchItem {
  term: string;
  count: number;
}

interface InsightItem {
  title: string;
  description: string;
  change?: number;
  period?: string;
}

interface DashboardData {
  analytics?: {
    trendingSearches?: SearchItem[];
    insights?: InsightItem[];
  };
}

function AnalyticsInsights({ dashboardData }: { dashboardData?: DashboardData }) {
  const insights = dashboardData?.analytics?.insights || [
    {
      title: "Conversion Velocity",
      description: "Catalogue views are converting steadily to buyer checkouts",
    },
    {
      title: "Promotions & Discounts",
      description: "Active promotions are driving returning customer loyalty",
    },
    {
      title: "Market Demand",
      description: "Custom tailoring and alteration requests are up across key regions",
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Search Terms */}
      {dashboardData?.analytics?.trendingSearches && dashboardData.analytics.trendingSearches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-600" /> Popular Customer Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {dashboardData.analytics.trendingSearches.slice(0, 6).map((search: SearchItem, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs hover:bg-slate-100 transition-colors"
              >
                <span className="font-semibold text-slate-800">&ldquo;{search.term}&rdquo;</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60">
                  {search.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Insights */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Intelligence Feed
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((insight: InsightItem, index: number) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{insight.title}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                {insight.description}
              </p>
              {insight.change !== undefined && (
                <div className="pt-2 border-t border-slate-200/50 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {typeof insight.change === 'number' && insight.change < 100
                      ? `${insight.change.toFixed(1)}${insight.period === 'overall' ? '%' : ''}`
                      : insight.change}{" "}
                    {insight.period}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AnalyticsInsights;