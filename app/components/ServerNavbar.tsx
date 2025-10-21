// app/dashboard/components/ServerNavbar.tsx
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getCurrentUser } from '@/lib/auth'; // Import the auth helper
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Navbar from './Navbar';

const ServerNavbar = async () => {
  const user = await getCurrentUser(); // Get the complete user data
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

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
      if (!profileSlug && kindeUser?.given_name && kindeUser?.family_name) {
        profileSlug = `${kindeUser.given_name.toLowerCase()}-${kindeUser.family_name.toLowerCase()}`;
      }
    } catch (error) {
      console.error('Error fetching profile slug:', error);
      // Fallback to name-based slug
      if (kindeUser?.given_name && kindeUser?.family_name) {
        profileSlug = `${kindeUser.given_name.toLowerCase()}-${kindeUser.family_name.toLowerCase()}`;
      }
    }
  }

  return <Navbar role={role} user={kindeUser} profileSlug={profileSlug} />;
};

export default ServerNavbar;