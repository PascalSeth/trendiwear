import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || 'fashion model outfit trend'
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '16'

    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 })
    }

    // Refine search query specifically for Black model & fashion trend pictures
    const searchQuery = `${query} Black fashion model style outfit`

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Unsplash API Error]', res.status, errorText)
      return NextResponse.json({ error: 'Failed to fetch photos from Unsplash' }, { status: res.status })
    }

    const data = await res.json()

    // Comply with Unsplash guidelines:
    // 1. Hotlink image URLs directly
    // 2. Preserve download_location for trigger endpoint
    // 3. Append utm_source=trendizip&utm_medium=referral for photographer & Unsplash attribution
    const photos = data.results.map((photo: { id: string; description?: string; alt_description?: string; urls: Record<string, string>; color?: string; width?: number; height?: number; links: { download_location: string; html: string }; user: { name: string; username: string; links: { html: string }; profile_image?: { small: string; medium?: string; large?: string } } }) => ({
      id: photo.id,
      description: photo.description || photo.alt_description || `${query} fashion model`,
      urls: {
        raw: photo.urls.raw,
        full: photo.urls.full,
        regular: photo.urls.regular, // Hotlinked URL
        small: photo.urls.small,
        thumb: photo.urls.thumb,
      },
      color: photo.color,
      width: photo.width,
      height: photo.height,
      downloadLocation: photo.links.download_location,
      photographer: {
        name: photo.user.name,
        username: photo.user.username,
        profileUrl: `${photo.user.links.html}?utm_source=trendizip&utm_medium=referral`,
        profileImage: photo.user.profile_image?.medium,
      },
      unsplashUrl: `https://unsplash.com/?utm_source=trendizip&utm_medium=referral`,
    }))

    return NextResponse.json({
      photos,
      totalPages: data.total_pages,
      total: data.total,
    })
  } catch (error: unknown) {
    console.error('[Unsplash API Error]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}
