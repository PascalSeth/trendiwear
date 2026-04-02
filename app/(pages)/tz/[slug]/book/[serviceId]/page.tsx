import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { transformToService } from "@/lib/services";
import { BookingStudio } from "./BookingStudio";

interface BookingPageProps {
  params: Promise<{
    slug: string;
    serviceId: string;
  }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug, serviceId } = await params;

  const profile = await prisma.professionalProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  if (!profile) return notFound();

  const professionalService = await prisma.professionalService.findUnique({
    where: { id: serviceId },
    include: {
      service: {
        include: {
          category: true,
          _count: {
            select: { bookings: true },
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
      addons: {
        where: { isActive: true },
      },
      requirements: true,
    },
  });

  if (!professionalService || professionalService.professionalId !== profile.userId) {
    return notFound();
  }

  const transformedService = transformToService(professionalService);
  if (!transformedService) return notFound();

  return (
    <div className="min-h-screen bg-white">
      <BookingStudio 
        service={transformedService}
        professional={{
          userId: profile.userId,
          businessName: profile.businessName || undefined,
          businessImage: profile.businessImage || undefined,
          user: {
            firstName: profile.user.firstName,
            lastName: profile.user.lastName,
          },
        }}
        slug={slug}
      />
    </div>
  );
}
