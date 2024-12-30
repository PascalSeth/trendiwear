"use server";

import prisma from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";


export async function RegisterProfessionalAction(formData: FormData) {
  noStore()
  // Retrieve user information from the Kinde session
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  console.log(user);  // Check the content of user
  if (!user) {
      throw new Error("User is not authenticated.");
  }
  

  const userId = user?.id;
if (!userId) {
  throw new Error("User ID is missing or session is invalid.");
}


  // Collect data from the form
  const businessName = formData.get("businessName") as string;
  const isBusiness = formData.get("isBusiness") === "true"; // Is it a business or individual
  const hasStore = formData.get("hasStore") === "true";
  const storeName = formData.get("storeName") as string;
  const workingHours = formData.get("workingHours") as string;
  const storeLocation = formData.get("storeLocation") as string;
  const professionId = formData.get("professionId") as string; // Profession category (e.g., Tailor, Designer)
  const location = formData.get("location") as string; // Professional's location or operational area

  // Check if the professionId exists in the ProfessionCategory table
  const professionCategory = await prisma.professionCategory.findUnique({
    where: { id: professionId },
  });

  if (!professionCategory) {
    throw new Error("Invalid profession category.");
  }

  // Check if a professional profile already exists for the user
  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error("Professional profile already exists for this user.");
  }

  // Create the professional profile first
 await prisma.professionalProfile.create({
    data: {
      userId,
      professionId, // Link to the ProfessionCategory model
      businessName, // Add business name if it's a business, else leave empty
      isBusiness,
      isVerified: false, // Initial status of verification
      location,
      experience: 0, // Default experience value, could be updated later
      rating: 0, // Default rating, could be updated later
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Once the profile is successfully created, update the user's role to PROFESSIONAL
  await prisma.user.update({
    where: { id: userId },
    data: { role: "PROFESSIONAL" },
  });

  // Create a store if `hasStore` is true
  if (hasStore) {
    if (!storeName || !workingHours || !storeLocation) {
      throw new Error(
        "Store name, working hours, and store location are required when `hasStore` is true."
      );
    }

    await prisma.store.create({
      data: {
        name: storeName,
        workingHours,
        location: storeLocation,
        userId, // Linking the store to the user
      },
    });
  }
}
