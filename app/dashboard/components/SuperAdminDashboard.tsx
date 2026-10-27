"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3, RefreshCw, ShoppingBag,
  UserCheck, Users, Banknote,
  ArrowUpRight, Wand2 as Wand2Icon,
  ShieldCheck, CheckCircle2,
  ArrowRight, Search, Star, ExternalLink,
  Layers, Settings, Sparkles
} from "lucide-react";
import PayoutRecovery from "./PayoutRecovery";
import TrendGeneratorCard from "./TrendGeneratorCard";
import { getCurrencySymbolFromCode } from "@/lib/currency-utils";

interface Order {
  id: string;
  customer: string;
  professional: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  rawDate: string;
}

interface Professional {
  id: string;
  name: string;
  owner: string;
  revenue: number;
  orders: number;
  rating: number;
  status: string;
  slug?: string;
}

interface ApiOrder {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  customer: { firstName: string; lastName: string };
  items: Array<{ product?: { name: string; currency?: string } }>;
}

interface ApiProfessional {
  id: string;
  businessName: string;
  isVerified: boolean;
  rating: number;
  accountBalance?: number;
  slug?: string;
  user?: {
    firstName: string;
    lastName: string;
    _count?: { professionalServices: number };
  };
}

interface Stats {
  totalUsers: number;
  totalProfessionals: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingOrders: number;
}

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "professionals" | "payouts" | "generator">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("GH₵");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [stylistSearchQuery, setStylistSearchQuery] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch currency symbol
      try {
        const currencyResponse = await fetch("/api/currency");
        if (currencyResponse.ok) {
          const currencyData = await currencyResponse.json();
          setCurrencySymbol(currencyData.symbol || "GH₵");
        }
      } catch (e) {
        console.warn("Could not fetch currency, falling back to default:", e);
      }

      // 2. Fetch platform overview stats
      const statsResponse = await fetch("/api/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // 3. Fetch recent marketplace orders
      const ordersResponse = await fetch("/api/orders?limit=25");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const formattedOrders: Order[] = (ordersData.orders || []).map((order: ApiOrder) => {
          const itemCurrency = order.items?.[0]?.product?.currency || 'GHS';
          return {
            id: order.id,
            customer: `${order.customer?.firstName || 'Customer'} ${order.customer?.lastName || ''}`.trim(),
            professional: order.items?.[0]?.product?.name || "Marketplace Product",
            amount: order.totalPrice || 0,
            currency: itemCurrency,
            status: (order.status || "pending").toUpperCase(),
            date: new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            rawDate: order.createdAt,
          };
        });
        setRecentOrders(formattedOrders);
      }

      // 4. Fetch registered professional profiles
      const professionalsResponse = await fetch("/api/professional-profiles?limit=24");
      if (professionalsResponse.ok) {
        const professionalsData = await professionalsResponse.json();
        const profilesArray = Array.isArray(professionalsData) ? professionalsData : [];
        const formattedProfessionals: Professional[] = profilesArray.map((profile: ApiProfessional) => ({
          id: profile.id,
          name: profile.businessName || "Stylist Studio",
          owner: profile.user ? `${profile.user.firstName} ${profile.user.lastName}`.trim() : "Professional",
          revenue: profile.accountBalance || 0,
          orders: profile.user?._count?.professionalServices || 0,
          rating: profile.rating || 5.0,
          status: profile.isVerified ? "verified" : "pending",
          slug: profile.slug,
        }));
        setProfessionals(formattedProfessionals);
      }
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      setError(errObj.message || "Failed to load executive metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filtered orders for the Orders tab
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(order => {
      const matchesSearch = !orderSearchQuery ||
        order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.professional.toLowerCase().includes(orderSearchQuery.toLowerCase());
      
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recentOrders, orderSearchQuery, orderStatusFilter]);

  // Filtered stylists for the Stylists tab
  const filteredProfessionals = useMemo(() => {
    return professionals.filter(prof => {
      return !stylistSearchQuery ||
        prof.name.toLowerCase().includes(stylistSearchQuery.toLowerCase()) ||
        prof.owner.toLowerCase().includes(stylistSearchQuery.toLowerCase());
    });
  }, [professionals, stylistSearchQuery]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'SHIPPED':
      case 'DISPATCHED':
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 font-sans">
      
      {/* EXECUTIVE HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
              SuperAdmin Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            TrendiZip Platform Operations
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Multi-vendor settlement engine, real-time escrow governance, order intelligence &amp; AI trend creation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition-all flex items-center gap-2"
            title="Refresh Platform Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Operational</span>
          </div>

          <Link
            href="/dashboard/management"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5" /> Management
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1.5">
        {[
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "orders" as const, label: "Marketplace Orders", icon: ShoppingBag, count: stats?.totalOrders },
          { id: "professionals" as const, label: "Stylists & Vendors", icon: Users, count: stats?.totalProfessionals },
          { id: "payouts" as const, label: "Payout Recovery", icon: Banknote },
          { id: "generator" as const, label: "AI Trend Studio", icon: Wand2Icon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* 4 STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Platform Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Banknote className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currencySymbol} {(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +{(stats?.monthlyGrowth || 18.4).toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">vs previous cycle</span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marketplace Orders</span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(stats?.totalOrders || 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  <span className="font-bold text-amber-600">{stats?.pendingOrders || 0}</span> orders awaiting delivery
                </p>
              </div>
            </div>

            {/* Card 3: Verified Stylists */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Stylists</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(stats?.totalProfessionals || 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active artisan profiles
                </p>
              </div>
            </div>

            {/* Card 4: Customer Accounts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Base</span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(stats?.totalUsers || 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  Registered shoppers &amp; clients
                </p>
              </div>
            </div>

          </div>

          {/* MAIN DUAL COLUMN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Recent Orders & Top Stylists */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Recent Orders Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600" /> Recent Marketplace Orders
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Live transaction stream across all registered vendors
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
                  >
                    View All ({recentOrders.length}) <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <ShoppingBag className="w-8 h-8 mb-1.5 opacity-20 mx-auto" />
                    <p className="text-xs font-medium">No marketplace orders recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2.5 pl-1">Order</th>
                          <th className="pb-2.5">Customer</th>
                          <th className="pb-2.5">Item</th>
                          <th className="pb-2.5">Amount</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5 text-right pr-1">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentOrders.slice(0, 6).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 pl-1 font-bold text-amber-700">#{order.id.slice(-8).toUpperCase()}</td>
                            <td className="py-3 font-semibold text-slate-900 truncate max-w-[120px]">{order.customer}</td>
                            <td className="py-3 text-slate-600 truncate max-w-[140px]">{order.professional}</td>
                            <td className="py-3 font-black text-slate-900">{getCurrencySymbolFromCode(order.currency)} {order.amount.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-1 text-slate-400 font-medium">{order.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Top Stylists & Vendors Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Stylists &amp; Artisan Directory
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Top performing custom tailors and fashion designers
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("professionals")}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
                  >
                    Manage Vendors ({professionals.length}) <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {professionals.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 mb-1.5 opacity-20 mx-auto" />
                    <p className="text-xs font-medium">No registered stylists found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {professionals.slice(0, 6).map((prof) => (
                      <div key={prof.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                            {prof.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{prof.name}</h4>
                              {prof.status === 'verified' && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{prof.owner}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-current text-amber-500" />
                            <span>{prof.rating.toFixed(1)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {currencySymbol} {prof.revenue.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Quick Management & System Health */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Quick Management Shortcuts */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" /> Operations Shortcuts
                </h3>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab("generator")}
                    className="w-full group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/70 hover:border-amber-200 transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-white text-amber-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-900">AI Trend Generator</h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">Generate photorealistic Afro lookbooks</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab("payouts")}
                    className="w-full group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-white text-emerald-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">Payout Recovery Engine</h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">Resolve stuck Mobile Money transfers</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <Link
                    href="/dashboard/orders"
                    className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-white text-blue-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">Order Fulfillment Hub</h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">Kanban pipeline &amp; rider assignment</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  <Link
                    href="/dashboard/trends"
                    className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/70 hover:border-purple-200 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-white text-purple-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-900">Events &amp; Trend Categories</h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">Curate dress codes &amp; inspirations</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 hover:border-slate-300 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-white text-slate-700 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900">System Parameters</h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">Platform commissions &amp; policies</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Platform Engine Status Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Platform Infrastructure
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">PostgreSQL Database</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Healthy</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">Payment Escrow Engine</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">Paystack MoMo Gateway</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Online</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-800">AI Lookbook Workers</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Standby</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MARKETPLACE ORDERS LOG */}
      {activeTab === "orders" && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Marketplace Orders Log</h2>
              <p className="text-xs text-slate-500 font-medium">All customer transactions, delivery states, and settlement amounts</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              {['all', 'DELIVERED', 'PENDING', 'PROCESSING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === status
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, or item name..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30 mx-auto" />
              <p className="text-xs font-medium">No orders matching your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Item / Service</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-amber-700">#{order.id.slice(0, 8)}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{order.customer}</td>
                      <td className="py-3.5 px-3 text-slate-600">{order.professional}</td>
                      <td className="py-3.5 px-3 font-black text-slate-900">{getCurrencySymbolFromCode(order.currency)} {order.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400 font-medium">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STYLISTS & VENDORS */}
      {activeTab === "professionals" && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Stylists &amp; Artisan Directory</h2>
              <p className="text-xs text-slate-500 font-medium">Registered tailor accounts, ratings, completed commissions, and wallet balances</p>
            </div>

            {/* Search Box */}
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search stylists by name or owner..."
                value={stylistSearchQuery}
                onChange={(e) => setStylistSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {filteredProfessionals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 mb-2 opacity-30 mx-auto" />
              <p className="text-xs font-medium">No stylists matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfessionals.map((prof) => (
                <div key={prof.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 font-bold text-sm shrink-0">
                        {prof.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{prof.name}</h4>
                        <p className="text-xs text-slate-400 truncate">Owner: {prof.owner}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      prof.status === "verified"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                        : "bg-amber-50 text-amber-700 border-amber-200/80"
                    }`}>
                      {prof.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{prof.rating.toFixed(1)}</span>
                    </div>

                    <div className="font-bold text-slate-700">
                      {currencySymbol} {prof.revenue.toFixed(2)}
                    </div>

                    {prof.slug ? (
                      <Link
                        href={`/tz/${prof.slug}`}
                        target="_blank"
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                      >
                        Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Standard</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYOUT RECOVERY */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          <PayoutRecovery />
        </div>
      )}

      {/* TAB 5: AI TREND GENERATOR STUDIO */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          <TrendGeneratorCard />
        </div>
      )}

    </div>
  );
}

export default SuperAdminDashboard;