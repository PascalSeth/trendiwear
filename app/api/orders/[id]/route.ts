import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { Prisma, OrderStatus } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              include: {
                professional: {
                  select: {
                    firstName: true,
                    lastName: true,
                    professionalProfile: {
                      select: { businessName: true },
                    },
                  },
                },
              },
            },
          },
        },
        deliveryConfirmation: true,
        paymentEscrow: true,
        coupons: {
          include: { coupon: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const canView =
      order.customerId === user.id ||
      order.items.some((item) => item.professionalId === user.id) ||
      ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { status, trackingNumber, notes }: { status?: OrderStatus; trackingNumber?: string; notes?: string } = body

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const canUpdate =
      order.items.some((item) => item.professionalId === user.id) || ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Prisma.OrderUpdateInput = {}
    if (status) updateData.status = status
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (notes) updateData.notes = notes

    if (status === "DELIVERED") {
      updateData.actualDelivery = new Date()

      await prisma.deliveryConfirmation.create({
        data: {
          orderId: id,
          customerId: order.customerId,
          professionalId: user.id,
          confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
