'use client'
import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Bell,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    Filter,
    MoreHorizontal,
    PieChart,
    Plus,
    RefreshCw,
    Search,
    Settings,
    ShoppingBag,
    Star,
    Trash2,
    TrendingUp,
    UserCheck,
    Users,
    XCircle
} from 'lucide-react';

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
  customer: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    product?: {
      name: string;
    };
  }>;
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
    _count?: {
      professionalServices: number;
    };
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

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch recent orders
        const ordersResponse = await fetch('/api/orders?limit=5');
        if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersResponse.json();
        const formattedOrders: Order[] = ordersData.orders.map((order: ApiOrder) => ({
          id: order.id,
          customer: `${order.customer.firstName} ${order.customer.lastName}`,
          professional: order.items[0]?.product?.name || 'Unknown',
          amount: order.totalPrice,
          status: order.status.toLowerCase(),
          date: new Date(order.createdAt).toISOString().split('T')[0]
        }));
        setRecentOrders(formattedOrders);

        // Fetch professionals
        const professionalsResponse = await fetch('/api/professional-profiles?limit=5');
        if (!professionalsResponse.ok) throw new Error('Failed to fetch professionals');
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

  const StatCard = ({ icon: Icon, title, value, change, color }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string | number; change?: number; color: string }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const OrderRow = ({ order }: { order: Order }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{order.customer}</div>
      </td>
      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{order.professional}</div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">KSh {order.amount.toLocaleString()}</div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          order.status === 'completed' ? 'bg-green-100 text-green-800' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </td>
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.date}
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-indigo-600 hover:text-indigo-900">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );

  const ProfessionalRow = ({ prof }: { prof: Professional }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-8 md:h-10 w-8 md:w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {prof.name.charAt(0)}
          </div>
          <div className="ml-2 md:ml-4">
            <div className="text-sm font-medium text-gray-900">{prof.name}</div>
            <div className="text-xs md:text-sm text-gray-500">{prof.owner}</div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">KSh {prof.revenue.toLocaleString()}</div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{prof.orders}</div>
      </td>
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Star className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm text-gray-900">{prof.rating}</span>
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${
          prof.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {prof.status === 'verified' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
          <span className="hidden sm:inline">{prof.status.charAt(0).toUpperCase() + prof.status.slice(1)}</span>
          <span className="sm:hidden">{prof.status === 'verified' ? 'V' : 'P'}</span>
        </span>
      </td>
      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-1 md:space-x-2">
          <button className="text-indigo-600 hover:text-indigo-900">
            <Eye className="h-4 w-4" />
          </button>
          <button className="text-green-600 hover:text-green-900">
            <Edit className="h-4 w-4" />
          </button>
          <button className="text-red-600 hover:text-red-900">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Error loading dashboard: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Manage your TrendiZip platform</p>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add New</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-2 md:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'professionals', label: 'Professionals', icon: UserCheck },
              { id: 'services', label: 'Services', icon: Settings },
              { id: 'professional-types', label: 'Prof. Types', icon: UserCheck },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'content', label: 'Content', icon: Eye },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'system', label: 'System', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-2 md:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change={8.2}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
              />
              <StatCard
                icon={UserCheck}
                title="Professionals"
                value={stats.totalProfessionals}
                change={15.3}
                color="bg-gradient-to-r from-green-500 to-green-600"
              />
              <StatCard
                icon={ShoppingBag}
                title="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                change={12.5}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
              />
              <StatCard
                icon={DollarSign}
                title="Revenue"
                value={`KSh ${stats.totalRevenue.toLocaleString()}`}
                change={18.7}
                color="bg-gradient-to-r from-orange-500 to-orange-600"
              />
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                  <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
                <div className="h-64 bg-gradient-to-t from-indigo-50 to-white rounded-lg flex items-end justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-16 w-16 mx-auto mb-2 text-indigo-300" />
                    <p>Revenue chart visualization</p>
                  </div>
                </div>
              </div>

              {/* Top Professionals */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Professionals</h3>
                <div className="space-y-4">
                  {professionals.slice(0, 5).map((prof, index) => (
                    <div key={prof.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{prof.name}</p>
                          <p className="text-sm text-gray-500">{prof.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">KSh {prof.revenue.toLocaleString()}</p>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-500">{prof.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View all
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map(order => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="space-y-6">
            {/* Header with filters */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Professional Management</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search professionals..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Plus className="h-4 w-4" />
                    <span>Add Professional</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Professionals Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {professionals.map(prof => (
                    <ProfessionalRow key={prof.id} prof={prof} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">3,456</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">23</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">3,321</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">112</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800">
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map(order => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
            <p className="text-gray-600">User management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
            <p className="text-gray-600">Advanced analytics and reporting tools coming soon...</p>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Service Management</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus className="h-4 w-4" />
                  <span>Create Service</span>
                </button>
              </div>
              <p className="text-gray-600">Manage base services that professionals can offer. Set categories, descriptions, and durations.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Services</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Service listing and management interface...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional-types' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Professional Types</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus className="h-4 w-4" />
                  <span>Add Type</span>
                </button>
              </div>
              <p className="text-gray-600">Manage professional categories like Fashion Designers, Tailors, Sellers, etc.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Professional Categories</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Professional type management interface...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Moderation</h3>
              <p className="text-gray-600">Monitor and moderate user-generated content, reviews, blogs, and reported items.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Reported Content</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blogs to Review</p>
                    <p className="text-2xl font-bold text-gray-900">15</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Administration</h3>
              <p className="text-gray-600">Platform-wide settings, financial controls, and system maintenance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Financial Controls</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Platform Commission</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Escrow Hold Period</span>
                    <span className="text-sm font-medium">7 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Minimum Payout</span>
                    <span className="text-sm font-medium">KSh 1,000</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">System Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Maintenance Mode</span>
                    <span className="text-sm font-medium text-green-600">Disabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Notifications</span>
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-approval</span>
                    <span className="text-sm font-medium text-red-600">Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h3>
            <p className="text-gray-600">System configuration and settings coming soon...</p>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;