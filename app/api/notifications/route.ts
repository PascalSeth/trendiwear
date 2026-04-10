import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { NotificationType } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const minimal = searchParams.get("minimal") === "true"

    const where: Prisma.NotificationWhereInput = { userId: user.id }
    if (unreadOnly) where.isRead = false

    const context = searchParams.get("context")
    if (context === "business") {
      // Filter for professional/business related notifications
      where.type = {
        in: [
          "ORDER_UPDATE", 
          "BOOKING_CONFIRMATION", 
          "PAYMENT_RECEIVED", 
          "REVIEW_RECEIVED", 
          "STOCK_ALERT", 
          "DELIVERY_CONFIRMATION_REQUEST", 
          "PAYMENT_RELEASED",
          "MESSAGE_RECEIVED"
        ] as NotificationType[]
      }
    } else if (context === "personal") {
      // Filter for customer/personal related notifications
      where.type = {
        in: [
          "MESSAGE_RECEIVED",
          "ORDER_UPDATE",
          "SHIPPING_UPDATE", 
          "DELIVERY_ARRIVAL", 
          "WISHLIST_SALE", 
          "PROMOTION",
          "NEW_INSPIRATION",
          "SYSTEM_UPDATE"
        ] as NotificationType[]
      }
    }

    // OPTIMIZATION: Only count total if NOT in 'minimal' mode (typically for the bell dropdown)
    // We already have where = { userId, isRead: false } often if unreadOnly is true
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      !minimal ? prisma.notification.count({ where }) : Promise.resolve(0),
      // Fix circular reference: Calculate unread count independently
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: !minimal ? { page, limit, total, pages: Math.ceil(total / limit) } : null,
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.GET' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      type,
      title,
      message,
      data,
    }: {
      userId: string
      type: NotificationType
      title: string
      message: string
      data?: string
    } = body

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.POST' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { markAllAsRead, types } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (types && Array.isArray(types)) {
      await prisma.notification.updateMany({
        where: { 
          userId: user.id, 
          isRead: false,
          type: { in: types }
        },
        data: { isRead: true },
      })

      return NextResponse.json({ message: `Notifications for ${types.join(', ')} marked as read` })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.PUT' })
    return NextResponse.json({ error: message }, { status })
  }
}
