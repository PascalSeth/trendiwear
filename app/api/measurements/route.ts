import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import type { BodyType, StylePreference } from "@prisma/client"

export async function GET() {
  try {
    const user = await requireAuth()

    const measurements = await prisma.measurement.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ measurements })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'measurements.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      bust,
      waist,
      hips,
      shoulder,
      armLength,
      inseam,
      height,
      weight,
      topSize,
      bottomSize,
      dressSize,
      shoeSize,
      bodyType,
      stylePreferences,
      preferredColors,
      notes,
    }: {
      bust?: number
      waist?: number
      hips?: number
      shoulder?: number
      armLength?: number
      inseam?: number
      height?: number
      weight?: number
      topSize?: string
      bottomSize?: string
      dressSize?: string
      shoeSize?: string
      bodyType?: BodyType
      stylePreferences?: StylePreference[]
      preferredColors?: string[]
      notes?: string
    } = body

    const measurements = await prisma.measurement.upsert({
      where: { userId: user.id },
      update: {
        bust,
        waist,
        hips,
        shoulder,
        armLength,
        inseam,
        height,
        weight,
        topSize,
        bottomSize,
        dressSize,
        shoeSize,
        bodyType,
        stylePreferences,
        preferredColors,
        notes,
      },
      create: {
        userId: user.id,
        bust,
        waist,
        hips,
        shoulder,
        armLength,
        inseam,
        height,
        weight,
        topSize,
        bottomSize,
        dressSize,
        shoeSize,
        bodyType,
        stylePreferences,
        preferredColors,
        notes,
      },
    })

    return NextResponse.json(measurements, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'measurements.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
