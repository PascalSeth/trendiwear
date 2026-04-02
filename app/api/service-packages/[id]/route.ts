import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/service-packages/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Error fetching service package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/service-packages/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, serviceIds, isActive } = body;

    // Verify ownership
    const existing = await prisma.servicePackage.findUnique({
      where: { id }
    });

    if (!existing || existing.professionalId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });
    }

    // Atomic update with smart service syncing
    const updated = await prisma.servicePackage.update({
      where: { id },
      data: {
        name,
        description,
        totalPrice: Number.parseFloat(price),
        isActive,
        services: {
          deleteMany: {}, // Clear current links
          create: serviceIds?.map((serviceId: string) => ({
            professionalServiceId: serviceId
          })) || []
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating service package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/service-packages/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.servicePackage.findUnique({
      where: { id }
    });

    if (!existing || existing.professionalId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });
    }

    await prisma.servicePackage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
