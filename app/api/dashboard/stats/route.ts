import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get total professionals count (users with role PROFESSIONAL)
    const totalProfessionals = await prisma.user.count({
      where: { role: "PROFESSIONAL" }
    })

    // Get total orders count
    const totalOrders = await prisma.order.count()

    // Get total revenue (sum of all order totalPrice)
    const revenueResult = await prisma.order.aggregate({
      _sum: { totalPrice: true }
    })
    const totalRevenue = revenueResult._sum.totalPrice || 0

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: { status: "PENDING" }
    })

    // Calculate monthly growth (comparing current month vs previous month)
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [currentMonthOrders, previousMonthOrders] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      })
    ])

    const monthlyGrowth = previousMonthOrders > 0
      ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100
      : 0

    return NextResponse.json({
      totalUsers,
      totalProfessionals,
      totalOrders,
      totalRevenue,
      monthlyGrowth,
      pendingOrders
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}