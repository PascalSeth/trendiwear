import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { mapErrorToResponse } from '@/lib/api-utils'
import { transformToService } from "@/lib/services"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const categoryId = searchParams.get("categoryId")
    const isHomeService = searchParams.get("isHomeService")
    const search = searchParams.get("search")
    const forDashboard = searchParams.get("dashboard") === "true"
    const professionalId = searchParams.get("professionalId")

    // 1. Dashboard View: Get logged-in professional's core library
    if (forDashboard) {
      try {
        const user = await requireAuth()
        
        const professionalServices = await prisma.professionalService.findMany({
          where: {
            professionalId: user.id,
            isActive: true,
          },
          include: {
            service: {
              include: {
                category: true,
                _count: {
                  select: { bookings: true },
                },
              },
            },
            professional: {
              select: {
                firstName: true,
                lastName: true,
                professionalProfile: {
                  select: { businessName: true },
                },
              },
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: "asc" },
            },
            addons: true,
            requirements: true,
          },
          orderBy: { createdAt: "desc" },
        })

        // Transform to expected format
        const services = professionalServices.map(transformToService)

        return NextResponse.json({
          services,
          pagination: { page: 1, limit: services.length, total: services.length, pages: 1 },
        })
      } catch {
        // User not authenticated, fall through
      }
    }

    // 2. Profile View: Get a specific professional's offerings 
    if (professionalId) {
       const [professionalServices, total] = await Promise.all([
          prisma.professionalService.findMany({
            where: {
              professionalId,
              isActive: true,
            },
            include: {
              service: {
                include: {
                  category: true,
                  _count: {
                    select: { bookings: true },
                  },
                },
              },
              professional: {
                select: {
                  firstName: true,
                  lastName: true,
                  professionalProfile: {
                    select: { businessName: true },
                  },
                },
              },
              variants: {
                where: { isActive: true },
                orderBy: { price: "asc" },
              },
              addons: true,
              requirements: true,
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          prisma.professionalService.count({ where: { professionalId, isActive: true } }),
       ]);

       const services = professionalServices.map(transformToService);

       return NextResponse.json({
          services,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
       });
    }

    // 3. Public Catalog: General Search & Discovery
    const where: Prisma.ServiceWhereInput = { isActive: true }
    if (categoryId) where.categoryId = categoryId
    if (isHomeService !== null) where.isHomeService = isHomeService === "true"

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          professionalServices: {
            take: 1,
            select: { price: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ])

    // Add price from first professional service (for display purposes)
    const servicesWithPrice = services.map(s => ({
      ...s,
      price: s.professionalServices[0]?.price || 0,
    }))

    return NextResponse.json({
      services: servicesWithPrice,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.GET' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Only professionals can create services" }, { status: 403 })
    }

    // Check subscription permission
    try {
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: user.id },
        include: { 
          subscription: true,
          trial: true
        }
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Professional profile not found." },
          { status: 404 }
        );
      }

      const now = new Date();
      
      // Check if has active trial
      const hasActiveTrial = profile.trial && now < profile.trial.endDate;
      
      // Check if has active subscription
      const hasActiveSubscription = profile.subscription && 
        profile.subscription.status === "ACTIVE" && 
        profile.subscription.nextRenewalDate && 
        profile.subscription.nextRenewalDate > now;

      if (!hasActiveTrial && !hasActiveSubscription) {
        return NextResponse.json(
          { error: "Subscription expired. Please renew your subscription to create services." },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      return NextResponse.json(
        { error: "Error checking subscription status" },
        { status: 500 }
      );
    }

    const {
      name,
      description,
      price,
      duration,
      durationOverride,
      imageUrl,
      categoryId,
      isHomeService,
      requirements,
      isCustom,
      serviceImages = [],
      serviceAddons = [],
      serviceRequirements = [],
    } = body

    let service

    if (isCustom) {
      // Custom service: create a new Service owned by this professional
      service = await prisma.service.create({
        data: {
          name,
          description,
          duration: Number.parseInt(duration || durationOverride || "60"),
          imageUrl,
          categoryId,
          isHomeService: Boolean(isHomeService),
          requirements,
          isCustom: true,
          createdById: user.id,
        },
      })
    } else {
      // Catalog service: find existing or create shared entry
      service = await prisma.service.findFirst({
        where: {
          name,
          categoryId,
          isCustom: false,
        },
      })

      if (!service) {
        service = await prisma.service.create({
          data: {
            name,
            description,
            duration: Number.parseInt(duration),
            imageUrl,
            categoryId,
            isHomeService: Boolean(isHomeService),
            requirements,
            isCustom: false,
          },
        })
      }
    }

    // Create professional service offering
    const professionalService = await prisma.professionalService.create({
      data: {
        professionalId: user.id,
        serviceId: service.id,
        price: Number.parseFloat(price),
        images: serviceImages,
        ...(durationOverride ? { durationOverride: Number.parseInt(durationOverride) } : {}),
        addons: {
          create: serviceAddons.map((addon: { name: string; description?: string; price?: string | number; isActive?: boolean }) => ({
            name: addon.name,
            description: addon.description,
            price: Number.parseFloat(String(addon.price || "0")),
            isActive: addon.isActive ?? true,
          }))
        },
        requirements: {
          create: serviceRequirements.map((req: { question: string; type?: string; options?: string[]; isRequired?: boolean }) => ({
            question: req.question,
            type: req.type || "TEXT",
            options: req.options || [],
            isRequired: req.isRequired ?? true,
          }))
        }
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: { businessName: true },
            },
          },
        },
        variants: true,
        addons: true,
        requirements: true,
      },
    })

    return NextResponse.json(transformToService(professionalService), { status: 201 })
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: 'services.POST' })
    if (status === 401) return NextResponse.json({ error: message, toast: 'You must be logged in to continue.' }, { status })
    return NextResponse.json({ error: message }, { status })
  }
}
