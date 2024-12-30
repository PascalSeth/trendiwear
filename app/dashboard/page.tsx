import prisma from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Fetch professional details of the logged-in user
  const professionalProfile = await prisma.professionalProfile.findUnique({
    where: { userId: user?.id },
  });

  // Fetch name of the professional category
  const professionalCategory = professionalProfile?.professionId
    ? await prisma.professionCategory.findUnique({
        where: { id: professionalProfile.professionId },
        select: { name: true },
      })
    : null;

  return (
    <div className="bg-gradient-to-br from-gray-100 to-yellow-50 min-h-screen p-8">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">
            Welcome in, {professionalProfile?.businessName || "User"}
          </h1>
          <p className="text-sm text-gray-500">
            {professionalProfile?.isBusiness ? "Business Profile" : "Individual Profile"}
          </p>
        </div>
        <div className="flex space-x-6">
          <div className="text-center">
            <p className="text-sm font-bold">{professionalProfile?.experience || 0}</p>
            <p className="text-sm text-gray-500">Years Experience</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{professionalProfile?.rating || "N/A"}</p>
            <p className="text-sm text-gray-500">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">
              {professionalProfile?.isVerified ? "Verified" : "Not Verified"}
            </p>
            <p className="text-sm text-gray-500">Status</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Profile Card */}
        <section className="col-span-1 bg-white rounded-lg shadow-lg relative overflow-hidden">
          {/* Profile Image */}
          <div className="relative">
            <img
              src="/beccaProfile.jpg"
              alt="Profile Background"
              className="w-full h-60 object-cover"
            />
            {/* Overlay Text */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
              <h2 className="text-lg font-bold text-white">
                {professionalProfile?.businessName || "User"}
              </h2>
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-gray-300">
                  {professionalCategory?.name || "Professional Category"}
                </p>
                <p className="text-xl font-bold text-yellow-400">
                  {professionalProfile?.rating || "$1,200"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-md font-bold mb-4">Progress</h2>
          <div className="text-center">
            <p className="text-3xl font-bold">6.1h</p>
            <p className="text-sm text-gray-500">Work Time this week</p>
          </div>
        </section>

        {/* Time Tracker */}
        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-md font-bold mb-4">Time Tracker</h2>
          <div className="text-center">
            <p className="text-3xl font-bold">02:35</p>
            <p className="text-sm text-gray-500">Work Time</p>
          </div>
        </section>

        {/* Onboarding Section */}
        <section className="col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-md font-bold mb-4">Onboarding</h2>
          <div className="text-center">
            <p className="text-xl font-bold">18%</p>
            <p className="text-sm text-gray-500">Task Completion</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
