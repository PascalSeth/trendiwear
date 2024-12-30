import prisma from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

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

  if (!professionalProfile) {
    return <div>No professional profile found for this user.</div>;
  }

  // Fetch name of the professional category (optional)
  const professionalCategory = professionalProfile?.professionId
    ? await prisma.professionCategory.findUnique({
        where: { id: professionalProfile.professionId },
        select: { name: true },
      })
    : null;

  return (
    <div className="bg-gradient-to-br from-gray-100 to-yellow-50 min-h-screen p-8">
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

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <section className="col-span-1 bg-white rounded-lg shadow-lg relative overflow-hidden">
          <div className="relative">
            <img
              src="/beccaProfile.jpg"
              alt="Profile Background"
              className="w-full h-60 object-cover"
            />
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

        {/* Other sections */}
      </main>
    </div>
  );
}

export default Home;

