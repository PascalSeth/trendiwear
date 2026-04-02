import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/conversations
 * Fetch all conversations for the authenticated user.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: user.id },
          { professionalId: user.id }
        ],
        isActive: true
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
            professionalProfile: {
                select: {
                    businessName: true,
                    businessImage: true
                }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("[CONVERSATIONS_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: error.status || 500 });
  }
}

/**
 * POST /api/conversations
 * Initialize a conversation with a professional.
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { professionalId, subject } = body;

    if (!professionalId) {
      return new NextResponse("Professional ID is required", { status: 400 });
    }

    if (professionalId === user.id) {
      return new NextResponse("Self-messaging is not allowed. You cannot start a conversation with yourself.", { status: 400 });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findUnique({
      where: {
        customerId_professionalId: {
          customerId: user.id,
          professionalId
        }
      },
      include: {
        messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId: user.id,
          professionalId,
          subject: subject || "New Inquiry"
        },
        include: {
            messages: true
        }
      });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("[CONVERSATIONS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: error.status || 500 });
  }
}
