import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL === 'http://localhost:3000' 
    ? 'https://trendizip.com' 
    : process.env.NEXTAUTH_URL || 'https://trendizip.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/auth/', '/checkout/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
