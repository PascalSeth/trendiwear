'use client';
import React from "react";

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

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Business Insights
        </h3>
      </div>

      <div className="space-y-6">
        {/* Top Search Terms */}
        {dashboardData?.analytics?.trendingSearches && dashboardData.analytics.trendingSearches.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Popular Search Terms</h4>
            <div className="space-y-2">
              {dashboardData.analytics.trendingSearches.slice(0, 5).map((search: SearchItem, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <span className="font-medium text-gray-900">&ldquo;{search.term}&rdquo;</span>
                  <span className="text-sm text-blue-600 font-semibold">{search.count} searches</span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Business Insights */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-800">Business Insights</h4>
          <div className="space-y-3">
            {dashboardData?.analytics?.insights && dashboardData.analytics.insights.length > 0 ? (
              dashboardData.analytics.insights.map((insight: InsightItem, index: number) => {
                const colors = [
                  'from-orange-50 to-red-50',
                  'from-purple-50 to-pink-50',
                  'from-green-50 to-teal-50'
                ];
                const bgColors = [
                  'bg-orange-500',
                  'bg-purple-500',
                  'bg-green-500'
                ];
                return (
                  <div key={index} className={`flex items-start space-x-4 p-3 bg-gradient-to-r ${colors[index % colors.length]} rounded-lg`}>
                    <div className={`w-3 h-3 ${bgColors[index % bgColors.length]} rounded-full mt-2 animate-pulse`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
                      {insight.change !== undefined && (
                        <p className="text-xs font-medium text-gray-700 mt-1">
                          {typeof insight.change === 'number' && insight.change < 100 ?
                            `${insight.change.toFixed(1)}${insight.period === 'overall' ? '%' : ''}` :
                            insight.change
                          } {insight.period}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Conversion Rate</p>
                    <p className="text-xs text-gray-500 mt-1">Track how well your products convert views to sales</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Active Promotions</p>
                    <p className="text-xs text-gray-500 mt-1">Monitor your discount campaign performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Order Growth</p>
                    <p className="text-xs text-gray-500 mt-1">Track month-over-month order performance</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsInsights;