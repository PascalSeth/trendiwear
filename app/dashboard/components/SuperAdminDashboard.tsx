'use client'
import React, { useState, useEffect } from 'react';
import {
  BarChart3, DollarSign, Download, Edit, Eye, Filter,
  MoreHorizontal, Plus, RefreshCw, Search, Settings, ShoppingBag,
  Star, Trash2, UserCheck, Users, Banknote,
  ChevronRight, Bell, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import PayoutRecovery from './PayoutRecovery';

// ... (Interfaces remain identical to your original code)
interface Order { id: string; customer: string; professional: string; amount: number; status: string; date: string; }
interface Professional { id: string; name: string; owner: string; revenue: number; orders: number; rating: number; status: string; }
interface ApiOrder { id: string; createdAt: string; totalPrice: number; status: string; customer: { firstName: string; lastName: string; }; items: Array<{ product?: { name: string; }; }>; }
interface ApiProfessional { id: string; businessName: string; isVerified: boolean; rating: number; accountBalance?: number; user?: { firstName: string; lastName: string; _count?: { professionalServices: number; }; }; }
interface Stats { totalUsers: number; totalProfessionals: number; totalOrders: number; totalRevenue: number; monthlyGrowth: number; pendingOrders: number; }

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('KSh');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const currencyResponse = await fetch('/api/currency');
        if (currencyResponse.ok) {
          const currencyData = await currencyResponse.json();
          setCurrencySymbol(currencyData.symbol);
        }

        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        const ordersResponse = await fetch('/api/orders?limit=5');
        const ordersData = await ordersResponse.json();
        const formattedOrders: Order[] = ordersData.orders.map((order: ApiOrder) => ({
          id: order.id,
          customer: `${order.customer.firstName} ${order.customer.lastName}`,
          professional: order.items[0]?.product?.name || 'Unknown',
          amount: order.totalPrice,
          status: order.status.toLowerCase(),
          date: new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        }));
        setRecentOrders(formattedOrders);

        const professionalsResponse = await fetch('/api/professional-profiles?limit=5');
        const professionalsData = await professionalsResponse.json();
        const profilesArray = Array.isArray(professionalsData) ? professionalsData : [];
        const formattedProfessionals: Professional[] = profilesArray.map((profile: ApiProfessional) => ({
          id: profile.id,
          name: profile.businessName,
          owner: profile.user ? `${profile.user.firstName} ${profile.user.lastName}` : 'Unknown',
          revenue: profile.accountBalance || 0,
          orders: profile.user?._count?.professionalServices || 0,
          rating: profile.rating || 0,
          status: profile.isVerified ? 'verified' : 'pending'
        }));
        setProfessionals(formattedProfessionals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- Styled Components ---
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('bg-', 'bg-')}`} />
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900">{value}</span>
            {change && (
              <div className={`flex items-center mt-1 text-xs font-bold ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {change > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(change)}% <span className="ml-1 text-slate-400 font-medium tracking-normal">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
      verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      processing: "bg-blue-50 text-blue-700 border-blue-100",
      cancelled: "bg-rose-50 text-rose-700 border-rose-100",
    };
    const style = styles[status] || "bg-slate-50 text-slate-700 border-slate-100";
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight border ${style}`}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-violet-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-white rounded-full"></div>
        </div>
      </div>
      <p className="mt-4 text-slate-500 font-bold text-sm tracking-widest uppercase animate-pulse">Initializing System...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-violet-100">
      {/* Top Utility Bar */}
      <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Quick search (CMD + K)"
              className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none">Admin Root</p>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-tighter">Superuser</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-200">
              AD
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Operational</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time platform metrics and oversight.</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Calendar className="h-4 w-4" />
              This Month
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95">
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          </div>
        </header>

        {/* Tab Navigation - Segmented Control Style */}
        <nav className="mb-8 p-1.5 bg-slate-200/50 rounded-2xl inline-flex flex-wrap gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'professionals', label: 'Professionals', icon: UserCheck },
            { id: 'payouts', label: 'Payouts', icon: Banknote },
            { id: 'system', label: 'System', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-violet-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="space-y-8">
          {activeTab === 'overview' && stats && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} title="Total Users" value={stats.totalUsers.toLocaleString()} change={8.2} color="bg-blue-600" />
                <StatCard icon={UserCheck} title="Professionals" value={stats.totalProfessionals} change={15.3} color="bg-emerald-600" />
                <StatCard icon={ShoppingBag} title="Total Orders" value={stats.totalOrders.toLocaleString()} change={12.5} color="bg-violet-600" />
                <StatCard icon={DollarSign} title="Net Revenue" value={`${currencySymbol} ${stats.totalRevenue.toLocaleString()}`} change={18.7} color="bg-amber-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Preview */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Revenue Stream</h3>
                      <p className="text-sm text-slate-500 font-medium">Daily performance tracking</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><RefreshCw className="h-4 w-4 text-slate-400" /></button>
                      <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><MoreHorizontal className="h-4 w-4 text-slate-400" /></button>
                    </div>
                  </div>
                  <div className="h-72 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Analytics Engine Offline</p>
                  </div>
                </div>

                {/* Top Professionals List */}
                <div className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 p-8 text-white">
                  <h3 className="text-xl font-black mb-6 tracking-tight">Top Performers</h3>
                  <div className="space-y-6">
                    {professionals.slice(0, 4).map((prof) => (
                      <div key={prof.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center font-black text-white group-hover:bg-violet-500 transition-colors">
                            {prof.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-none mb-1">{prof.name}</p>
                            <p className="text-xs text-slate-400">{prof.orders} completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm">{currencySymbol}{prof.revenue.toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-slate-400">{prof.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10">
                    View Leaderboard
                  </button>
                </div>
              </div>

              {/* Enhanced Table Section */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-lg font-black tracking-tight">Recent Transactions</h3>
                  <button className="text-violet-600 hover:text-violet-700 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    View All Activity <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">#{order.id.slice(-6)}</td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{order.customer}</span>
                              <span className="text-[11px] text-slate-400 font-medium">{order.date}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-black text-slate-900">{currencySymbol} {order.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-5">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professionals' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">Professional Registry</h2>
                <div className="flex gap-2">
                  <button className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all"><Filter className="h-4 w-4 text-slate-600" /></button>
                  <button className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all"><Download className="h-4 w-4 text-slate-600" /></button>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-left">Partner</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-left">Metrics</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-left">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {professionals.map(prof => (
                      <tr key={prof.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm capitalize">{prof.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{prof.name}</p>
                              <p className="text-[11px] text-slate-500 font-bold">{prof.owner}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Revenue</p>
                              <p className="text-xs font-black">{currencySymbol}{prof.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Orders</p>
                              <p className="text-xs font-black">{prof.orders}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5"><StatusBadge status={prof.status} /></td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Eye className="h-4 w-4" /></button>
                            <button className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                            <button className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="animate-in zoom-in-95 duration-300">
              <PayoutRecovery />
            </div>
          )}

          {/* Simple Fallback for other tabs */}
          {!['overview', 'professionals', 'payouts'].includes(activeTab) && (
            <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Settings className="h-10 w-10 text-slate-300 animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Module Under Construction</h3>
              <p className="text-slate-500 mt-2 max-w-sm">We&apos;re building this interface to match our new system standards. Check back shortly.</p>
              <button
                onClick={() => setActiveTab('overview')}
                className="mt-8 text-sm font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
              >
                Return to Base
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;