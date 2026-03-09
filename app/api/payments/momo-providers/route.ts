import { NextResponse } from 'next/server'
import { listBanks, getMomoProviderName } from '@/lib/paystack'

// GET: List mobile money providers
export async function GET() {
  try {
    // Fetch from Paystack
    const response = await listBanks('ghana', 'mobile_money')
    
    // Format for frontend
    const providers = response.data.map((bank: { code: string; name: string; active: boolean }) => ({
      code: bank.code,
      name: bank.name,
      displayName: getMomoProviderName(bank.code),
      active: bank.active,
    }))

    return NextResponse.json({
      providers,
      // Also include static fallback providers
      fallbackProviders: [
        { code: 'mtn', name: 'MTN', displayName: 'MTN Mobile Money' },
        { code: 'tel', name: 'Telecel', displayName: 'Telecel Mobile Money' },
        { code: 'tgo', name: 'AirtelTigo', displayName: 'AirtelTigo Money' },
      ],
    })
  } catch (error) {
    console.error('Failed to fetch MoMo providers:', error)
    
    // Return fallback providers if API fails
    return NextResponse.json({
      providers: [
        { code: 'mtn', name: 'MTN', displayName: 'MTN Mobile Money', active: true },
        { code: 'tel', name: 'Telecel', displayName: 'Telecel Mobile Money', active: true },
        { code: 'tgo', name: 'AirtelTigo', displayName: 'AirtelTigo Money', active: true },
      ],
      fallback: true,
    })
  }
}
