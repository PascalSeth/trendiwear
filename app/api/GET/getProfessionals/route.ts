import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Fetch all professional profiles
    const collections = await prisma.professionalProfile.findMany({
      include: {
        socialMedia: true,          // Include related social media accounts
        documents: true,            // Include related verification documents
        user: true,                 // Include related user data
        profession: true,           // Include related profession category
        store: true,                // Include related stores
      },
    });

    // Calculate metrics
    const total = collections.length;
    const verified = collections.filter((profile) => profile.isVerified).length;
    const hasStores = collections.filter((profile) => profile.hasStore).length;
    const business = collections.filter((profile) => profile.isBusiness).length;

    // Construct response
    const response = {
      professionals: collections,
      metrics: {
        total,
        verified,
        hasStores,
        business,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
