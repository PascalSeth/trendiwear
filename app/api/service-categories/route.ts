import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboard = searchParams.get("dashboard") === "true"

    const categories = await prisma.serviceCategory.findMany({
      where: dashboard ? {} : { isActive: true }, // Show all for dashboard, only active for public
      include: {
        services: {
          where: dashboard ? {} : { isActive: true },
          take: dashboard ? undefined : 5,
        },
        _count: {
          select: {
            services: dashboard ? {} : { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()

    const { name, description, imageUrl } = body

    const category = await prisma.serviceCategory.create({
      data: { name, description, imageUrl },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
