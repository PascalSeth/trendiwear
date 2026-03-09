import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProfileClient, { ProfessionalProfile } from './ProfileClient';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  
  if (!profile) {
    return { title: 'Profile Not Found' };
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;
  
  return {
    title: `${displayName} | TrendiZip`,
    description: profile.bio || `${displayName} - ${profile.specialization.name} on TrendiZip`,
    openGraph: {
      title: displayName,
      description: profile.bio || `${displayName} - ${profile.specialization.name}`,
      images: profile.businessImage ? [profile.businessImage] : [],
    },
  };
}

// Cached data fetching function
async function getProfileBySlug(slug: string) {
  // First try to find by exact slug match
  let profile = await prisma.professionalProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      businessName: true,
      businessImage: true,
      coverImage: true,
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
      socialMedia: true,
    },
  });

  // If not found by slug, try to find by business name
  if (!profile) {
    const decodedSlug = decodeURIComponent(slug).replace(/-/g, ' ');
    profile = await prisma.professionalProfile.findFirst({
      where: {
        businessName: {
          equals: decodedSlug,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        businessName: true,
        businessImage: true,
        coverImage: true,
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
        socialMedia: true,
      },
    });
  }

  return profile;
}

interface SocialMedia {
  platform: string;
  url: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch profile and session in parallel
  const [profileData, session] = await Promise.all([
    getProfileBySlug(slug),
    getServerSession(authOptions),
  ]);

  if (!profileData) {
    notFound();
  }

  // First get all product IDs owned by this professional
  const productIds = await prisma.product.findMany({
    where: { professionalId: profileData.userId },
    select: { id: true }
  }).then(products => products.map(p => p.id));

  // Fetch reviews on products and products in parallel
  const [reviews, products] = await Promise.all([
    prisma.review.findMany({
      where: {
        targetId: { in: productIds },
        targetType: 'PRODUCT'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      where: {
        professionalId: profileData.userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        images: true,
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
        _count: {
          select: {
            wishlistItems: true,
          },
        },
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Transform data for the client component
  // Create a map of product ids to names for reviews
  const allProductsMap = await prisma.product.findMany({
    where: { id: { in: reviews.map(r => r.targetId) } },
    select: { id: true, name: true, images: true }
  }).then(prods => new Map(prods.map(p => [p.id, { name: p.name, image: p.images?.[0] }])));

  const mappedReviews = reviews.map((r: typeof reviews[number]) => ({
    id: r.id,
    userName: `${r.user.firstName} ${r.user.lastName}`,
    userAvatar: r.user.profileImage || undefined,
    rating: r.rating,
    comment: r.comment || '',
    date: new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    productName: allProductsMap.get(r.targetId)?.name || 'Product',
    productImage: allProductsMap.get(r.targetId)?.image || undefined,
  }));

  const mappedProducts = products.map((p: typeof products[number]) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency || 'GHS',
    images: p.images || [],
    professional: {
      firstName: p.professional.firstName,
      lastName: p.professional.lastName,
      professionalProfile: p.professional.professionalProfile ? {
        businessName: p.professional.professionalProfile.businessName,
        businessImage: p.professional.professionalProfile.businessImage || undefined,
        isVerified: p.professional.professionalProfile.isVerified,
      } : undefined,
    },
    _count: p._count,
    tags: p.tags
  }));

  // Parse business hours from availability JSON
  const parseBusinessHours = (availability: string | null): string => {
    if (!availability) return 'Hours not set';
    try {
      const hours = JSON.parse(availability);
      const dayLabels: Record<string, string> = {
        monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
        friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
      };
      const formatTime = (time: string): string => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
      };
      const openDays = Object.entries(hours)
        .filter(([, value]) => (value as { enabled: boolean }).enabled)
        .map(([day, value]) => {
          const v = value as { open: string; close: string };
          return `${dayLabels[day]}: ${formatTime(v.open)} - ${formatTime(v.close)}`;
        });
      return openDays.length > 0 ? openDays.join(' | ') : 'Hours not set';
    } catch {
      // If not valid JSON, return as-is (legacy format)
      return availability;
    }
  };

  // Parse location
  const locationString = profileData.location || '';
  const locationParts = locationString.split(', ');
  const hasValidCoords = profileData.latitude && profileData.longitude && !isNaN(profileData.latitude) && !isNaN(profileData.longitude);
  const location = {
    address: locationParts.slice(0, -2).join(', ') || 'Address not available',
    city: locationParts[locationParts.length - 2] || 'City not available',
    country: locationParts[locationParts.length - 1] || 'Country not available',
    hours: parseBusinessHours(profileData.availability),
    availabilityRaw: profileData.availability || undefined,
    embedUrl: hasValidCoords ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${profileData.latitude},${profileData.longitude}&zoom=15` : undefined
  };

  // Map socialMedia to socials
  const socials = (profileData.socialMedia as SocialMedia[] || []).reduce((acc: Record<string, string>, sm: SocialMedia) => {
    if (sm.platform === 'website') acc.website = sm.url;
    if (sm.platform === 'instagram') acc.instagram = sm.url;
    if (sm.platform === 'facebook') acc.facebook = sm.url;
    return acc;
  }, {});

  const profile: ProfessionalProfile = {
    id: profileData.id,
    businessName: profileData.businessName || '',
    businessImage: profileData.businessImage || undefined,
    coverImage: profileData.coverImage || undefined,
    bio: profileData.bio || undefined,
    rating: profileData.rating || undefined,
    totalReviews: profileData.totalReviews || undefined,
    isVerified: profileData.isVerified || false,
    location,
    reviews: mappedReviews,
    featuredProducts: mappedProducts,
    socials,
    user: {
      id: profileData.user.id,
      firstName: profileData.user.firstName,
      lastName: profileData.user.lastName,
      profileImage: profileData.user.profileImage || undefined,
      email: profileData.user.email,
    },
    specialization: profileData.specialization,
  };

  const isOwner = session?.user?.email === profileData.user.email;

  return <ProfileClient profile={profile} slug={slug} isOwner={isOwner} />;
}
