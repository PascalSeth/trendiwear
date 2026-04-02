import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await request.json()

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id, isDeleted: false },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const { isDefault, ...updateData } = body

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: { ...updateData, isDefault },
    })

    return NextResponse.json(address)
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'addresses.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const address = await prisma.address.findFirst({
      where: { id, userId: user.id, isDeleted: false },
    })

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    await prisma.address.update({
      where: { id },
      data: { isDeleted: true, isDefault: false }
    })
    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'addresses.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
