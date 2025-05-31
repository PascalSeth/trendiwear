import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { AddressType } from "@prisma/client"

export async function GET() {
  try {
    const user = await requireAuth()

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
        isDefault,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
