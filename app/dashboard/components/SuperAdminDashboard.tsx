"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, DollarSign, RefreshCw, ShoppingBag,
  UserCheck, Users, Banknote,
  ArrowUpRight, Sparkles as SparklesIcon,
  ShieldCheck
} from "lucide-react";
import PayoutRecovery from "./PayoutRecovery";
import TrendGeneratorCard from "./TrendGeneratorCard";

interface Order {
  id: string;
  customer: string;
  professional: string;
  amount: number;
  status: string;
  date: string;
}

interface Professional {
  id: string;
  name: string;
  owner: string;
  revenue: number;
  orders: number;
  rating: number;
  status: string;
}

interface ApiOrder {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  customer: { firstName: string; lastName: string };
  items: Array<{ product?: { name: string } }>;
}

interface ApiProfessional {
  id: string;
  businessName: string;
  isVerified: boolean;
  rating: number;
  accountBalance?: number;
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
  const [activeTab, setActiveTab] = useState("generator"); // 'generator' | 'overview' | 'orders' | 'professionals' | 'payouts'
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("GHS");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currencyResponse = await fetch("/api/currency");
      if (currencyResponse.ok) {
        const currencyData = await currencyResponse.json();
        setCurrencySymbol(currencyData.symbol || "GHS");
      }

      const statsResponse = await fetch("/api/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      const ordersResponse = await fetch("/api/orders?limit=6");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const formattedOrders: Order[] = (ordersData.orders || []).map((order: ApiOrder) => ({
          id: order.id,
          customer: `${order.customer?.firstName || 'Customer'} ${order.customer?.lastName || ''}`,
          professional: order.items?.[0]?.product?.name || "Order Item",
          amount: order.totalPrice || 0,
          status: (order.status || "pending").toLowerCase(),
          date: new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        }));
        setRecentOrders(formattedOrders);
      }

      const professionalsResponse = await fetch("/api/professional-profiles?limit=6");
      if (professionalsResponse.ok) {
        const professionalsData = await professionalsResponse.json();
        const profilesArray = Array.isArray(professionalsData) ? professionalsData : [];
        const formattedProfessionals: Professional[] = profilesArray.map((profile: ApiProfessional) => ({
          id: profile.id,
          name: profile.businessName || "Stylist Studio",
          owner: profile.user ? `${profile.user.firstName} ${profile.user.lastName}` : "Professional",
          revenue: profile.accountBalance || 0,
          orders: profile.user?._count?.professionalServices || 0,
          rating: profile.rating || 5.0,
          status: profile.isVerified ? "verified" : "pending",
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-4 sm:p-6 space-y-8 selection:bg-amber-400 selection:text-stone-900 font-sans">
      
      {/* EXECUTIVE HERO HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200 bg-white p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-600 font-bold" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-500 font-bold">SuperAdmin Executive Command Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif italic text-stone-900 tracking-tight">
            TrendiZip Operations Headquarters
          </h1>
          <p className="text-xs font-mono text-stone-500 mt-1 max-w-xl leading-relaxed">
            Real-time AI Trend Generation, Multi-Vendor Settlement Engine, Order Intelligence &amp; Escrow Governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-900 transition-colors rounded-lg"
            title="Refresh System Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <div className="bg-stone-100 border border-stone-200 px-4 py-2 flex items-center gap-2.5 text-xs font-mono text-stone-700 font-bold uppercase rounded-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Database Operational</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200">
        {[
          { id: "generator", label: "✨ AI Trend Generator Studio", icon: SparklesIcon },
          { id: "overview", label: "📊 Financial & Platform Metrics", icon: BarChart3 },
          { id: "orders", label: "🛒 Marketplace Orders", icon: ShoppingBag },
          { id: "professionals", label: "👥 Stylists & Vendors", icon: Users },
          { id: "payouts", label: "💰 Payout Recovery Engine", icon: Banknote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 font-mono text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all border-b-2 ${
                isActive
                  ? "border-amber-500 text-amber-900 font-bold bg-white shadow-xs rounded-t-lg"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-stone-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISUAL AI TREND GENERATOR STUDIO */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          <TrendGeneratorCard />
        </div>
      )}

      {/* TAB 2: FINANCIAL & PLATFORM METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* STATS METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-stone-200 p-6 space-y-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Platform Revenue</span>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-serif italic text-stone-900">
                {currencySymbol} {(stats?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                <ArrowUpRight size={12} /> +18.4% vs previous cycle
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 space-y-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Active Orders</span>
                <ShoppingBag className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-serif italic text-stone-900">
                {(stats?.totalOrders || 0).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-stone-500">
                {stats?.pendingOrders || 0} orders awaiting delivery
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 space-y-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Verified Stylists</span>
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-serif italic text-stone-900">
                {(stats?.totalProfessionals || 0).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-emerald-600 font-bold">
                Active professional profiles
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 space-y-3 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Customer Accounts</span>
                <UserCheck className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-3xl font-serif italic text-stone-900">
                {(stats?.totalUsers || 0).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-stone-500">
                Registered buyers &amp; clients
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MARKETPLACE ORDERS */}
      {activeTab === "orders" && (
        <div className="bg-white border border-stone-200 p-8 space-y-6 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif italic text-stone-900">Marketplace Orders Log</h3>
            <span className="text-xs font-mono text-stone-500">Showing recent transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold">
                  <th className="py-4 px-4">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Item</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs font-mono text-stone-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50">
                    <td className="py-4 px-4 text-amber-700 font-bold">{order.id.slice(0, 8)}...</td>
                    <td className="py-4 px-4 text-stone-900">{order.customer}</td>
                    <td className="py-4 px-4 text-stone-500">{order.professional}</td>
                    <td className="py-4 px-4 font-bold text-stone-900">{currencySymbol} {order.amount.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] uppercase font-bold rounded">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-stone-400">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STYLISTS & VENDORS */}
      {activeTab === "professionals" && (
        <div className="bg-white border border-stone-200 p-8 space-y-6 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif italic text-stone-900">Stylists &amp; Professional Vendors</h3>
            <span className="text-xs font-mono text-stone-500">Vendor directory</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((prof) => (
              <div key={prof.id} className="bg-stone-50 border border-stone-200 p-6 space-y-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-serif italic text-stone-900 font-medium">{prof.name}</h4>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border rounded font-bold ${
                    prof.status === "verified" 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {prof.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-stone-500">Owner: {prof.owner}</p>
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-500">
                  <span>Rating: ⭐ {prof.rating.toFixed(1)}</span>
                  <span className="text-amber-700 font-bold">{currencySymbol} {prof.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PAYOUT RECOVERY */}
      {activeTab === "payouts" && (
        <div className="bg-white border border-stone-200 p-8 rounded-xl shadow-xs">
          <PayoutRecovery />
        </div>
      )}

    </div>
  );
}

export default SuperAdminDashboard;