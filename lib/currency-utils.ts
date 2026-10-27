export const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: 'GH₵',
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  KES: 'KSh',
  ZAR: 'R',
  CAD: 'CA$',
  AUD: 'A$',
  CFA: 'CFA',
  XOF: 'CFA',
  XAF: 'FCFA',
}

export function getCurrencySymbolFromCode(code?: string | null): string {
  if (!code) return 'GH₵'
  const normalized = code.trim().toUpperCase()
  return CURRENCY_SYMBOLS[normalized] || normalized
}

export function formatPrice(amount: number, currencyCode?: string | null): string {
  const symbol = getCurrencySymbolFromCode(currencyCode)
  return `${symbol} ${amount.toFixed(2)}`
}
