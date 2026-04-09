import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProfileClient, { ProfessionalProfile } from './ProfileClient';

// Generate metadata for SEO with instant data access
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  
  if (!profile) {
    return { title: 'Profile Not Found' };
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  
  return {
    title: `${displayName} | TrendiZip Atelier`,
    description: profile.bio || `${displayName} - Expert ${profile.specialization.name} on TrendiZip`,
    openGraph: {
      title: `${displayName} | TrendiZip`,
      description: profile.bio || `${displayName} - ${profile.specialization.name}`,
      images: profile.businessImage ? [profile.businessImage] : [],
    },
  };
}

// Optimized profile retrieval with slug and caching strategy
async function getProfileBySlug(slug: string) {
  // 1. Try: exact slug match
  let profile = await prisma.professionalProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      businessName: true,
      businessImage: true,
      coverImage: true,
      galleryImages: true,
      portfolioCollections: true,
      bio: true,
      location: true,
      latitude: true,
      longitude: true,
      availability: true,
      slug: true,
      userId: true,
      rating: true,
      totalReviews: true,
      isVerified: true,
      paymentSetupComplete: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
        },
      },
      specialization: {
        select: {
          name: true,
        },
      },
      socialMedia: {
        select: {
          platform: true,
          url: true,
        }
      },
    },
  });

  if (profile) return profile;

  // 2. Try: if slug looks like a UUID, try finding by userId or id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (isUuid) {
    profile = await prisma.professionalProfile.findFirst({
      where: {
        OR: [
          { userId: slug },
          { id: slug }
        ]
      },
      select: {
        id: true,
        businessName: true,
        businessImage: true,
        coverImage: true,
      galleryImages: true,
      portfolioCollections: true,
      bio: true,
        location: true,
        latitude: true,
        longitude: true,
        availability: true,
        slug: true,
        userId: true,
        rating: true,
        totalReviews: true,
        isVerified: true,
        paymentSetupComplete: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
          },
        },
        specialization: {
          select: {
            name: true,
          },
        },
        socialMedia: {
          select: {
            platform: true,
            url: true,
          }
        },
      },
    });

    if (profile) return profile;
  }

  // 3. Try: fallback to businessName match or user name match
  return await prisma.professionalProfile.findFirst({
    where: {
      OR: [
        { businessName: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' } },
        { businessName: { equals: slug.replace(/-/g, ''), mode: 'insensitive' } },
        { 
          user: {
            OR: [
              { firstName: { equals: slug.split('-')[0], mode: 'insensitive' }, lastName: { equals: slug.split('-')[1], mode: 'insensitive' } },
              { firstName: { equals: slug, mode: 'insensitive' } }
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      businessName: true,
      businessImage: true,
      coverImage: true,
      galleryImages: true,
      portfolioCollections: true,
      bio: true,
      location: true,
      latitude: true,
      longitude: true,
      availability: true,
      slug: true,
      userId: true,
      rating: true,
      totalReviews: true,
      isVerified: true,
      paymentSetupComplete: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
        },
      },
      specialization: {
        select: {
          name: true,
        },
      },
      socialMedia: {
        select: {
          platform: true,
          url: true,
        }
      },
    },
  });
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const [profileData, session] = await Promise.all([
    getProfileBySlug(slug),
    getAuthSession(),
  ]);

  if (!profileData) {
    notFound();
  }

  // Parallel fetch of all related content: Products, Services, and Reviews
  // This eliminates all waterfalls and tab-switching loaders
  const [products, reviews] = await Promise.all([
    prisma.product.findMany({
      where: { professionalId: profileData.userId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        images: true,
        sizes: true,
        colors: true,
        tags: true,
        professional: {
          select: {
            firstName: true,
            lastName: true,
            professionalProfile: {
              select: {
                businessName: true,
                businessImage: true,
                isVerified: true,
              },
            },
          },
        },
        _count: { select: { wishlistItems: true } },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.findMany({
      where: { 
        targetId: { in: (await prisma.product.findMany({ where: { professionalId: profileData.userId }, select: { id: true } })).map(p => p.id) },
        targetType: 'PRODUCT' 
      },
      include: {
        user: { select: { firstName: true, lastName: true, profileImage: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
  ]);

  // Transform location and availability for the client
  const parseBusinessHours = (availability: string | null): string => {
    if (!availability) return 'Not configured';
    try {
      const hours = JSON.parse(availability);
      const openOn = Object.keys(hours).filter(day => hours[day].enabled);
      return openOn.length > 0 ? `${openOn.length} days active` : 'Closed currently';
    } catch { return availability; }
  };

  const profile: ProfessionalProfile = {
    id: profileData.id,
    businessName: profileData.businessName,
    slug: profileData.slug || slug,
    businessImage: profileData.businessImage || undefined,
    coverImage: profileData.coverImage || undefined,
    galleryImages: profileData.galleryImages || undefined,
    portfolioCollections: (profileData as any).portfolioCollections || undefined,
    bio: profileData.bio || undefined,
    rating: profileData.rating || undefined,
    totalReviews: profileData.totalReviews || undefined,
    isVerified: profileData.isVerified || undefined,
    location: {
      address: profileData.location?.split(', ')[0] || 'Studio Address',
      city: profileData.location?.split(', ').slice(-2, -1)[0] || 'City',
      country: profileData.location?.split(', ').slice(-1)[0] || 'Region',
      hours: parseBusinessHours(profileData.availability),
      availabilityRaw: profileData.availability || undefined,
      embedUrl: (profileData.latitude && profileData.longitude) 
        ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${profileData.latitude},${profileData.longitude}&zoom=15`
        : undefined
    },
    reviews: reviews.map(r => ({
      id: r.id,
      userName: `${r.user.firstName} ${r.user.lastName}`,
      userAvatar: r.user.profileImage || undefined,
      rating: r.rating,
      comment: r.comment || '',
      date: new Date(r.createdAt).toLocaleDateString(),
    })),
    featuredProducts: products as unknown as ProfessionalProfile['featuredProducts'],
    socials: profileData.socialMedia.reduce((acc: Record<string, string>, sm) => {
      acc[sm.platform] = sm.url;
      return acc;
    }, {}),
    user: {
      ...profileData.user,
      profileImage: profileData.user.profileImage || undefined
    },
    specialization: profileData.specialization,
  };

  const isOwner = session?.user?.email === profileData.user.email;

  // Hydrate everything to the client
  const initialData = JSON.parse(JSON.stringify(profile));
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return (
    <ProfileClient 
      profile={initialData} 
      slug={slug} 
      isOwner={isOwner} 
      baseUrl={isOwner ? baseUrl : undefined} 
    />
  );
}
