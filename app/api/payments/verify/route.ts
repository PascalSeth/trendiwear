import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { mapErrorToResponse } from '@/lib/api-utils'
import { verifyTransaction, toCedis } from '@/lib/paystack'
import { createYangoClaim, acceptYangoClaim } from '@/lib/yango'
import { fulfillOrder } from '@/lib/orders'

// GET: Verify a payment by reference
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { paystackReference: reference },
          { deliveryPaystackReference: reference }
        ]
      },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // If no order exists yet, return error or handle creation (legacy logic)
    if (!order) {
      const paystackResponse = await verifyTransaction(reference)
      const { data } = paystackResponse
      if (data.status === 'success') {
        return NextResponse.json({
          success: true,
          status: 'success',
          message: 'Payment verified. Ready to create order.',
          verifiedAmount: data.amount,
          needsOrderCreation: true,
        })
      }
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify the order belongs to the user
    if (order.customerId !== user.id) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify with Paystack
    const paystackResponse = await verifyTransaction(reference)
    const { data } = paystackResponse

    if (data.status !== 'success') {
       if (data.status === 'pending') {
         return NextResponse.json({ success: false, status: 'pending', message: 'Payment pending' })
       }
       await prisma.order.update({
         where: { id: order.id },
         data: { paymentStatus: 'FAILED' }
       })
       return NextResponse.json({ success: false, status: data.status, message: data.gateway_response || 'Payment failed' })
    }

    const isDeliveryPayment = order.deliveryPaystackReference === reference

    if (isDeliveryPayment) {
       // --- Handle Delivery Payment ---
       const updatedOrder = await prisma.order.update({
         where: { id: order.id },
         data: {
           status: 'SHIPPED',
           yangoStatus: 'PAID',
           paystackPaidAt: new Date(data.paid_at),
         }
       })

       // Trigger Yango Claim
       try {
         const prof = await prisma.professionalProfile.findUnique({
            where: { userId: order.items[0].professionalId },
            include: { user: true }
         })
         
         if (prof && prof.latitude && prof.longitude && order.address && order.address.latitude && order.address.longitude) {
           const claim = await createYangoClaim({
             route_points: [
               {
                 point: [prof.longitude, prof.latitude],
                 type: 'source',
                 visit_order: 1,
                 contact: { name: prof.businessName || "Professional", phone: prof.user.phone || "+2330000000" },
                 address: { fullname: prof.location || "Store Location" }
               },
               {
                 point: [order.address.longitude, order.address.latitude],
                 type: 'destination',
                 visit_order: 2,
                 contact: { name: `${order.customer.firstName} ${order.customer.lastName}`, phone: order.customer.phone || "+2330000000" },
                 address: { fullname: `${order.address.street}, ${order.address.city}` }
               }
             ],
             items: order.items.map((item) => ({
               title: item.product.name,
               quantity: item.quantity,
               cost_value: item.price.toString(),
               cost_currency: "GHS",
               weight: 0.5
             }))
           })
           
           await prisma.order.update({
             where: { id: order.id },
             data: { yangoClaimId: claim.id }
           })
           
           await acceptYangoClaim(claim.id)
         }
       } catch (yangoErr) {
         console.error("Yango claim dispatch failed:", yangoErr)
       }

       return NextResponse.json({
         success: true,
         status: 'success',
         message: 'Delivery payment verified and courier dispatched',
         order: updatedOrder
       })
    } else {
       // --- Handle Initial Order Payment ---
       // If already completed, just return
       if (order.paymentStatus === 'PAID') {
         return NextResponse.json({ success: true, status: 'success', order })
       }

       const updatedOrder = await prisma.order.update({
         where: { id: order.id },
         data: {
           paymentStatus: 'PAID',
           status: 'PROCESSING',
           paystackPaidAt: new Date(data.paid_at),
           paystackChannel: data.channel,
           paystackFees: data.fees ? toCedis(data.fees) : null,
         },
       })

        // Fulfillment logic (stock, cart, notifications)
        await fulfillOrder(order.id)

       return NextResponse.json({
         success: true,
         status: 'success',
         message: 'Payment verified successfully',
         order: updatedOrder
       })
    }

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'payments.verify' })
    return NextResponse.json({ error: message }, { status })
  }
}
