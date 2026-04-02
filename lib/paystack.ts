// Paystack Configuration

export const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  baseUrl: 'https://api.paystack.co',
  
  // Supported MoMo providers in Ghana (Paystack bank codes)
  momoProviders: {
    MTN: 'MTN',
    TELECEL: 'VOD',
    AIRTELTIGO: 'ATL',
  },
  
  // Currency
  currency: 'GHS',
  
  // Handling Fee (3%)
  platformFeePercent: 3, 
}

// Paystack API headers
export const getPaystackHeaders = () => ({
  Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
  'Content-Type': 'application/json',
})

// ================================
// SUBACCOUNT TYPES
// ================================

export interface CreateSubaccountPayload {
  business_name: string
  settlement_bank: string // MoMo provider code
  account_number: string // MoMo phone number
  percentage_charge: number // Platform fee percentage
  description?: string
  primary_contact_email?: string
  primary_contact_name?: string
  primary_contact_phone?: string
  metadata?: Record<string, unknown>
}

export interface SubaccountResponse {
  status: boolean
  message: string
  data: {
    id: number
    subaccount_code: string
    business_name: string
    description: string
    primary_contact_name: string
    primary_contact_email: string
    primary_contact_phone: string
    settlement_bank: string
    account_number: string
    percentage_charge: number
    is_verified: boolean
    active: boolean
    createdAt: string
    updatedAt: string
  }
}

// ================================
// TRANSACTION TYPES
// ================================

export interface InitializeTransactionPayload {
  email: string
  amount: number // Amount in pesewas (kobo)
  currency?: string
  reference?: string
  callback_url?: string
  plan?: string
  invoice_limit?: number
  metadata?: {
    custom_fields?: Array<{
      display_name: string
      variable_name: string
      value: string
    }>
    [key: string]: unknown
  }
  subaccount?: string // Subaccount code for split payment
  bearer?: 'account' | 'subaccount' // Who bears transaction charges
  transaction_charge?: number // Flat fee on transaction in pesewas
  split_code?: string // For multi-split transactions
  split?: {
    type: 'percentage' | 'flat'
    bearer_type: 'account' | 'subaccount' | 'all-proportional' | 'all'
    subaccounts: Array<{
      subaccount: string
      share: number
    }>
  }
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>
}

// ================================
// SPLIT TYPES
// ================================

export interface CreateSplitPayload {
  name: string
  type: 'percentage' | 'flat'
  currency: string
  subaccounts: Array<{
    subaccount: string
    share: number
  }>
  bearer_type: 'account' | 'subaccount' | 'all-proportional' | 'all'
  bearer_subaccount?: string
}

export interface SplitResponse {
  status: boolean
  message: string
  data: {
    id: number
    name: string
    split_code: string
    active: boolean
    bearer_type: string
    bearer_subaccount: number | null
    type: string
    currency: string
    subaccounts: Array<{
      subaccount: {
        id: number
        subaccount_code: string
        business_name: string
        description: string
        primary_contact_name: string
        primary_contact_email: string
        primary_contact_phone: string
        metadata: null
        percentage_charge: number
        settlement_bank: string
        account_number: string
      }
      share: number
    }>
    createdAt: string
    updatedAt: string
  }
}

export interface TransactionInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface TransactionVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned' | 'pending'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: {
      orderId?: string
      [key: string]: unknown
    }
    fees: number
    fees_split: {
      paystack: number
      integration: number
      subaccount: number
      params: {
        bearer: string
        transaction_charge: string
        percentage_charge: string
      }
    } | null
    customer: {
      id: number
      email: string
      customer_code: string
      first_name: string | null
      last_name: string | null
      phone: string | null
    }
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
    plan: null
    split: unknown
    order_id: null
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: null
    source: null
    fees_breakdown: null
    transaction_date: string
    plan_object: unknown
    subaccount: {
      id: number
      subaccount_code: string
      business_name: string
      description: string
      primary_contact_name: string | null
      primary_contact_email: string | null
      primary_contact_phone: string | null
      metadata: null
      percentage_charge: number
      settlement_bank: string
      account_number: string
    } | null
  }
}

