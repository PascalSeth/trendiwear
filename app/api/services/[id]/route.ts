import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { transformToService } from "@/lib/services"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (isAdmin) {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          category: true,
          _count: { select: { bookings: true } },
        },
      })
      if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 })
      return NextResponse.json(transformToService(service))
    }

    if (user.role === "PROFESSIONAL") {
      const professionalService = await prisma.professionalService.findUnique({
        where: { professionalId_serviceId: { professionalId: user.id, serviceId: id } },
        include: { 
          service: { include: { category: true } }, 
          variants: true,
          addons: true,
          requirements: true,
        },
      })

      if (!professionalService) {
        return NextResponse.json({ error: "Service not found in your listing" }, { status: 404 })
      }

      return NextResponse.json(transformToService(professionalService))
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.[id].GET' })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      description, 
      duration, 
      durationOverride, 
      isHomeService, 
      categoryId, 
      isActive, 
      price, 
      imageUrl, 
      requirements,
      serviceImages,
      serviceAddons,
      serviceRequirements,
    } = body

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (isAdmin) {
      // Admin updates the shared Service record directly
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (duration !== undefined) updateData.duration = Number.parseInt(duration)
      if (isHomeService !== undefined) updateData.isHomeService = Boolean(isHomeService)
      if (categoryId !== undefined) updateData.categoryId = categoryId
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl
      if (requirements !== undefined) updateData.requirements = requirements

      const service = await prisma.service.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          _count: { select: { bookings: true } },
        },
      })
      return NextResponse.json(transformToService(service))
    }

    if (user.role === "PROFESSIONAL") {
      // Professional can update their own ProfessionalService (price, durationOverride, isActive)
      // or update the Service itself if they created it (isCustom)
      const professionalService = await prisma.professionalService.findUnique({
        where: { professionalId_serviceId: { professionalId: user.id, serviceId: id } },
        include: { service: true },
      })

      if (!professionalService) {
        return NextResponse.json({ error: "Service not found in your listing" }, { status: 404 })
      }

      // Update ProfessionalService fields
      const psUpdate: Record<string, unknown> = {}
      if (price !== undefined) psUpdate.price = Number.parseFloat(price)
      if (durationOverride !== undefined) psUpdate.durationOverride = Number.parseInt(durationOverride)
      if (isActive !== undefined) psUpdate.isActive = Boolean(isActive)
      if (serviceImages !== undefined) psUpdate.images = serviceImages

      const updatedPs = await prisma.professionalService.update({
        where: { professionalId_serviceId: { professionalId: user.id, serviceId: id } },
        data: {
          ...psUpdate,
          // Sync addons
          ...(serviceAddons !== undefined ? {
            addons: {
              deleteMany: {},
              create: serviceAddons.map((addon: { name: string; description?: string; price?: string | number; isActive?: boolean }) => ({
                name: addon.name,
                description: addon.description,
                price: Number.parseFloat(String(addon.price || "0")),
                isActive: addon.isActive ?? true,
              }))
            }
          } : {}),
          // Sync requirements
          ...(serviceRequirements !== undefined ? {
            requirements: {
              deleteMany: {},
              create: serviceRequirements.map((req: { question: string; type?: string; options?: string[]; isRequired?: boolean }) => ({
                question: req.question,
                type: req.type || "TEXT",
                options: req.options || [],
                isRequired: req.isRequired ?? true,
              }))
            }
          } : {}),
        },
        include: { 
          service: { include: { category: true } }, 
          variants: true,
          addons: true,
          requirements: true,
        },
      })

      // If they own the custom service, also update the Service record
      if (professionalService.service.isCustom && professionalService.service.createdById === user.id) {
        const svcUpdate: Record<string, unknown> = {}
        if (name !== undefined) svcUpdate.name = name
        if (description !== undefined) svcUpdate.description = description
        if (duration !== undefined) svcUpdate.duration = Number.parseInt(duration)
        if (isHomeService !== undefined) svcUpdate.isHomeService = Boolean(isHomeService)
        if (imageUrl !== undefined) svcUpdate.imageUrl = imageUrl
        if (requirements !== undefined) svcUpdate.requirements = requirements

        if (Object.keys(svcUpdate).length > 0) {
          await prisma.service.update({ where: { id }, data: svcUpdate })
        }
      }

      return NextResponse.json(transformToService(updatedPs))
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.[id].PUT' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)

    if (!isAdmin && user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (user.role === "PROFESSIONAL") {
      // Professional removes the service from their listing (deletes ProfessionalService)
      const professionalService = await prisma.professionalService.findUnique({
        where: { professionalId_serviceId: { professionalId: user.id, serviceId: id } },
        include: { service: true },
      })

      if (!professionalService) {
        return NextResponse.json({ error: "Service not found in your listing" }, { status: 404 })
      }

      const bookingCount = await prisma.booking.count({
        where: { serviceId: id, professionalId: user.id, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
      })

      if (bookingCount > 0) {
        return NextResponse.json({ error: "Cannot remove a service with active bookings" }, { status: 400 })
      }

      await prisma.professionalService.delete({
        where: { professionalId_serviceId: { professionalId: user.id, serviceId: id } },
      })

      // If this was a custom service owned by this professional, also delete the Service itself
      if (professionalService.service.isCustom && professionalService.service.createdById === user.id) {
        await prisma.service.delete({ where: { id } })
      }

      return NextResponse.json({ message: "Service removed from your listing" })
    }

    // Admin deletes the shared Service entirely
    const bookingCount = await prisma.booking.count({ where: { serviceId: id } })
    if (bookingCount > 0) {
      return NextResponse.json({ error: "Cannot delete service that has bookings" }, { status: 400 })
    }

    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.[id].DELETE' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
