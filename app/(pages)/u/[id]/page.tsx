import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import CustomerProfileClient from './CustomerProfileClient'

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const user = await getUserById(id)
  
  if (!user) {
    return { title: 'User Not Found' }
  }

  const displayName = `${user.firstName} ${user.lastName}`
  
  return {
    title: `${displayName} | TrendiWear`,
    description: `${displayName}'s profile on TrendiWear`,
    openGraph: {
      title: displayName,
      description: `${displayName}'s profile on TrendiWear`,
      images: user.profileImage ? [user.profileImage] : [],
    },
  }
}

async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          wishlist: true,
        },
      },
    },
  })

  return user
}

async function getUserReviews(userId: string) {
  // Get reviews and associated products separately since Review uses targetId
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  // Get products for reviews that target products
  const productIds = reviews
    .filter(r => r.targetType === 'PRODUCT')
    .map(r => r.targetId)

  const products = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          images: true,
        },
      })
    : []

  const productMap = new Map(products.map(p => [p.id, p]))

  return reviews.map(r => ({
    ...r,
    product: r.targetType === 'PRODUCT' ? productMap.get(r.targetId) || null : null,
  }))
}

async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return orders
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [user, session] = await Promise.all([
    getUserById(id),
    getServerSession(authOptions),
  ])

  if (!user) {
    notFound()
  }

  // Check if viewing own profile
  const isOwner = session?.user?.email === user.email

  // If viewing a professional, redirect to their professional profile
  if (user.role === 'PROFESSIONAL') {
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: id },
      select: { slug: true },
    })
    if (professionalProfile?.slug) {
      // Still show customer profile, but professional profile link will be visible
    }
  }

  const [reviews, orders] = await Promise.all([
    getUserReviews(id),
    isOwner ? getUserOrders(id) : Promise.resolve([]),
  ])

  const mappedReviews = reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment || '',
    product: r.product ? {
      id: r.product.id,
      name: r.product.name,
      image: r.product.images?.[0] || null,
    } : null,
    createdAt: r.createdAt.toISOString(),
  }))

  const mappedOrders = orders.map(o => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    firstProduct: o.items[0]?.product || null,
  }))

  const profile = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    memberSince: user.createdAt.toISOString(),
    role: user.role,
    stats: {
      orders: user._count.orders,
      reviews: user._count.reviews,
      wishlist: user._count.wishlist,
    },
    reviews: mappedReviews,
    recentOrders: mappedOrders,
  }

  return <CustomerProfileClient profile={profile} isOwner={isOwner} />
}
