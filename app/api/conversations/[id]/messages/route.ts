import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendNewMessageEmail } from "@/lib/mail";

/**
 * GET /api/conversations/[id]/messages
 * Fetch the message history for a specific conversation.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // First ensure the user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    if (conversation.customerId !== user.id && conversation.professionalId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            professionalProfile: {
              select: {
                businessName: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("[MESSAGES_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: error.status || 500 });
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Send a new message in a conversation.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { content, attachments } = body;
    const { id } = await params;

    if (!content && (!attachments || attachments.length === 0)) {
       return new NextResponse("Message content or attachment is required", { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { select: { email: true, firstName: true } },
        professional: { select: { email: true, firstName: true } }
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    if (conversation.customerId !== user.id && conversation.professionalId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content || "",
        attachments: attachments || [],
        conversationId: id,
        senderId: user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            professionalProfile: {
              select: {
                businessName: true,
              }
            }
          }
        }
      }
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Determine recipient for notification logic (optional but good)
    const recipient = user.id === conversation.customerId 
      ? conversation.professional 
      : conversation.customer;

    // Trigger notification
    if (recipient && recipient.email) {
      try {
        await sendNewMessageEmail({
          to: recipient.email,
          senderName: user.professionalProfile?.businessName || `${user.firstName} ${user.lastName}`,
          messageContent: content || "Sent an attachment",
          conversationId: id,
        });
      } catch (emailErr) {
        console.error("Failed to send message email:", emailErr);
      }
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: error.status || 500 });
  }
}
