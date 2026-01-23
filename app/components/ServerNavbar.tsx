// app/dashboard/components/ServerNavbar.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCurrentUser } from '@/lib/auth'; // Import the auth helper
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Navbar from './Navbar';

const ServerNavbar = async () => {
  const user = await getCurrentUser(); // Get the complete user data
  const session = await getServerSession(authOptions);

  // Extract role from user data
  const role: Role = user?.role || Role.CUSTOMER;

  // Fetch professional slug on server side
  let profileSlug = '';
  if (user?.id) {
    try {
      // For professionals, try to get their business name slug
      if (role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") {
        const profile = await prisma.professionalProfile.findFirst({
          where: { userId: user.id },
          select: { businessName: true, slug: true }
        });
        if (profile?.slug) {
          profileSlug = profile.slug;
        } else if (profile?.businessName) {
          // Create slug from business name if slug doesn't exist
          profileSlug = profile.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
      }
      // Fallback to name-based slug for all users
      if (!profileSlug && session?.user?.name) {
        const nameParts = session.user.name.split(' ');
        profileSlug = `${nameParts[0].toLowerCase()}-${nameParts.slice(1).join('-').toLowerCase()}`;
      }
    } catch (error) {
      console.error('Error fetching profile slug:', error);
      // Fallback to name-based slug
      if (session?.user?.name) {
        const nameParts = session.user.name.split(' ');
        profileSlug = `${nameParts[0].toLowerCase()}-${nameParts.slice(1).join('-').toLowerCase()}`;
      }
    }
  }

  return <Navbar role={role} user={session?.user || null} profileSlug={profileSlug} />;
};

export default ServerNavbar;