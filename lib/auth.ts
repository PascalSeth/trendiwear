// lib/auth.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "./prisma"
import type { Role } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) return null

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      professionalProfile: {
        include: {
          socialMedia: true,
          documents: true,
          store: true,
          deliveryZones: true,
          specialization: true,
        }
      },
      measurements: true,
      addresses: true,
      orders: {
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Get last 10 orders
      },
      bookingCustomers: {
        include: {
          service: true,
          professional: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Get last 10 bookings as customer
      },
      bookingProfessionals: {
        include: {
          service: true,
          customer: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Get last 10 bookings as professional
      },
      wishlist: {
        include: {
          product: true,
        }
      },
      cart: {
        include: {
          product: true,
        }
      },
      notifications: {
        where: {
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }
    },
  })

  if (!user) {
    // Create new user with data from NextAuth session
    user = await prisma.user.create({
      data: {
        email: session.user.email!,
        name: session.user.name || null,
        image: session.user.image || null,
        firstName: session.user.name?.split(' ')[0] || "",
        lastName: session.user.name?.split(' ').slice(1).join(' ') || "",
        profileImage: session.user.image || null,
        role: 'CUSTOMER', // Default role
        isActive: true,
      },
      include: {
        professionalProfile: {
          include: {
            socialMedia: true,
            documents: true,
            store: true,
            deliveryZones: true,
            specialization: true,
          }
        },
        measurements: true,
        addresses: true,
        orders: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        bookingCustomers: {
          include: {
            service: true,
            professional: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        bookingProfessionals: {
          include: {
            service: true,
            customer: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        wishlist: {
          include: {
            product: true,
          }
        },
        cart: {
          include: {
            product: true,
          }
        },
        notifications: {
          where: {
            isRead: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      },
    })
  }

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

export async function getUserRole() {
  const user = await getCurrentUser()
  return {
    role: user?.role || 'CUSTOMER',
    user: user
  }
}

// Helper function to check if user is professional
export async function isProfessional() {
  const user = await getCurrentUser()
  return user?.role === 'PROFESSIONAL' && !!user.professionalProfile
}

// Helper function to check if user is admin
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}

// Helper function to get professional profile
export async function getProfessionalProfile(userId?: string) {
  const user = userId ? 
    await prisma.user.findUnique({
      where: { id: userId },
      include: { professionalProfile: true }
    }) : 
    await getCurrentUser()

  return user?.professionalProfile
}

// Helper function to update user profile
export async function updateUserProfile(userId: string, data: {
  firstName?: string
  lastName?: string
  phone?: string
  profileImage?: string
}) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
}