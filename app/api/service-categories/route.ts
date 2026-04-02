import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboard = searchParams.get("dashboard") === "true"
    const professionalTypeId = searchParams.get("professionalTypeId")

    const where: Prisma.ServiceCategoryWhereInput = dashboard ? {} : { isActive: true }
    
    if (professionalTypeId) {
      where.professionalTypes = {
        some: { id: professionalTypeId }
      }
    }

    const categories = await prisma.serviceCategory.findMany({
      where,
      include: {
        services: {
          where: dashboard ? {} : { isActive: true },
          take: dashboard ? undefined : 5,
        },
        _count: {
          select: {
            services: dashboard ? true : { where: { isActive: true } },
          },
        },
      } as Prisma.ServiceCategoryInclude,
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

    const { name, description, imageUrl, professionalTypeIds } = body

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const category = await prisma.serviceCategory.create({
      data: { 
        name, 
        description, 
        imageUrl,
        professionalTypes: professionalTypeIds && professionalTypeIds.length > 0 ? {
          connect: professionalTypeIds.map((id: string) => ({ id }))
        } : undefined
      } as Prisma.ServiceCategoryCreateInput,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
