import { prisma } from './prisma'

// Cache for currency settings
let currencySymbol: string | null = null
let lastFetch: number = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

/**
 * Get the primary currency symbol from system settings
 * Falls back to "$" if not configured
 */
export async function getCurrencySymbol(): Promise<string> {
  // Return cached value if still valid
  if (currencySymbol && Date.now() - lastFetch < CACHE_DURATION) {
    return currencySymbol
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'primaryCurrencySymbol' },
    })

    currencySymbol = setting?.value || '$'
    lastFetch = Date.now()
    return currencySymbol
  } catch (error) {
    console.warn('Failed to fetch currency symbol, using default:', error)
    return '$'
  }
}

/**
 * Get currency code (e.g., 'GHS', 'USD')
 */
export async function getCurrencyCode(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'primaryCurrencyCode' },
    })

    return setting?.value || 'GHS'
  } catch {
    return 'GHS'
  }
}

/**
 * Format amount with currency symbol
 */
export async function formatCurrency(amount: number): Promise<string> {
  const symbol = await getCurrencySymbol()
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Clear the cache (useful after updating settings)
 */
export function clearCurrencyCache(): void {
  currencySymbol = null
  lastFetch = 0
}
