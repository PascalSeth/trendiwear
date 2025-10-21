import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Role, ProfessionalProfile } from "@prisma/client";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import AnalyticsInsights from "./components/AnalyticsInsights";

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
  analytics?: Analytics;
  topServices?: ServiceItem[];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12 animate-fade-in">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Business Dashboard
                </h1>
                <p className="text-lg md:text-xl text-gray-700 font-medium">
                  {professionalProfile.specialization ? formatSpecialization(professionalProfile.specialization.name) : 'Professional Services'}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Live Analytics</span>
                </div>
              </div>
              <div className="flex items-center space-x-6">
              <div className="text-right bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-xl text-white shadow-lg">
                <p className="text-2xl md:text-3xl font-bold">
                  ${dashboardData?.metrics?.totalRevenue?.toFixed(2) || professionalProfile.accountBalance?.toFixed(2) || "0.00"}
                </p>
                <p className="text-sm opacity-90">Revenue</p>
              </div>
                <div className="relative">
                  <div className="w-16 md:w-20 h-16 md:h-20 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-indigo-100">
                    <Image
                      src={professionalProfile.businessImage || "/beccaProfile.jpg"}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Revenue Stats */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white/90">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">${dashboardData?.metrics?.totalRevenue?.toFixed(2) || professionalProfile.accountBalance?.toFixed(2) || "0.00"}</p>
                <p className="text-xs text-green-600 font-medium">
                  {dashboardData?.analytics?.periodComparison?.change !== undefined && (dashboardData.analytics.periodComparison.change >= 0 ? '+' : '')}
                  {dashboardData?.analytics?.periodComparison?.change?.toFixed(1) || '0.0'}% from last month
                </p>
              </div>
            </div>
          </div>

          {/* Orders Completed */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white/90">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Orders Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardData?.metrics?.completedOrders || professionalProfile.completedOrders || 0}</p>
                <p className="text-xs text-blue-600 font-medium">
                  {dashboardData?.analytics?.periodComparison?.change !== undefined && (dashboardData.analytics.periodComparison.change >= 0 ? '+' : '')}
                  {dashboardData?.analytics?.periodComparison?.change?.toFixed(1) || '0.0'}% from last month
                </p>
              </div>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white/90">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardData?.metrics?.avgRating?.toFixed(1) || professionalProfile.rating?.toFixed(1) || "N/A"}</p>
                <p className="text-xs text-yellow-600 font-medium">Based on {dashboardData?.metrics?.totalReviews || professionalProfile.totalReviews || 0} reviews</p>
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-white/90">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardData?.metrics?.activeCustomers || 0}</p>
                <p className="text-xs text-purple-600 font-medium">Active in last 30 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Insights & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Performing Services */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Top Services
            </h3>
            <div className="space-y-4">
              {dashboardData?.topServices && dashboardData.topServices.length > 0 ? (
                dashboardData.topServices.map((service: ServiceItem, index: number) => {
                  const colors = ['bg-green-50 text-green-600', 'bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600'];
                  const colorClass = colors[index % colors.length];
                  return (
                    <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${colorClass.split(' ')[0]}`}>
                      <span className="text-gray-700 font-medium">{service.name}</span>
                      <span className={`font-bold ${colorClass.split(' ')[1]}`}>${service.revenue.toFixed(2)}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">No sales data yet</span>
                    <span className="font-bold text-green-600">$0.00</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h3>
            <div className="space-y-4">
              <Link href="/dashboard/catalogue/products/add-product" className="block">
                <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900">Add New Product</span>
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/orders" className="block">
                <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900">View Orders</span>
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/analytics" className="block">
                <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900">View Analytics</span>
                  </div>
                </button>
              </Link>
            </div>
          </div>

          {/* Analytics Insights */}
          <AnalyticsInsights dashboardData={dashboardData} />
        </div>
      </div>
    </div>
  );
}

async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Check if user exists and has a valid ID
  if (!user || !user.id) {
    // Return an error or redirect the user if the ID is not found
    return <div>User not authenticated or user ID not found.</div>;
  }

  // Fetch user from database to get role information
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  const userRole = dbUser?.role;

  // Check if user has admin role and render SuperDashboard
  if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }

  // For professionals, fetch dashboard data and show business dashboard
  if (userRole === Role.PROFESSIONAL) {
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: { specialization: true }
    });

    if (!professionalProfile) {
      return <div>No professional profile found for this user.</div>;
    }

    // Fetch dashboard data from API
    try {
      const dashboardResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard`, {
        headers: {
          // In server components, we need to handle auth differently
          // For now, we'll pass the data directly since we're already authenticated
        }
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        return <ProfessionalBusinessDashboard
          professionalProfile={professionalProfile}
          dashboardData={dashboardData}
        />;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }

    // Fallback to original behavior if API fails
    return <ProfessionalBusinessDashboard professionalProfile={professionalProfile} />;
  }

  return <div>Access denied. Invalid user role.</div>;
}

export default Home;