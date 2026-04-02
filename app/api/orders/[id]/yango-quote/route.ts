import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getYangoQuote } from "@/lib/yango"
import { mapErrorToResponse } from "@/lib/api-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: orderId } = await params

    // 1. Fetch order with items, professional profile, and address
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: true,
          }
        }
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify user is the professional for at least one item
    const isProfessionalForOrder = order.items.some(item => item.professionalId === user.id)
    if (!isProfessionalForOrder && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 2. Fetch Professional's profile for origin coordinates
    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    })

    if (!professionalProfile || !professionalProfile.latitude || !professionalProfile.longitude) {
      return NextResponse.json({ error: "Seller location not set. Please update your profile with coordinates." }, { status: 400 })
    }

    if (!order.address.latitude || !order.address.longitude) {
      return NextResponse.json({ error: "Customer address coordinates missing. Cannot calculate delivery." }, { status: 400 })
    }

    // 3. Prepare Yango Quote Payload
    const payload = {
      route_points: [
        {
          point: [professionalProfile.longitude, professionalProfile.latitude] as [number, number],
          fullname: professionalProfile.location || "Seller Pickup Location",
        },
        {
          point: [order.address.longitude, order.address.latitude] as [number, number],
          fullname: `${order.address.street}, ${order.address.city}`,
        }
      ],
      items: order.items.map(item => ({
        title: item.product.name,
        quantity: item.quantity,
        cost_value: item.price.toString(),
        cost_currency: "GHS",
        weight: 0.5, // Placeholder weight
      }))
    }

    // 4. Call Yango API
    const quote = await getYangoQuote(payload)
    const bestOffer = quote.offers[0]

    if (!bestOffer) {
      return NextResponse.json({ error: "No delivery offers available for this route." }, { status: 400 })
    }

    // 5. Update Order with Quote and Status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        yangoQuoteId: bestOffer.offer_id,
        yangoQuotePrice: parseFloat(bestOffer.price),
        status: "AWAITING_DELIVERY_PAYMENT",
      }
    })

    return NextResponse.json({ 
      success: true, 
      quote: {
        price: bestOffer.price,
        currency: bestOffer.currency,
        offer_id: bestOffer.offer_id
      }
    })

  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'yango-quote' })
    return NextResponse.json({ error: message }, { status })
  }
}
