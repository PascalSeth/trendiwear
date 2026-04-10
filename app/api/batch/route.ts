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
      // Profile: Critical data for dashboard
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
      // Cart: Essential for navigation bar
      prisma.cartItem.findMany({
        where: { userId },
        select: {
          id: true,
          quantity: true,
          product: {
            select: { price: true }
          }
        }
      }),
      // Wishlist: Count only
      prisma.wishlistItem.count({
        where: { userId }
      }),
      // Notifications: Limited to most recent unread
      prisma.notification.findMany({
        where: { userId, isRead: false },
        take: 10, // Reduced from 50 to 10 for faster menu loading
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, title: true, createdAt: true }
      }),
      // Unread Messages: Optimized via indexing
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

    // Segment notifications into Buyer vs Professional activity
    const professionalTypes = [
      'PAYMENT_RECEIVED', 'REVIEW_RECEIVED', 'DELIVERY_CONFIRMATION_REQUEST', 
      'PAYMENT_RELEASED', 'STOCK_ALERT', 'BOOKING_UPDATE', 'BOOKING_CONFIRMATION'
    ];

    const hasProfessionalActivity = notifications.some(n => professionalTypes.includes(n.type));

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
        hasProfessionalActivity,
        hasMore: notifications.length >= 50
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch Retrieval Error:', error);
    return NextResponse.json({ error: 'Identity Archive currently unavailable' }, { status: 401 });
  }
}
