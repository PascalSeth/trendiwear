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
      bust, waist, hips, shoulder, armLength, inseam,
      neck, underbust, hpsToWaist, napeToWaist, bicep, wrist,
      thigh, knee, ankle, crotchRise,
      height, weight,
      topSize, bottomSize, dressSize, shoeSize,
      bodyType, stylePreferences, preferredColors, notes,
      unit,
    }: {
      bust?: number; waist?: number; hips?: number; shoulder?: number; armLength?: number; inseam?: number;
      neck?: number; underbust?: number; hpsToWaist?: number; napeToWaist?: number; bicep?: number; wrist?: number;
      thigh?: number; knee?: number; ankle?: number; crotchRise?: number;
      height?: number; weight?: number;
      topSize?: string; bottomSize?: string; dressSize?: string; shoeSize?: string;
      bodyType?: BodyType; stylePreferences?: StylePreference[];
      preferredColors?: string[]; notes?: string;
      unit?: string;
    } = body

    const measurements = await prisma.measurement.upsert({
      where: { userId: user.id },
      update: {
        bust, waist, hips, shoulder, armLength, inseam,
        neck, underbust, hpsToWaist, napeToWaist, bicep, wrist,
        thigh, knee, ankle, crotchRise,
        height, weight,
        topSize, bottomSize, dressSize, shoeSize,
        bodyType, stylePreferences, preferredColors, notes,
        unit,
      },
      create: {
        userId: user.id,
        bust, waist, hips, shoulder, armLength, inseam,
        neck, underbust, hpsToWaist, napeToWaist, bicep, wrist,
        thigh, knee, ankle, crotchRise,
        height, weight,
        topSize, bottomSize, dressSize, shoeSize,
        bodyType, stylePreferences, preferredColors, notes,
        unit,
      },
    })

    return NextResponse.json(measurements, { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'measurements.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