export interface RefundTransactionResponse {
  status: boolean
  message: string
  data: {
    id: number
    transaction: number
    integration: number
    deducted_amount: number
    fully_refunded: boolean
    amount: number
    created_at: string
  }
}

// ================================
// TRANSFER TYPES
// ================================

export interface CreateTransferRecipientPayload {
  type: "nuban" | "mobile_money"
  name: string
  account_number: string
  bank_code: string
  currency: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface TransferRecipientResponse {
  status: boolean
  message: string
  data: {
    active: boolean
    createdAt: string
    currency: string
    domain: string
    id: number
    integration: number
    name: string
    recipient_code: string
    type: string
    updatedAt: string
    is_deleted: boolean
    details: {
      account_number: string
      account_name: string | null
      bank_code: string
      bank_name: string
    }
  }
}

export interface InitiateTransferPayload {
  source: "balance"
  amount: number // in pesewas
  recipient: string // recipient_code
  reason?: string
  currency?: string
  reference?: string
}

export interface TransferResponse {
  status: boolean
  message: string
  data: {
    integration: number
    domain: string
    amount: number
    currency: string
    source: string
    reason: string
    recipient: number
    status: string
    transfer_code: string
    id: number
    createdAt: string
    updatedAt: string
  }
}

// ================================
// PAYSTACK API FUNCTIONS
// ================================

/**
 * Create a subaccount for a professional/seller
 * This enables split payments where funds go directly to their MoMo
 */
export async function createSubaccount(payload: CreateSubaccountPayload): Promise<SubaccountResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/subaccount`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify(payload),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create subaccount')
  }
  
  return data
}

/**
 * Update an existing subaccount
 */
export async function updateSubaccount(
  subaccountCode: string, 
  payload: Partial<CreateSubaccountPayload>
): Promise<SubaccountResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/subaccount/${subaccountCode}`, {
    method: 'PUT',
    headers: getPaystackHeaders(),
    body: JSON.stringify(payload),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update subaccount')
  }
  
  return data
}

/**
 * Fetch a subaccount by code
 */
export async function fetchSubaccount(subaccountCode: string): Promise<SubaccountResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/subaccount/${subaccountCode}`, {
    method: 'GET',
    headers: getPaystackHeaders(),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch subaccount')
  }
  
  return data
}

/**
 * Create a multi-account split for transactions
 */
export async function createSplit(payload: CreateSplitPayload): Promise<SplitResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/split`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify(payload),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create split')
  }
  
  return data
}

/**
 * List all banks/MoMo providers
 */
export async function listBanks(country: string = 'ghana', type: string = 'mobile_money') {
  const response = await fetch(
    `${PAYSTACK_CONFIG.baseUrl}/bank?country=${country}&type=${type}`,
    {
      method: 'GET',
      headers: getPaystackHeaders(),
    }
  )
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to list banks')
  }
  
  return data
}

/**
 * Initialize a transaction with optional split payment
 */
export async function initializeTransaction(
  payload: InitializeTransactionPayload
): Promise<TransactionInitResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify({
      ...payload,
      currency: payload.currency || PAYSTACK_CONFIG.currency,
    }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize transaction')
  }
  
  return data
}

/**
 * Verify a transaction by reference
 */
/**
 * Verify a transaction by reference
 */
