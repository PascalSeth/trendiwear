import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const savedOutfits = await prisma.savedOutfit.findMany({
      where: { userId: user.id },
      include: {
        outfit: {
          include: {
            event: true,
            stylist: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: { businessName: true },
                },
              },
            },
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ savedOutfits })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { outfitId }: { outfitId: string } = body

    const existingSave = await prisma.savedOutfit.findUnique({
      where: {
        userId_outfitId: {
          userId: user.id,
          outfitId,
        },
      },
    })

    if (existingSave) {
      return NextResponse.json({ error: "Outfit already saved" }, { status: 400 })
    }

    const savedOutfit = await prisma.savedOutfit.create({
      data: {
        userId: user.id,
        outfitId,
      },
      include: {
        outfit: {
          include: {
            event: true,
            stylist: {
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
    })

    return NextResponse.json(savedOutfit, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
