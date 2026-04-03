import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

/**
 * Consolidate common authenticated data points into a single request.
 * Fetches: User Profile, Cart items, Wishlist count, and Notifications status.
 */
export async function GET() {
  try {
    const userRoleCache = await requireAuth();
    const userId = userRoleCache.id;

    // Parallel fetch from multiple database tables
    const [profile, cart, wishlistCount, notifications, unreadMessagesCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          role: true,
          professionalProfile: {
            select: { id: true, businessName: true, isVerified: true }
          }
        }
      }),
      prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: { name: true, price: true, currency: true, images: true }
          }
        }
      }),
      prisma.wishlistItem.count({
        where: { userId }
      }),
      prisma.notification.findMany({
        where: { userId, isRead: false },
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      // Unread Messages (where current user is NOT the sender)
      prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: userId },
          conversation: {
            OR: [
              { customerId: userId },
              { professionalId: userId }
            ]
          }
        }
      })
    ]);

    return NextResponse.json({
      user: profile,
      cart: {
        items: cart,
        total: cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
      },
      wishlist: { count: wishlistCount },
      notifications: {
        unread: notifications,
        unreadMessagesCount,
        hasMore: notifications.length >= 50
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch Retrieval Error:', error);
    return NextResponse.json({ error: 'Identity Archive currently unavailable' }, { status: 401 });
  }
}
