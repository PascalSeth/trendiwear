import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { downloadLocation } = await req.json()

    if (!downloadLocation) {
      return NextResponse.json({ error: 'downloadLocation is required' }, { status: 400 })
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 })
    }

    // Trigger download endpoint as required by Unsplash API Terms
    const res = await fetch(downloadLocation, {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.warn('[Unsplash Download Tracking Error]', res.status, errorText)
    }

    const data = await res.json()
    return NextResponse.json({ success: true, url: data.url })
  } catch (error: unknown) {
    console.error('[Unsplash Download Error]', error)
    return NextResponse.json({ error: 'Failed to trigger download event' }, { status: 500 })
  }
}
