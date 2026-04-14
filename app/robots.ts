import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL === 'http://localhost:3000' 
    ? 'https://trendizip.com' 
    : process.env.NEXTAUTH_URL || 'https://trendizip.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/shopping/',
          '/shopping/products/',
          '/shopping/categories/',
          '/shopping/collections/',
          '/tailors-designers/',
          '/tz/',
          '/blog/',
          '/fashion-trends/',
          '/professionals/',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/auth/',
          '/checkout/',
          '/cart/',
          '/orders/',
          '/messages/',
          '/settings/',
          '/measurements/',
          '/bookings/',
          '/wishlist/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
