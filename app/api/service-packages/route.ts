import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/service-packages?professionalId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const professionalId = searchParams.get("professionalId");
    const dashboard = searchParams.get("dashboard") === "true";

    let professionalIdToUse = professionalId;

    if (dashboard) {
      const session = await getAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      professionalIdToUse = session.user.id;
    }

    if (!professionalIdToUse) {
      return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });
    }

    const packages = await prisma.servicePackage.findMany({
      where: { professionalId: professionalIdToUse },
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching service packages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/service-packages
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, serviceIds } = body;

    if (!name || !price || !serviceIds || !Array.isArray(serviceIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const servicePackage = await prisma.servicePackage.create({
      data: {
        name,
        description,
        totalPrice: Number.parseFloat(price),
        professionalId: session.user.id,
        services: {
          create: serviceIds.map((id: string) => ({
            professionalServiceId: id
          }))
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    return NextResponse.json(servicePackage);
  } catch (error) {
    console.error("Error creating service package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
