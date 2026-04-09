import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Role, ProfessionalProfile } from "@prisma/client";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AnalyticsInsights from "./components/AnalyticsInsights";
import SetupGuide from "./components/SetupGuide";
import RecentActivity, { ActivityItem } from "./components/RecentActivity";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  Wallet, 
  ShoppingBag, 
  Star, 
  Activity, 
  Plus, 
  Package, 
  BarChart3, 
  Trophy, 
  Users,
  User,
  Archive,
  Calendar
} from "lucide-react";

// Professional Business Dashboard Component
interface ServiceItem {
  name: string;
  revenue: number;
}

interface PeriodComparison {
  change?: number;
}

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

interface Analytics {
  periodComparison?: PeriodComparison;
  trendingSearches?: SearchItem[];
  insights?: InsightItem[];
}

interface DashboardData {
  metrics?: {
    totalRevenue?: number;
    completedOrders?: number;
    avgRating?: number;
    totalReviews?: number;
    activeCustomers?: number;
  };
  setupStatus?: {
    hasProductsOrServices: boolean;
  };
  analytics?: Analytics;
  topServices?: ServiceItem[];
  recentActivities?: ActivityItem[];
  currency?: string; // Professional's primary currency
}

function ProfessionalBusinessDashboard({
  professionalProfile,
  dashboardData
}: {
  professionalProfile: ProfessionalProfile & { specialization: { name: string } };
  dashboardData?: DashboardData;
}) {
  // Format the specialization name for display
  const formatSpecialization = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get currency from professional's products (or default)
  const currencySymbol = dashboardData?.currency || 'GHS';

    // Helper to format money (supports future currency expansion)
  const formatMoney = (amount: number | undefined) => {
    if (amount === undefined) return `${currencySymbol}0.00`;
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
    // Calculate previous month comparison logic roughly if not exact
   const getTrendColor = (change: number | undefined) => {
    if (!change) return 'text-slate-400';
    return change >= 0 ? 'text-emerald-500' : 'text-rose-500';
  };

  const getTrendIcon = (change: number | undefined) => {
    if (!change) return null;
    return change >= 0 
      ? <TrendingUp className="w-3 h-3 mr-1" />
      : <TrendingDown className="w-3 h-3 mr-1" />;
  };

  return (
    <div className="min-h-screen relative font-sans">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Setup Guide Component */}
        <SetupGuide
          isVerified={professionalProfile.isVerified}
          paymentSetupComplete={professionalProfile.paymentSetupComplete}
          hasProductsOrServices={dashboardData?.setupStatus?.hasProductsOrServices || false}
          businessName={professionalProfile.businessName}
          profileId={professionalProfile.id}
        />

        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
           <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h1 className="text-4xl font-black tracking-tight text-slate-900">
                  Overview
               </h1>
               {professionalProfile.isVerified && (
                  <span className="flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                  </span>
               )}
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              Welcome back, <span className="text-slate-900 font-bold">{professionalProfile.businessName}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              <span className="text-sm font-bold bg-white px-2 py-0.5 rounded-md text-violet-600 border border-violet-100 shadow-sm">
                {formatSpecialization(professionalProfile.specialization?.name || 'Professional')}
              </span>
            </p>
           </div>

           <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-2 pr-6 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/40">
              <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                 <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
                    <Image
                      src={professionalProfile.businessImage || "/beccaProfile.jpg"}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                 </div>
                 <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Status</span>
                 <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Online <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                 </span>
              </div>
               <div className="h-8 w-px bg-slate-200 mx-1"></div>
               <div className="flex -space-x-2.5">
                 {[1,2,3].map(i => (
                   <div key={i} className={`w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm z-${10-i} hover:-translate-y-1 transition-transform cursor-pointer`}>
                      <User className="w-4 h-4 opacity-50" />
                   </div>
                 ))}
                 <div className="w-9 h-9 rounded-full border-2 border-white bg-violet-600 text-white flex items-center justify-center text-xs font-black shadow-lg hover:-translate-y-1 transition-transform cursor-pointer">
                   +12
                 </div>
               </div>
           </div>
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           
           {/* Metric Card 1: Revenue */}
           <div className="group relative bg-white border border-white shadow-xl shadow-indigo-100/30 rounded-3xl p-6 sm:p-8 overflow-hidden hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
              <div className="relative space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                       <Wallet className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-full bg-slate-50 ${getTrendColor(dashboardData?.analytics?.periodComparison?.change)} border border-current/10 shadow-sm`}>
                       {getTrendIcon(dashboardData?.analytics?.periodComparison?.change)}
                       {dashboardData?.analytics?.periodComparison?.change?.toFixed(1)}%
                    </div>
                 </div>
                 <div>
                     <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Total Revenue</h3>
                     <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                       {formatMoney(dashboardData?.metrics?.totalRevenue || professionalProfile.accountBalance)}
                     </p>
                 </div>
              </div>
           </div>

           {/* Metric Card 2: Orders */}
           <div className="group relative bg-white border border-white shadow-xl shadow-blue-100/30 rounded-3xl p-6 sm:p-8 overflow-hidden hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors"></div>
              <div className="relative space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                       <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full border border-blue-100">Live</span>
                 </div>
                 <div>
                     <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Fulfillment</h3>
                     <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                        {dashboardData?.metrics?.completedOrders || professionalProfile.completedOrders || 0}
                     </p>
                 </div>
              </div>
           </div>

           {/* Metric Card 3: Rating */}
           <div className="group relative bg-white border border-white shadow-xl shadow-amber-100/30 rounded-3xl p-6 sm:p-8 overflow-hidden hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-500 hover:-translate-y-1">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition-colors"></div>
               <div className="relative space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 shadow-inner">
                        <Star className="w-6 h-6 fill-current" />
                     </div>
                     <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-100">{dashboardData?.metrics?.totalReviews || 0} Reviews</span>
                  </div>
                  <div>
                     <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Reputation</h3>
                     <div className="flex items-baseline gap-2">
                        <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                           {dashboardData?.metrics?.avgRating?.toFixed(1) || professionalProfile.rating?.toFixed(1) || "N/A"}
                        </p>
                       <div className="flex text-amber-400 gap-0.5">
                          {[1,2,3,4,5].map((star) => (
                             <Star key={star} className={`w-3.5 h-3.5 ${star <= (Math.round(dashboardData?.metrics?.avgRating || 0)) ? 'fill-current' : 'text-slate-100'}`} />
                          ))}
                       </div>
                    </div>
                  </div>
               </div>
           </div>

           {/* Metric Card 4: Customers */}
           <div className="group relative bg-white border border-white shadow-xl shadow-purple-100/30 rounded-3xl p-6 sm:p-8 overflow-hidden hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors"></div>
              <div className="relative space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 shadow-inner">
                       <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-full border border-purple-100">Global</span>
                 </div>
                 <div>
                     <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-1">Trust Base</h3>
                     <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                        {dashboardData?.metrics?.activeCustomers || 0}
                     </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Real-time Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Section: Quick Actions */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/30">
                <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center justify-between">
                   <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-500" /> Quick Flow
                   </span>
                   <Archive className="w-4 h-4 text-violet-400" />
                </h3>
                <div className="space-y-4">
                   <Link href="/dashboard/catalogue/products/add-product" className="group flex items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-violet-600 border border-slate-100 hover:border-violet-400 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-violet-200/40">
                      <div className="w-12 h-12 rounded-xl bg-white text-violet-600 flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                         <Plus className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 group-hover:text-white transition-colors">Add Item</h4>
                         <p className="text-[11px] text-slate-500 group-hover:text-white/80 transition-colors">Expand your library</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                   </Link>
                   
                   <Link href="/dashboard/orders" className="group flex items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-indigo-600 border border-slate-100 hover:border-indigo-400 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-indigo-200/40">
                      <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center mr-4 group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-sm">
                         <Package className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 group-hover:text-white transition-colors">Manage Orders</h4>
                         <p className="text-[11px] text-slate-500 group-hover:text-white/80 transition-colors">Track fulfillment state</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                   </Link>

                   <Link href="/dashboard/analytics" className="group flex items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-600 border border-slate-100 hover:border-cyan-400 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-cyan-200/40">
                      <div className="w-12 h-12 rounded-xl bg-white text-cyan-600 flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                         <BarChart3 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 group-hover:text-white transition-colors">View Intel</h4>
                         <p className="text-[11px] text-slate-500 group-hover:text-white/80 transition-colors">Real-time data stream</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                   </Link>

                   <Link href="/dashboard/bookings" className="group flex items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-emerald-600 border border-slate-100 hover:border-emerald-400 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-emerald-200/40">
                      <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center mr-4 group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-sm">
                         <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 group-hover:text-white transition-colors">Bookings</h4>
                         <p className="text-[11px] text-slate-500 group-hover:text-white/80 transition-colors">Manage your schedule</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                   </Link>
                </div>
              </div>

              {/* Top Performing Card */}
              <div className="bg-white rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/30">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                       <Trophy className="w-5 h-5 text-yellow-500" /> Top Sales
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Month</span>
                 </div>
                 
                 <div className="space-y-4">
                    {dashboardData?.topServices && dashboardData.topServices.length > 0 ? (
                      dashboardData.topServices.map((service: ServiceItem, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-50 hover:border-violet-200 hover:shadow-lg transition-all">
                           <div className="flex items-center gap-4">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-black ${index === 0 ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                 #{index + 1}
                              </span>
                              <div>
                                 <p className="font-bold text-slate-800 text-xs">{service.name}</p>
                                 <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                                    <TrendingUp className="w-2.5 h-2.5" /> High Velocity
                                 </p>
                              </div>
                           </div>
                           <p className="font-black text-slate-900 text-sm">{currencySymbol}{service.revenue.toFixed(0)}</p>
                        </div>
                      ))
                    ) : (
                       <div className="h-40 flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                          <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                          <p className="text-xs font-medium">Intel loading...</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Section: Recent Activity & Detailed Analytics */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/30">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-violet-600" /> Recent Stream
                    </h3>
                    <Link href="/dashboard/orders" className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 group">
                      View all activity <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                 </div>
                 <RecentActivity activities={dashboardData?.recentActivities || []} />
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-white shadow-xl shadow-slate-200/30">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                       <BarChart3 className="w-5 h-5 text-indigo-600" /> Data Insights
                    </h3>
                 </div>
                 <AnalyticsInsights dashboardData={dashboardData} />
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}

import { getAuthSession } from "@/lib/auth";

async function Home() {
  const session = await getAuthSession();

  // Check if user exists and has a valid email
  if (!session || !session.user?.email) {
    // Return an error or redirect the user if not authenticated
    return <div>User not authenticated.</div>;
  }

  // Fetch user from database to get role information
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, id: true }
  });

  if (!dbUser) {
    return <div>User not found in database.</div>;
  }

  const userRole = dbUser?.role;

  // Check if user has admin role and render SuperDashboard
  if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }

  // For professionals, fetch dashboard data and show business dashboard
  if (userRole === Role.PROFESSIONAL) {
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: dbUser.id },
      include: { specialization: true }
    });

    if (!professionalProfile) {
      return <div>No professional profile found for this user.</div>;
    }

    // Fetch dashboard data directly using Prisma
    const dashboardData = await getDashboardData(dbUser.id, professionalProfile.id);

    return <ProfessionalBusinessDashboard
      professionalProfile={professionalProfile}
      dashboardData={dashboardData}
    />;
  }

  return <div>Access denied. Invalid user role.</div>;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getDashboardData(userId: string, professionalProfileId: string): Promise<DashboardData> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get products count and recent activity
    const products = await prisma.product.findMany({
      where: {
        professionalId: userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        soldCount: true,
        viewCount: true,
        isOnSale: true,
        discountPercentage: true,
        discountPrice: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Get orders and revenue data
    const orderItems = await prisma.orderItem.findMany({
      where: {
        professionalId: userId,
        order: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        product: true
      },
      orderBy: {
        order: { createdAt: 'desc' }
      }
    });

    // Determine if the seller has added any product or service globally
    const totalProductsCount = await prisma.product.count({
      where: { professionalId: userId }
    });
    const totalServicesCount = await prisma.professionalService.count({
      where: { professionalId: userId }
    });
    const hasProductsOrServices = (totalProductsCount + totalServicesCount) > 0;

    // Calculate business metrics
    const totalRevenue = orderItems.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + itemSubtotal;
    }, 0);
    
    const completedOrders = orderItems.filter(item => item.order.status === 'DELIVERED').length;
    const totalOrders = orderItems.length;

    // Calculate average rating from reviews
    const reviews = await prisma.review.findMany({
      where: {
        targetType: 'PROFESSIONAL',
        targetId: professionalProfileId
      },
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    const totalReviews = reviews.length;

    // Get active customers
    const activeCustomers = new Set(
      orderItems.map(item => item.order.customerId)
    ).size;

    // Calculate top performing services/products
    const productPerformance = orderItems.reduce((acc, item) => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.name,
          revenue: 0,
          orders: 0
        };
      }
      const itemNetRevenue = (item.price * item.quantity);
      acc[productId].revenue += itemNetRevenue;
      acc[productId].orders += 1;
      return acc;
    }, {} as Record<string, { name: string; revenue: number; orders: number }>);

    const topServices = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Build Recent Activities
    const recentActivities: ActivityItem[] = [
      // Recent Orders
      ...orderItems.slice(0, 5).map(item => ({
        id: `order-${item.order.id}`,
        type: 'ORDER' as const,
        title: `New Order #${item.order.id.slice(-8).toUpperCase()}`,
        description: `${item.product.name} ordered`,
        timestamp: item.order.createdAt,
        status: item.order.status,
        meta: { customerName: `${item.order.customer.firstName} ${item.order.customer.lastName}` }
      })),
      // Recent Product Updates
      ...products.slice(0, 3).map(p => ({
        id: `product-${p.id}`,
        type: 'PRODUCT' as const,
        title: `Product Updated`,
        description: `${p.name} listing was updated`,
        timestamp: p.updatedAt
      })),
      // Recent Reviews
      ...reviews.slice(0, 2).map((r, i) => ({
        id: `review-${i}`,
        type: 'REVIEW' as const,
        title: `New Review: ${r.rating} Stars`,
        description: r.comment || 'No comment provided',
        timestamp: r.createdAt,
        meta: { customerName: `${r.user.firstName} ${r.user.lastName}` }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    // Calculate period comparison
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const previousOrders = await prisma.orderItem.count({
      where: {
        professionalId: userId,
        order: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }
    });

    const orderChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;
    const primaryCurrency = products[0]?.currency || 'GHS';

    return {
      metrics: {
        totalRevenue,
        completedOrders,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        activeCustomers
      },
      setupStatus: {
        hasProductsOrServices
      },
      analytics: {
        periodComparison: {
          change: Math.round(orderChange * 100) / 100
        },
        insights: [
          {
            title: "Intel Feed",
            description: `You have ${orderItems.length} orders in the last 30 days`,
            change: orderItems.length,
            period: "active"
          },
          {
            title: "Performance",
            description: orderChange >= 0 ? "Growth velocity is positive" : "Velocity slowed down slightly",
            change: Math.round(orderChange * 100) / 100,
            period: "vs last month"
          }
        ]
      },
      topServices,
      recentActivities,
      currency: primaryCurrency
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {};
  }
}

export default Home;