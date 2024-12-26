import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany();
    console.log("Fetched collections:", collections);
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
