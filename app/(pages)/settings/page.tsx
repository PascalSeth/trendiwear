import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function Page() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Fetch user profile and specializations in parallel on the server
  const [profile, specializations] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        professionalProfile: {
          include: {
            socialMedia: true,
          }
        }
      }
    }),
    prisma.professionalType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!profile) {
    redirect('/auth/signin');
  }

  // Serialize data for the client component
  const initialProfile = JSON.parse(JSON.stringify(profile));
  const mappedSpecializations = JSON.parse(JSON.stringify(specializations));

  return (
    <SettingsClient 
      initialProfile={initialProfile} 
      specializations={mappedSpecializations} 
    />
  );
}
