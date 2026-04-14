import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trendizip.com'

  // Fetch all dynamic content slugs in parallel
  const [products, professionals, categories, collections, blogs] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }),
    prisma.professionalProfile.findMany({
      select: { slug: true, updatedAt: true },
      take: 1000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.collection.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    }),
  ])

  // Static routes — expanded with Ghana-relevant landing pages
  const routes = [
    '',
    '/shopping',
    '/tailors-designers',
    '/fashion-trends',
    '/blog',
    '/professionals',
    '/auth/signin',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : route === '/shopping' || route === '/tailors-designers' ? 0.9 : 0.8,
  }))

  // Product routes
  const productEntries = products.map((product) => ({
    url: `${baseUrl}/shopping/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Professional profile routes
  const professionalEntries = professionals
    .filter((prof) => prof.slug)
    .map((prof) => ({
      url: `${baseUrl}/tz/${prof.slug}`,
      lastModified: prof.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // Category routes — clean crawlable paths (was ?category=slug before)
  const categoryEntries = categories.map((cat) => ({
    url: `${baseUrl}/shopping/categories/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Collection routes — previously missing from sitemap
  const collectionEntries = collections
    .filter((col) => col.slug)
    .map((col) => ({
      url: `${baseUrl}/shopping/collections/${col.slug}`,
      lastModified: col.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  // Blog routes
  const blogEntries = blogs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    ...routes,
    ...productEntries,
    ...professionalEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...blogEntries,
  ]
}
