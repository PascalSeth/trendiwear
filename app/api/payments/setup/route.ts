import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { 
  createTransferRecipient, 
  validateGhanaPhone,
  PAYSTACK_CONFIG,
  getMomoProviderName
} from '@/lib/paystack'

// GET: Fetch professional's payment setup status
export async function GET() {
  try {
    const user = await requireAuth()
    
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        businessName: true,
        momoNumber: true,
        momoProvider: true,
        paystackSubaccountCode: true,
        paymentSetupComplete: true,
      },
    })
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      isSetup: profile.paymentSetupComplete,
      // masked number for general display
      momoNumber: profile.momoNumber ? `${profile.momoNumber.substring(0, 3)}****${profile.momoNumber.substring(7)}` : null,
      // raw number from DB so the UI can prefill the input when editing (kept internal)
      momoNumberRaw: profile.momoNumber || null,
      momoProvider: profile.momoProvider,
      momoProviderName: profile.momoProvider ? getMomoProviderName(profile.momoProvider) : null,
      hasSubaccount: !!profile.paystackSubaccountCode,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment setup'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Create or update payment setup for professional
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { momoNumber, momoProvider } = body
    
    // Normalize provider to upper-case as Paystack expects MTN, VOD, ATL
    let provider = typeof momoProvider === 'string' ? momoProvider.toUpperCase() : momoProvider
    
    // Map legacy/frontend codes if they send the old lowercase ones
    if (provider === 'TEL') provider = 'VOD'
    if (provider === 'TGO') provider = 'ATL'

    // Validate inputs
    if (!momoNumber || !provider) {
      return NextResponse.json(
        { error: 'Mobile money number and provider are required' },
        { status: 400 }
      )
    }
    
    // Validate provider
    const validProviders = Object.values(PAYSTACK_CONFIG.momoProviders)
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid mobile money provider. Use: mtn, tel, or tgo' },
        { status: 400 }
      )
    }
    
    // Validate and format phone number
    const phoneValidation = validateGhanaPhone(momoNumber)
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid Ghana phone number format' },
        { status: 400 }
      )
    }
    
    // Get professional profile
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Professional profile not found. Please complete your profile first.' },
        { status: 404 }
      )
    }
    
    const formattedPhone = phoneValidation.formatted

    // Proactive Uniqueness Check
    const conflictingProfile = await prisma.professionalProfile.findFirst({
      where: { 
        momoNumber: formattedPhone,
        userId: { not: user.id }
      }
    })

    if (conflictingProfile) {
      return NextResponse.json({ 
        error: 'This Mobile Money number is already in use by another professional. Please use a unique number.' 
      }, { status: 409 })
    }
    
    // Prepare Transfer Recipient payload
    const recipientPayload = {
      type: "mobile_money" as const,
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      account_number: formattedPhone,
      bank_code: provider,
      currency: "GHS",
      description: `TrendiWear seller payout for ${profile.businessName}`,
      metadata: {
        professionalId: profile.id,
        userId: user.id,
        businessName: profile.businessName
      },
    }
    
    let recipientCode: string
    
    try {
      // In the Direct Transfer model, we create a recipient. 
      // If one already exists, we could update it, but usually, we just create a new one or keep the old.
      // For simplicity and since Paystack recipients are lightweight, we'll create one if not present.
      
      const response = await createTransferRecipient(recipientPayload)
      recipientCode = response.data.recipient_code
      
    } catch (paystackError) {
      console.error('Paystack recipient error:', paystackError)
      return NextResponse.json(
        { error: paystackError instanceof Error ? paystackError.message : 'Failed to setup payout recipient with Paystack' },
        { status: 500 }
      )
    }
    
    // Update professional profile with payment info
    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: {
        momoNumber: formattedPhone,
        momoProvider: provider,
        paystackRecipientCode: recipientCode,
        paymentSetupComplete: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment setup completed successfully',
      data: {
        isSetup: true,
        momoNumber: `${formattedPhone.substring(0, 3)}****${formattedPhone.substring(7)}`,
        momoProvider: provider,
        momoProviderName: getMomoProviderName(provider),
      },
    })
  } catch (error) {
    console.error('Payment setup error:', error)
    const message = error instanceof Error ? error.message : 'Failed to setup payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
