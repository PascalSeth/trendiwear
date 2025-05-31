import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";
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
      return <SuperAdminDashboard user={user} />;
    }
    
    return <div>No professional profile found for this user.</div>;
  }

  // Format the specialization enum value for display
  const formatSpecialization = (specialization: string) => {
    return specialization
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-yellow-50 min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">
            Welcome in, {professionalProfile.businessName || "User"}
          </h1>
          <p className="text-sm text-gray-500">
            {formatSpecialization(professionalProfile.specialization)}
          </p>
        </div>
        <div className="flex space-x-6">
          <div className="text-center">
            <p className="text-sm font-bold">{professionalProfile.experience || 0}</p>
            <p className="text-sm text-gray-500">Years Experience</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{professionalProfile.rating?.toFixed(1) || "N/A"}</p>
            <p className="text-sm text-gray-500">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">
              {professionalProfile.isVerified ? "Verified" : "Not Verified"}
            </p>
            <p className="text-sm text-gray-500">Status</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <section className="col-span-1 bg-white rounded-lg shadow-lg relative overflow-hidden">
          <div className="relative">
            <Image
              src={professionalProfile.businessImage || "/beccaProfile.jpg"}
              alt="Profile Background"
              width={400}
              height={240}
              className="w-full h-60 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
              <h2 className="text-lg font-bold text-white">
                {professionalProfile.businessName || "User"}
              </h2>
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-gray-300">
                  {formatSpecialization(professionalProfile.specialization)}
                </p>
                <p className="text-xl font-bold text-yellow-400">
                  ${professionalProfile.accountBalance?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional stats cards */}
        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Business Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Orders</span>
              <span className="font-bold">{professionalProfile.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Reviews</span>
              <span className="font-bold">{professionalProfile.totalReviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location</span>
              <span className="font-bold text-sm">{professionalProfile.location}</span>
            </div>
          </div>
        </section>

        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Info</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 block">Bio</span>
              <p className="text-sm mt-1">{professionalProfile.bio || "No bio available"}</p>
            </div>
            <div>
              <span className="text-gray-600 block">Availability</span>
              <p className="text-sm mt-1">{professionalProfile.availability || "Not specified"}</p>
            </div>
          </div>
        </section>

        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Settings</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Free Delivery Above</span>
              <span className="font-bold">
                ${professionalProfile.freeDeliveryThreshold?.toFixed(2) || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Portfolio</span>
              <a 
                href={professionalProfile.portfolioUrl || "#"} 
                className="text-blue-600 hover:underline text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {professionalProfile.portfolioUrl ? "View" : "Not provided"}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;