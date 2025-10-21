'use client';
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  BarChart3,
  Clock,
  Target,
  Zap,
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
  seasonalInsights: Array<{
    title: string;
    description: string;
    change: number;
    period: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      const response = await fetch(`/api/professional-analytics?period=${selectedPeriod}&compare=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-neutral-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.overview) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-neutral-500">Unable to load analytics data.</p>
          <p className="text-sm text-neutral-400 mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Track your business performance and customer engagement
              </p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.overview?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                From {analytics.overview?.totalOrders || 0} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(analytics.overview?.conversionRate || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Views to purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.overview?.avgOrderValue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Listed products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Period Comparison */}
        {analytics.comparison && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Period Comparison</CardTitle>
              <CardDescription>Compare current period with previous period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Previous Period</p>
                  <p className="text-2xl font-bold">{analytics.comparison.previousPeriod.orders}</p>
                  <p className="text-xs text-muted-foreground">orders</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Period</p>
                  <p className="text-2xl font-bold">{analytics.comparison.currentPeriod.orders}</p>
                  <p className="text-xs text-muted-foreground">orders</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p className={`text-2xl font-bold ${analytics.comparison.changes.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.comparison.changes.orders >= 0 ? '+' : ''}{formatPercentage(analytics.comparison.changes.orders)}
                  </p>
                  <p className="text-xs text-muted-foreground">vs previous period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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

            {/* Seasonal Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Insights & Trends</CardTitle>
                <CardDescription>Key patterns and seasonal performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.seasonalInsights && analytics.seasonalInsights.length > 0 ? analytics.seasonalInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-blue-900">{insight.title}</h4>
                          <p className="text-xs text-blue-700 mt-1">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={insight.change >= 0 ? "default" : "destructive"}>
                              {insight.change >= 0 ? '+' : ''}{typeof insight.change === 'number' && insight.change < 100 ? formatPercentage(insight.change) : insight.change}
                            </Badge>
                            <span className="text-xs text-blue-600">{insight.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <>
                      <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm text-purple-900">December Trend</h4>
                            <p className="text-xs text-purple-700 mt-1">Wedding gowns up 45%</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default">+45.0%</Badge>
                              <span className="text-xs text-purple-600">vs last year</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm text-green-900">Holiday Season Peak</h4>
                            <p className="text-xs text-green-700 mt-1">Last week of December</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default">85% of Q4 revenue</Badge>
                              <span className="text-xs text-green-600">annual revenue</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm text-orange-900">Spring Collection</h4>
                            <p className="text-xs text-orange-700 mt-1">Floral dresses trending</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default">+32.5%</Badge>
                              <span className="text-xs text-orange-600">this season</span>
                            </div>
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
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
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

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance Insights</CardTitle>
                  <CardDescription>Detailed product analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.productPerformance.slice(0, 5).map((product, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{product.product.name}</h4>
                          <Badge variant="outline">{formatPercentage(product.conversionRate)} conv.</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Views:</span>
                            <span className="ml-1 font-medium">{product.views}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Purchases:</span>
                            <span className="ml-1 font-medium">{product.purchases}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="ml-1 font-medium">{formatCurrency(product.revenue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Price:</span>
                            <span className="ml-1 font-medium">{formatCurrency(product.product.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                          value={Math.min((trend.searchCount / analytics.trendingSearches[0]?.searchCount) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}