export async function verifyTransaction(reference: string): Promise<TransactionVerifyResponse> {
  const response = await fetch(
    `${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: getPaystackHeaders(),
    }
  )
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify transaction')
  }
  
  return data
}

/**
 * Refund a transaction
 */
export async function refundTransaction(reference: string, amountPesewas?: number): Promise<RefundTransactionResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/refund`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify({
      transaction: reference,
      ...(amountPesewas && { amount: amountPesewas }),
    }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initiate refund')
  }
  
  return data
}

/**
 * Create a Transfer Recipient
 */
export async function createTransferRecipient(payload: CreateTransferRecipientPayload): Promise<TransferRecipientResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transferrecipient`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify(payload),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create transfer recipient')
  }
  
  return data
}

/**
 * Initiate a Transfer (Payout)
 */
export async function initiateTransfer(payload: InitiateTransferPayload): Promise<TransferResponse> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transfer`, {
    method: 'POST',
    headers: getPaystackHeaders(),
    body: JSON.stringify({
      ...payload,
      currency: payload.currency || PAYSTACK_CONFIG.currency,
    }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initiate transfer')
  }
  
  return data
}

/**
 * Verify a Transfer
 */
export async function verifyTransfer(reference: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transfer/verify/${reference}`, {
    method: 'GET',
    headers: getPaystackHeaders(),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify transfer')
  }
  
  return data
}

/**
 * Generate a unique transaction reference
 */
export function generateReference(prefix: string = 'TZ'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`.toUpperCase()
}

/**
 * Convert amount to pesewas (Paystack uses smallest currency unit)
 */
export function toPesewas(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100)
}

/**
 * Convert pesewas to cedis
 */
export function toCedis(pesewas: number): number {
  return pesewas / 100
}

/**
 * Calculate platform fee and customer total (Fee is added on top)
 */
export function calculateSplit(productSubtotal: number): {
  platformFee: number
  totalWithFee: number
  sellerAmount: number
  platformFeePercent: number
} {
  const platformFeePercent = PAYSTACK_CONFIG.platformFeePercent
  const platformFee = (productSubtotal * platformFeePercent) / 100
  const totalWithFee = productSubtotal + platformFee
  
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    totalWithFee: Math.round(totalWithFee * 100) / 100,
    sellerAmount: Math.round(productSubtotal * 100) / 100,
    platformFeePercent,
  }
}

/**
 * Validate Ghana phone number for MoMo
 */
export function validateGhanaPhone(phone: string): { valid: boolean; formatted: string; provider?: string } {
  // Remove spaces, dashes, and country code
  let cleaned = phone.replace(/[\s-]/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('+233')) {
    cleaned = '0' + cleaned.substring(4)
  } else if (cleaned.startsWith('233')) {
    cleaned = '0' + cleaned.substring(3)
  }
  
  // Check if valid Ghana number
  if (!/^0[235]\d{8}$/.test(cleaned)) {
    return { valid: false, formatted: cleaned }
  }
  
  // Detect provider
  let provider: string | undefined
  const prefix = cleaned.substring(0, 3)
  
  // MTN prefixes
  if (['024', '054', '055', '059'].includes(prefix)) {
    provider = PAYSTACK_CONFIG.momoProviders.MTN
  }
  // Telecel prefixes (Vodafone codes)
  else if (['020', '050'].includes(prefix)) {
    provider = PAYSTACK_CONFIG.momoProviders.TELECEL
  }
  // AirtelTigo prefixes
  else if (['026', '027', '056', '057'].includes(prefix)) {
    provider = PAYSTACK_CONFIG.momoProviders.AIRTELTIGO
  }
  
  return { valid: true, formatted: cleaned, provider }
}

/**
 * Get MoMo provider display name
 */
export function getMomoProviderName(code: string): string {
  const providers: Record<string, string> = {
    MTN: 'MTN Mobile Money',
    VOD: 'Telecel (Vodafone) Mobile Money',
    ATL: 'AirtelTigo Money'
  }
  // Support legacy codes for existing setups
  if (code === 'mtn') return providers.MTN;
  if (code === 'tel' || code === 'vod') return providers.VOD;
  if (code === 'tgo' || code === 'atl') return providers.ATL;
  
  return providers[code] || code
}
