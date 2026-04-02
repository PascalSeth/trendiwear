import { type NextRequest, NextResponse } from "next/server"
import { generateAvailableSlots } from "@/lib/booking-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const professionalId = searchParams.get("professionalId")

    if (!date || !professionalId) {
      return NextResponse.json({ error: "date and professionalId are required" }, { status: 400 })
    }

    const slots = await generateAvailableSlots(professionalId, id, date)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("Error fetching slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}
