import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth-config";
import { prisma } from '@/lib/prisma';


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch the booking to ensure it belongs to this professional
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        professional: {
          include: { 
            professionalProfile: true 
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.professionalId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.paymentStatus !== 'PARTIALLY_PAID' || !booking.balanceAmount) {
       return NextResponse.json({ error: 'No balance remaining for this booking' }, { status: 400 });
    }

    // 2. Check if an active invoice already exists
    const existingInvoice = await prisma.bookingInvoice.findFirst({
       where: { 
         bookingId, 
         status: 'PENDING' 
       }
    });

    if (existingInvoice) {
       return NextResponse.json({ 
         error: 'A pending invoice already exists for this booking',
         invoice: existingInvoice 
       }, { status: 400 });
    }

    // 3. Initialize Paystack Transaction for the balance
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: booking.customer.email,
        amount: Math.round(booking.balanceAmount * 100), // convert to kobo
        callback_url: `${process.env.NEXTAUTH_URL}/bookings`,
        metadata: {
          type: 'BOOKING_BALANCE',
          bookingId: booking.id,
          customerId: booking.customerId,
          professionalId: booking.professionalId
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData?.status) {
      throw new Error(paystackData?.message || 'Paystack initialization failed');
    }

    const { authorization_url, reference } = paystackData.data;

    // 4. Create the BookingInvoice record
    const invoice = await prisma.bookingInvoice.create({
      data: {
        bookingId: booking.id,
        professionalId: booking.professionalId,
        amount: booking.balanceAmount,
        paystackReference: reference,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // 5. (Optional) You could trigger a notification/email to the customer here
    // notifyCustomer(booking.customer.email, authorization_url);

    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoiceId: invoice.id,
      paymentUrl: authorization_url
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Invoice Generation Error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to generate balance invoice' },
      { status: 500 }
    );
  }
}
