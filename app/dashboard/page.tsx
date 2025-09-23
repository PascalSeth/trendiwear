import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Role } from "@prisma/client";
import SuperAdminDashboard from "./components/SuperAdminDashboard";

async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Check if user exists and has a valid ID
  if (!user || !user.id) {
    // Return an error or redirect the user if the ID is not found
    return <div>User not authenticated or user ID not found.</div>;
  }

  // Fetch professional details using the valid user ID
  const professionalProfile = await prisma.professionalProfile.findUnique({
    where: { userId: user.id }, // Ensure userId is passed correctly
    include: { specialization: true }
  });

  // Handle case where no professional profile exists
  // Check if user has admin role and render SuperDashboard
  if (!professionalProfile) {
    // Fetch user from database to get role information
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
      return <SuperAdminDashboard />;
    }
    
    return <div>No professional profile found for this user.</div>;
  }

  // Format the specialization name for display
  const formatSpecialization = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
     <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
       {/* Header Section */}
       <div className="mb-8">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
           <div>
             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
               Welcome back, {professionalProfile.businessName || "Professional"}
             </h1>
             <p className="text-base md:text-lg text-gray-600 mt-1">
               {professionalProfile.specialization ? formatSpecialization(professionalProfile.specialization.name) : 'No specialization'}
             </p>
           </div>
           <div className="flex items-center space-x-4">
             <div className="text-right">
               <p className="text-xl md:text-2xl font-bold text-green-600">
                 ${professionalProfile.accountBalance?.toFixed(2) || "0.00"}
               </p>
               <p className="text-sm text-gray-500">Account Balance</p>
             </div>
             <div className="w-12 md:w-16 h-12 md:h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
               <Image
                 src={professionalProfile.businessImage || "/beccaProfile.jpg"}
                 alt="Profile"
                 width={64}
                 height={64}
                 className="w-full h-full object-cover"
               />
             </div>
           </div>
         </div>
       </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{professionalProfile.completedOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">{professionalProfile.completedOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{professionalProfile.rating?.toFixed(1) || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{professionalProfile.totalReviews || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Experience</span>
                <span className="font-medium">{professionalProfile.experience || 0} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{professionalProfile.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${professionalProfile.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {professionalProfile.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Bio</p>
                <p className="text-sm">{professionalProfile.bio || "No bio available"}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/dashboard/catalogue/products/add-product" className="block">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Product
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/orders" className="block">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    View Orders
                  </div>
                </button>
              </Link>
              <Link href="/dashboard/analytics" className="block">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Analytics
                  </div>
                </button>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Welcome to your dashboard!</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile setup completed</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Complete your verification</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;