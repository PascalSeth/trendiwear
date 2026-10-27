'use client';
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { AccessControlWrapper } from '@/app/dashboard/components/AccessControlWrapper';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Eye,
  DollarSign,
  Package,
  Clock,
  Target,
  Activity,
  Calendar,
  ShoppingBag
} from "lucide-react";

interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalProducts: number;
    totalRevenue: number;
    totalOrders: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  topProducts: Array<{
    name: string;
    revenue: number;
    orders: number;
  }>;
  monthlyRevenue: Record<string, number>;
  searchAnalytics: Array<{
    searchTerm: string;
    category: string | null;
    _count: { id: number };
  }>;
  userMovements: Array<{
    action: string;
    targetType: string;
    _count: { id: number };
  }>;
  trendingSearches: Array<{
    searchTerm: string;
    searchCount: number;
  }>;
  productPerformance: Array<{
    product: { name: string; price: number };
    views: number;
    searches: number;
    wishlists: number;
    cartAdds: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  }>;
  comparison?: {
    previousPeriod: { orders: number; period: string };
    currentPeriod: { orders: number; period: string };
    changes: { orders: number };
  };
  mostClickedProducts: Array<{
    name: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
  peakHours: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  loyalty: {
    totalCustomers: number;
    repeatCustomers: number;
    repeatCustomerRate: number;
    clv: number;
  };
  attribution: {
    trafficSources: Record<string, number>;
    internalPercentage: number;
  };
  efficiency: {
    totalQuotesProvided: number;
    acceptedQuotes: number;
    quoteAcceptanceRate: number;
  };
  seasonalInsights: Array<{
    title: string;
    description: string;
    change: number;
    period: string;
  }>;
  profile: {
    businessName: string;
    businessImage: string | null;
    rating: number;
    specialization: string;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      const response = await fetch(`/api/professional-analytics?period=${selectedPeriod}&compare=true`);
      if (!response.ok) {
        console.warn(`Analytics API status: ${response.status}`);
        setAnalytics(null);
        return;
      }
      const data = await response.json();
      console.log('Analytics data:', data); // Debug log
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const getRevenueChartData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.monthlyRevenue).map(([month, revenue]) => ({
      month: month.replace('-', '/'),
      revenue: revenue,
      orders: Math.floor(revenue / (analytics.overview.avgOrderValue || 1))
    }));
  };

  const getPeakHoursData = () => {
    if (!analytics?.peakHours) return [];
    return [
      { name: 'Morning (6AM-12PM)', value: analytics.peakHours.morning, color: '#8884d8' },
      { name: 'Afternoon (12PM-6PM)', value: analytics.peakHours.afternoon, color: '#82ca9d' },
      { name: 'Evening (6PM-10PM)', value: analytics.peakHours.evening, color: '#ffc658' },
      { name: 'Night (10PM-6AM)', value: analytics.peakHours.night, color: '#ff7300' }
    ];
  };

  const getTopProductsChartData = () => {
    if (!analytics) return [];
    return analytics.topProducts.slice(0, 5).map((product) => ({
      name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
      revenue: product.revenue,
      orders: product.orders
    }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-slate-100 rounded-lg w-1/4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.overview) {
    return (
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 text-center">
        <div className="bg-white p-8 rounded-xl border border-slate-200/80">
          <p className="text-slate-500 text-xs">Unable to load analytics data.</p>
          <p className="text-xs text-slate-400 mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <AccessControlWrapper requiredPermission="VIEW_ANALYTICS">
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5">
        {/* Header */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               {analytics.profile?.businessImage ? (
                  <Image 
                    src={analytics.profile.businessImage} 
                    alt={analytics.profile.businessName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
               ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {analytics.profile?.businessName?.charAt(0)}
                  </div>
               )}
               <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 px-2 py-0 text-[10px] font-semibold rounded-md">
                      {analytics.profile?.specialization || 'Merchant'}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                       <TrendingUp className="w-3 h-3" />
                       {analytics.profile?.rating?.toFixed(1) || '5.0'}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {getGreeting()}, {analytics.profile?.businessName.split(' ')[0]}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Performance summary for {analytics.profile?.specialization.toLowerCase()} store.
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <div className="hidden sm:block text-right mr-1">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date Window</p>
                 <p className="text-[11px] text-slate-600 font-medium">
                    {new Date(analytics.dateRange.start).toLocaleDateString()} - {new Date(analytics.dateRange.end).toLocaleDateString()}
                 </p>
              </div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 sm:w-36 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d" className="text-xs">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
                  <SelectItem value="1y" className="text-xs">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Overview Cards - 2x2 on mobile, 4 cols on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-none text-white shadow-xs rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-xs font-semibold opacity-90 text-white">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base sm:text-lg lg:text-xl font-bold">{formatCurrency(analytics.overview?.totalRevenue || 0)}</div>
              <p className="text-[10px] opacity-75 mt-0.5">
                {analytics.overview?.totalOrders || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-xs font-semibold text-slate-600">
                {analytics.profile?.specialization === 'Model' ? 'Profile Views' : 'Repeat Customers'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {analytics.profile?.specialization === 'Model' 
                  ? `${analytics.overview?.totalProducts * 12}` 
                  : formatPercentage(analytics.loyalty?.repeatCustomerRate || 0)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {analytics.profile?.specialization === 'Model' ? 'Portfolio hits' : 'Retention rate'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-xs font-semibold text-slate-600">Discovery Score</CardTitle>
              <Activity className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base sm:text-lg font-bold text-slate-900">{Math.round(analytics.attribution.internalPercentage)}%</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Platform search score</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-xs font-semibold text-slate-600">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-base sm:text-lg font-bold text-slate-900">{analytics.overview?.totalProducts || 0}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Live items in store</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Comparison */}
        {analytics.comparison && (
          <Card className="rounded-xl border border-slate-200/80 shadow-xs">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-900">Period Comparison</CardTitle>
              <CardDescription className="text-[11px] text-slate-500">Compare current vs previous timeframe</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Previous</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800">{analytics.comparison.previousPeriod.orders}</p>
                  <p className="text-[10px] text-slate-400">orders</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Current</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800">{analytics.comparison.currentPeriod.orders}</p>
                  <p className="text-[10px] text-slate-400">orders</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Change</p>
                  <p className={`text-sm sm:text-base font-bold ${analytics.comparison.changes.orders >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {analytics.comparison.changes.orders >= 0 ? '+' : ''}{formatPercentage(analytics.comparison.changes.orders)}
                  </p>
                  <p className="text-[10px] text-slate-400">variance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-9 p-0.5 rounded-xl bg-slate-100 text-xs">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold py-1">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg text-xs font-semibold py-1">Performance</TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-lg text-xs font-semibold py-1">Loyalty</TabsTrigger>
            <TabsTrigger value="attribution" className="rounded-lg text-xs font-semibold py-1">Traffic</TabsTrigger>
            <TabsTrigger value="efficiency" className="rounded-lg text-xs font-semibold py-1">Efficiency</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-lg text-xs font-semibold py-1">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Peak Shopping Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Shopping Hours</CardTitle>
                  <CardDescription>When customers shop the most</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPeakHoursData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPeakHoursData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Peak Hours: 2-4 PM
                      </span>
                      <Badge variant="secondary">Most orders placed during afternoon hours</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-indigo-100 bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100/50">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                   <Activity className="w-5 h-5" />
                   {analytics.profile?.businessName} Growth Insights
                </CardTitle>
                <CardDescription>Tailored strategy for your {analytics.profile?.specialization.toLowerCase()} brand</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.seasonalInsights && analytics.seasonalInsights.length > 0 ? analytics.seasonalInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-xl hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-neutral-900">{insight.title}</h4>
                          <p className="text-xs text-neutral-500 mt-1">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={insight.change >= 0 ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0">
                              {insight.change >= 0 ? '+' : ''}{typeof insight.change === 'number' && insight.change < 100 ? formatPercentage(insight.change) : insight.change}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <>
                      <div className="p-4 border rounded-xl bg-indigo-50/30">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm text-indigo-900">Discovery Alert</h4>
                            <p className="text-xs text-indigo-700 mt-1">Your {analytics.profile?.specialization} profile is 20% more active today.</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-xl bg-neutral-50">
                         <div className="flex items-start gap-3">
                           <Calendar className="h-5 w-5 text-neutral-500 mt-0.5" />
                           <div>
                             <h4 className="font-medium text-sm text-neutral-900">Seasonal Tip</h4>
                             <p className="text-xs text-neutral-600 mt-1">High demand for {analytics.profile?.specialization.toLowerCase() === 'model' ? 'portfolios' : 'custom designs'} this month.</p>
                           </div>
                         </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Orders Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Orders</CardTitle>
                  <CardDescription>Correlation between revenue and order volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                      <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Products Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Products Performance</CardTitle>
                  <CardDescription>Revenue breakdown by top products</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getTopProductsChartData()} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Clicked Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Clicked Products</CardTitle>
                  <CardDescription>Products with highest click-through rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.mostClickedProducts?.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.views} views</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{formatPercentage(product.ctr)} CTR</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{product.clicks} clicks</p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Click tracking data will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Most Searched Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Searched Products</CardTitle>
                  <CardDescription>Products customers search for most</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.searchAnalytics.slice(0, 5).map((search, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">&ldquo;{search.searchTerm}&rdquo;</p>
                            <p className="text-xs text-muted-foreground">
                              {search.category ? `in ${search.category}` : 'General search'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{search._count.id} searches</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Your best performing products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Discount Overview Cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Discount Performance</CardTitle>
                  <CardDescription>Overview of your discount campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Products on Sale</p>
                            <p className="text-xs text-muted-foreground">Active discounts</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {analytics?.seasonalInsights?.find(insight => insight.title === "Products on Sale")?.change || 0}
                          </p>
                        </div>
                      </div>
  
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Discount Sales</p>
                            <p className="text-xs text-muted-foreground">Units sold at discount</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics?.seasonalInsights?.find(insight => insight.title === "Discount Sales")?.change || 0}
                          </p>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discount Effectiveness Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Discount Effectiveness</CardTitle>
                  <CardDescription>How well your discounts are performing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Regular Sales', value: (analytics?.overview?.totalOrders || 0) - (analytics?.seasonalInsights?.find(insight => insight.title === "Discount Sales")?.change || 0), fill: '#8884d8' },
                      { name: 'Discount Sales', value: analytics?.seasonalInsights?.find(insight => insight.title === "Discount Sales")?.change || 0, fill: '#82ca9d' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Discount Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Strategy Insights</CardTitle>
                <CardDescription>Recommendations for optimizing your discount campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-green-900">Discount Conversion</h4>
                        <p className="text-xs text-green-700 mt-1">
                          {analytics?.seasonalInsights?.find(insight => insight.title === "Discount Sales")?.change && analytics?.overview?.totalOrders ?
                            `${Math.round(((analytics.seasonalInsights.find(insight => insight.title === "Discount Sales")!.change / analytics.overview.totalOrders) * 100))}% of total sales` :
                            'No discount data available'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-blue-900">Active Promotions</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          {analytics?.seasonalInsights?.find(insight => insight.title === "Products on Sale")?.change || 0} products currently discounted
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-purple-900">Timing Strategy</h4>
                        <p className="text-xs text-purple-700 mt-1">
                          Consider peak hours for discount launches
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Movements */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Interactions</CardTitle>
                  <CardDescription>How customers engage with your products</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.userMovements.map(movement => ({
                      action: movement.action.replace('_', ' ').toLowerCase(),
                      count: movement._count.id
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="action" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Search Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Search Terms</CardTitle>
                  <CardDescription>What customers are searching for</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.searchAnalytics.slice(0, 8).map((search, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">&ldquo;{search.searchTerm}&rdquo;</span>
                        <Badge variant="secondary">{search._count.id} searches</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                 <CardHeader>
                   <CardTitle className="text-sm font-medium">Repeat Customer Rate</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold">{formatPercentage(analytics.loyalty.repeatCustomerRate)}</div>
                   <Progress value={analytics.loyalty.repeatCustomerRate} className="mt-2" />
                 </CardContent>
              </Card>
              <Card>
                 <CardHeader>
                   <CardTitle className="text-sm font-medium">Total Unique Customers</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold">{analytics.loyalty.totalCustomers}</div>
                   <p className="text-xs text-muted-foreground mt-1">{analytics.loyalty.repeatCustomers} returning</p>
                 </CardContent>
              </Card>
              <Card>
                 <CardHeader>
                   <CardTitle className="text-sm font-medium">Customer Lifetime Value (Avg)</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-3xl font-bold">{formatCurrency(analytics.loyalty.clv)}</div>
                   <p className="text-xs text-muted-foreground mt-1">Average per customer</p>
                 </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Origin Breakdown</CardTitle>
                    <CardDescription>Where your customers are discovering you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.attribution.trafficSources).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.entries(analytics.attribution.trafficSources).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                   <CardHeader>
                     <CardTitle>Internal vs External</CardTitle>
                     <CardDescription>Platform discovery vs Social/Direct</CardDescription>
                   </CardHeader>
                   <CardContent className="flex flex-col items-center justify-center h-[300px]">
                      <div className="text-5xl font-bold text-indigo-600">{Math.round(analytics.attribution.internalPercentage)}%</div>
                      <p className="text-sm font-medium mt-2">Internal Platform Discovery</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">Of your product views happen within TrendiZip&apos;s discovery logs</p>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Quote Acceptance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatPercentage(analytics.efficiency.quoteAcceptanceRate)}</div>
                    <Progress value={analytics.efficiency.quoteAcceptanceRate} className="mt-2" />
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                   <CardHeader>
                     <CardTitle>Service Funnel (Custom Orders)</CardTitle>
                     <CardDescription>From Quote Provided to Accepted Booking</CardDescription>
                   </CardHeader>
                   <CardContent>
                      <div className="flex items-center justify-between px-8 py-4">
                        <div className="text-center">
                           <div className="text-2xl font-bold">{analytics.efficiency.totalQuotesProvided}</div>
                           <div className="text-xs text-muted-foreground">Quotes Sent</div>
                        </div>
                        <div className="h-0.5 flex-1 bg-muted-foreground/20 mx-4" />
                        <div className="text-center">
                           <div className="text-2xl font-bold">{analytics.efficiency.acceptedQuotes}</div>
                           <div className="text-xs text-muted-foreground">Accepted</div>
                        </div>
                      </div>
                   </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="insights" className="space-y-6">
            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>Trending searches in the market</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.trendingSearches.slice(0, 6).map((trend, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">&ldquo;{trend.searchTerm}&rdquo;</span>
                        <Badge variant="outline">{trend.searchCount}</Badge>
                      </div>
                      <Progress
                        value={Math.min((trend.searchCount / (analytics.trendingSearches[0]?.searchCount || 1)) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccessControlWrapper>
  );
}