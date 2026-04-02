import { NextResponse } from 'next/server'
import { getCurrencySymbol, getCurrencyCode } from '@/lib/currency'

export async function GET() {
  try {
    const [symbol, code] = await Promise.all([
      getCurrencySymbol(),
      getCurrencyCode(),
    ])

    return NextResponse.json({
      symbol,
      code,
    })
  } catch (error) {
    console.error('Failed to fetch currency settings:', error)
    return NextResponse.json(
      {
        symbol: '$',
        code: 'GHS',
      },
      { status: 200 } // Return default even on error
    )
  }
}
