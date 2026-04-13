// lib/auth.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "./prisma"
import { HttpError } from './errors'
import type { Role } from "@prisma/client"

export async function getAuthSession() {
  await headers()
  await cookies()
  const session = await getServerSession(authOptions)
  return session
}

export async function getCurrentUser() {
  await headers()
  await cookies()
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) return null

  // ONLY query the database if we actually need the full user object with all relations
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      professionalProfile: {
        include: {
          socialMedia: true,
          documents: true,
          store: true,
          deliveryZones: true,
          specialization: true,
          subscription: {
            include: {
              tier: true,
            },
          },
          trial: true,
        }
      },
      measurements: true,
      addresses: true,
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    },
  })

  return user
}

import { headers, cookies } from "next/headers"

/**
 * ULTRA FAST AUTH CHECK
 * Does not query the database. Uses JWT session data.
 */
export async function requireAuth() {
  // Prime headers/cookies for Next.js 15 compatibility if needed
  await headers()
  await cookies()
  
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    throw new HttpError("Unauthorized", 401)
  }
  return session.user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  
  // If the role in the session is already allowed, we're good (fast path)
  if (allowedRoles.includes(user.role)) {
    return user
  }

  // If not, double check the database in case the session is stale
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (dbUser && allowedRoles.includes(dbUser.role)) {
    // Update the user object with the true role before returning
    return { ...user, role: dbUser.role }
  }

  throw new HttpError("Forbidden", 403)
}

export async function requireProfessional() {
  return requireRole(['PROFESSIONAL', 'SUPER_ADMIN', 'ADMIN'])
}

export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN'])
}

export async function getUserRole() {
  const session = await getServerSession(authOptions)
  return {
    role: session?.user?.role || 'CUSTOMER',
    user: session?.user || null
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
      image: data.profileImage || undefined, // Sync NextAuth image field
      updatedAt: new Date()
    }
  })
}