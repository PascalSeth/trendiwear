import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import type { CouponType } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const active = searchParams.get("active")

    const where: Prisma.CouponWhereInput = {}
    if (active !== null) where.isActive = active === "true"

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count({ where }),
    ])

    return NextResponse.json({
      coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()

    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      applicableCategories,
      applicableProfessionals,
    }: {
      code: string
      description?: string
      type: CouponType
      value: number
      minOrderAmount?: number
      maxDiscount?: number
      usageLimit?: number
      validFrom: string
      validUntil: string
      applicableCategories?: string[]
      applicableProfessionals?: string[]
    } = body

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description,
        type,
        value,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableCategories: applicableCategories || [],
        applicableProfessionals: applicableProfessionals || [],
        createdBy: user.id,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
