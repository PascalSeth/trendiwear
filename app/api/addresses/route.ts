import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { AddressType } from "@prisma/client"

export async function GET() {
  try {
    const user = await requireAuth()

    const addresses = await prisma.address.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'addresses.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      type,
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      country = "Kenya",
      latitude,
      longitude,
      isDefault = false,
    }: {
      type: AddressType
      firstName: string
      lastName: string
      street: string
      city: string
      state: string
      zipCode: string
      country?: string
      latitude?: number
      longitude?: number
      isDefault?: boolean
    } = body

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        type,
        firstName,
        lastName,
        street,
        city,
        state,
        zipCode,
        country,
        latitude,
        longitude,
        isDefault,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'addresses.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
