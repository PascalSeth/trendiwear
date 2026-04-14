import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trendizip.com'

  // Fetch all dynamic content slugs
  const [products, professionals, categories, blogs] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }),
    prisma.professionalProfile.findMany({
      select: { slug: true }, // Add updatedAt if available in schema
      take: 1000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    }),
    prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    }),
  ])

  // Static routes
  const routes = [
    '',
    '/shopping',
    '/tailors-designers',
    '/fashion-trends',
    '/blog',
    '/auth/signin',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Product routes
  const productEntries = products.map((product) => ({
    url: `${baseUrl}/shopping/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Professional routes
  const professionalEntries = professionals.map((prof) => ({
    url: `${baseUrl}/tz/${prof.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Category routes (filtered shopping)
  const categoryEntries = categories.map((cat) => ({
    url: `${baseUrl}/shopping?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
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
    ...blogEntries,
  ]
}
