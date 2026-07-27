import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role, ProfessionalProfile } from "@prisma/client";
import SuperAdminDashboard from "@/app/dashboard/components/SuperAdminDashboard";
import AnalyticsInsights from "@/app/dashboard/components/AnalyticsInsights";
import SetupGuide from "@/app/dashboard/components/SetupGuide";
import RecentActivity, { ActivityItem } from "@/app/dashboard/components/RecentActivity";
import { MerchantWalletOverview } from "@/app/dashboard/components/MerchantWalletOverview";
import { 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag, 
  Star, 
  Activity, 
  Plus, 
  Package, 
  BarChart3, 
  Trophy, 
  Sparkles
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
    escrowBalance?: number;
    withdrawableBalance?: number;
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
  currency?: string;
}

function ProfessionalBusinessDashboard({
  professionalProfile,
  dashboardData
}: {
  professionalProfile: ProfessionalProfile & { specialization: { name: string } };
  dashboardData?: DashboardData;
}) {
  const formatSpecialization = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const currencySymbol = dashboardData?.currency || 'GH₵';

  const withdrawableBalance = professionalProfile.accountBalance || 0;
  const escrowHeldBalance = dashboardData?.metrics?.escrowBalance || 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 font-sans">
      
      {/* Setup Guide Component */}
      <SetupGuide
        isVerified={professionalProfile.isVerified}
        paymentSetupComplete={professionalProfile.paymentSetupComplete}
        hasProductsOrServices={dashboardData?.setupStatus?.hasProductsOrServices || false}
      />

      {/* EXECUTIVE HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Merchant Executive Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {professionalProfile.businessName}
            </h1>
            {professionalProfile.isVerified && (
              <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified Seller
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Category: <span className="font-bold text-slate-800">{formatSpecialization(professionalProfile.specialization?.name || 'Professional')}</span> • Wallet Settlement &amp; Performance Overview
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/catalogue/products/add-product"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add New Item
          </Link>
          <Link
            href="/dashboard/orders"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-slate-200/80"
          >
            <Package className="h-4 w-4 text-indigo-600" /> View Orders
          </Link>
        </div>
      </div>

      {/* MERCHANT WALLET & AUTOMATED PAYOUT OVERVIEW */}
      <MerchantWalletOverview
        initialWithdrawableBalance={withdrawableBalance}
        escrowHeldBalance={escrowHeldBalance}
        currencySymbol={currencySymbol}
        momoNumber={professionalProfile.momoNumber || ''}
        momoProvider={professionalProfile.momoProvider || 'MTN'}
      />

      {/* DELIVERED ORDERS & STORE RATING METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 3: Completed Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered Orders</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {dashboardData?.metrics?.completedOrders || professionalProfile.completedOrders || 0}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Completed transactions
            </p>
          </div>
        </div>

        {/* Card 4: Reputation & Trust */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Rating</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Star className="h-5 w-5 fill-current text-purple-600" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {dashboardData?.metrics?.avgRating?.toFixed(1) || professionalProfile.rating?.toFixed(1) || "5.0"}
              </p>
              <span className="text-xs font-bold text-slate-400">({dashboardData?.metrics?.totalReviews || 0} reviews)</span>
            </div>
            <p className="text-[11px] font-medium text-purple-600 mt-1">
              Verified customer feedback
            </p>
          </div>
        </div>
      </div>

      {/* WORKSPACE & ANALYTICS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left Column: Quick Actions & Top Products */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Flow Actions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Quick Navigation</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </h3>

              <div className="space-y-2.5">
                 <Link href="/dashboard/catalogue/products/add-product" className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-200 transition-all">
                    <div className="p-2 rounded-lg bg-white text-indigo-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                       <Plus className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">Add New Product</h4>
                       <p className="text-[11px] font-medium text-slate-400">List items for sale</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                 </Link>
                 
                 <Link href="/dashboard/ai-studio" className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/60 hover:border-purple-200 transition-all">
                    <div className="p-2 rounded-lg bg-white text-purple-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                       <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-900">AI Generative Studio</h4>
                       <p className="text-[11px] font-medium text-slate-400">Transform colors &amp; model shots</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                 </Link>

                 <Link href="/dashboard/orders" className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 transition-all">
                    <div className="p-2 rounded-lg bg-white text-blue-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                       <Package className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-900">Manage Orders</h4>
                       <p className="text-[11px] font-medium text-slate-400">Track shipments &amp; delivery</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                 </Link>

                 <Link href="/dashboard/analytics" className="group flex items-center p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200/60 hover:border-cyan-200 transition-all">
                    <div className="p-2 rounded-lg bg-white text-cyan-600 shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
                       <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="font-bold text-xs text-slate-900 group-hover:text-cyan-900">Revenue Analytics</h4>
                       <p className="text-[11px] font-medium text-slate-400">Deep performance stream</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                 </Link>
              </div>
            </div>

            {/* Top Performing Sales Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                     <Trophy className="w-4 h-4 text-amber-500" /> Top Selling Items
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">Month</span>
               </div>
               
               <div className="space-y-2.5">
                  {dashboardData?.topServices && dashboardData.topServices.length > 0 ? (
                    dashboardData.topServices.map((service: ServiceItem, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                         <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold ${index === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                               #{index + 1}
                            </span>
                            <div>
                               <p className="font-bold text-slate-900 text-xs truncate max-w-[140px]">{service.name}</p>
                               <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <TrendingUp className="w-2.5 h-2.5" /> High Demand
                               </p>
                            </div>
                         </div>
                         <p className="font-black text-slate-900 text-xs">{currencySymbol} {service.revenue.toFixed(0)}</p>
                      </div>
                    ))
                  ) : (
                     <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <BarChart3 className="w-8 h-8 mb-1.5 opacity-20 mx-auto" />
                        <p className="text-xs font-medium">No sales data recorded yet</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Right Column: Activity Stream & Insights */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                     <Activity className="w-4 h-4 text-indigo-600" /> Recent Activity Stream
                  </h3>
                  <Link href="/dashboard/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    View Orders <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
               </div>
               <RecentActivity activities={dashboardData?.recentActivities || []} />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-indigo-600" /> Executive Insights
                  </h3>
               </div>
               <AnalyticsInsights dashboardData={dashboardData} />
            </div>
         </div>

      </div>

    </div>
  );
}

import { getAuthSession } from "@/lib/auth";

async function Home() {
  const session = await getAuthSession();

  if (!session || !session.user?.email) {
    return <div className="p-8 text-center font-bold text-slate-600">User not authenticated.</div>;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, id: true }
  });

  if (!dbUser) {
    return <div className="p-8 text-center font-bold text-slate-600">User not found in database.</div>;
  }

  const userRole = dbUser?.role;

  if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }

  if (userRole === Role.PROFESSIONAL) {
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: dbUser.id },
      include: { specialization: true }
    });

    if (!professionalProfile) {
      return <div className="p-8 text-center font-bold text-slate-600">No professional profile found for this user.</div>;
    }

    const dashboardData = await getDashboardData(dbUser.id, professionalProfile.id);

    return <ProfessionalBusinessDashboard
      professionalProfile={professionalProfile}
      dashboardData={dashboardData}
    />;
  }

  return <div className="p-8 text-center font-bold text-slate-600">Access denied. Invalid user role.</div>;
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

    // Fetch total Escrow funds currently in HELD status for this professional
    const escrowHeldAggregate = await prisma.paymentEscrow.aggregate({
      where: {
        professionalId: userId,
        status: 'HELD'
      },
      _sum: {
        amount: true
      }
    });

    const escrowBalance = escrowHeldAggregate._sum.amount || 0;

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
      : 5.0;

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
    const primaryCurrency = products[0]?.currency || 'GH₵';

    return {
      metrics: {
        totalRevenue,
        escrowBalance,
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