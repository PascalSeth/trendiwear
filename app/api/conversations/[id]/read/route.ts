import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

/**
 * PATCH /api/conversations/[id]/read
 * Marks all messages in a conversation as read (those not sent by the current user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: conversationId } = await params

    // 1. Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { customerId: true, professionalId: true }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.customerId !== user.id && conversation.professionalId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Mark messages as read
    // We only mark messages sent by the OTHER person
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // 3. Mark corresponding notifications as read too
    // This keeps the Bell in sync with the Chat
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        type: 'MESSAGE_RECEIVED',
        data: {
          path: ['conversationId'],
          equals: conversationId
        }
      },
      data: { isRead: true }
    })

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'conversations.read.PATCH' })
    return NextResponse.json({ error: message }, { status })
  }
}
