import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.[id].GET' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { isRead } = body

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: isRead ?? true },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.[id].PUT' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'notifications.[id].DELETE' })
    return NextResponse.json({ error: message }, { status })
  }
}
