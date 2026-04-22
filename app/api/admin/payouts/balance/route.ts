import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { checkBalance } from '@/lib/paystack'

export async function GET() {
  try {
    const user = await requireAuth()
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const balanceData = await checkBalance()
    
    return NextResponse.json(balanceData)

  } catch (error: unknown) {
    console.error('[Admin-Balance] GET Error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 })
  }
}
