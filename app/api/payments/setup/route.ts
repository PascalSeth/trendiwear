import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { 
  createSubaccount, 
  updateSubaccount, 
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
      momoNumber: profile.momoNumber ? `${profile.momoNumber.substring(0, 3)}****${profile.momoNumber.substring(7)}` : null,
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
    
    // Validate inputs
    if (!momoNumber || !momoProvider) {
      return NextResponse.json(
        { error: 'Mobile money number and provider are required' },
        { status: 400 }
      )
    }
    
    // Validate provider
    const validProviders = Object.values(PAYSTACK_CONFIG.momoProviders)
    if (!validProviders.includes(momoProvider)) {
      return NextResponse.json(
        { error: 'Invalid mobile money provider. Use: mtn, vod, or tgo' },
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
    
    // Prepare subaccount payload
    const subaccountPayload = {
      business_name: profile.businessName,
      settlement_bank: momoProvider,
      account_number: formattedPhone,
      percentage_charge: PAYSTACK_CONFIG.platformFeePercent,
      description: `TrendiWear seller account for ${profile.businessName}`,
      primary_contact_email: profile.user.email,
      primary_contact_name: `${profile.user.firstName} ${profile.user.lastName}`,
      primary_contact_phone: profile.user.phone || formattedPhone,
      metadata: {
        professionalId: profile.id,
        userId: user.id,
      },
    }
    
    let subaccountCode: string
    
    try {
      if (profile.paystackSubaccountCode) {
        // Update existing subaccount
        const response = await updateSubaccount(profile.paystackSubaccountCode, subaccountPayload)
        subaccountCode = response.data.subaccount_code
      } else {
        // Create new subaccount
        const response = await createSubaccount(subaccountPayload)
        subaccountCode = response.data.subaccount_code
      }
    } catch (paystackError) {
      console.error('Paystack subaccount error:', paystackError)
      return NextResponse.json(
        { error: paystackError instanceof Error ? paystackError.message : 'Failed to setup payment account with Paystack' },
        { status: 500 }
      )
    }
    
    // Update professional profile with payment info
    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: {
        momoNumber: formattedPhone,
        momoProvider,
        paystackSubaccountCode: subaccountCode,
        paymentSetupComplete: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment setup completed successfully',
      data: {
        isSetup: true,
        momoNumber: `${formattedPhone.substring(0, 3)}****${formattedPhone.substring(7)}`,
        momoProvider,
        momoProviderName: getMomoProviderName(momoProvider),
      },
    })
  } catch (error) {
    console.error('Payment setup error:', error)
    const message = error instanceof Error ? error.message : 'Failed to setup payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
