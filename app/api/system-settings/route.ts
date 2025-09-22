import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: "asc" },
        { key: "asc" }
      ],
    })

    return NextResponse.json({ settings })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { key, value, description, category } = await request.json()

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description,
        category: category || "general",
        updatedBy: user.id,
      },
      create: {
        key,
        value,
        description,
        category: category || "general",
        updatedBy: user.id,
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}