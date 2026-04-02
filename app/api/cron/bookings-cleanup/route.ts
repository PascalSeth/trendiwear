import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const expiredCount = await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        requestExpiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({ 
      success: true, 
      expiredCount: expiredCount.count 
    })
  } catch (error) {
    console.error("Cleanup cron failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
