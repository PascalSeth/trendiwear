import { getAuthSession } from '@/lib/auth'; // Import the fast session helper
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Navbar from './Navbar';

const ServerNavbar = async () => {
  const session = await getAuthSession();
  const user = session?.user;

  // Fetch true role from DB to handle stale sessions (ensure Super Admin sees dashboard)
  let role: Role = Role.CUSTOMER;
  if (user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });
    if (dbUser) {
      role = dbUser.role as Role;
    }
  }

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