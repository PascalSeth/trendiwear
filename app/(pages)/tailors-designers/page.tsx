import { prisma } from '@/lib/prisma';
import TailorsClient from './TailorsClient';

export default async function Page() {
  // Fetch all professionals directly on the server
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      user: {
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
          _count: {
            select: {
              products: true,
              professionalServices: true,
            },
          },
        },
      },
      specialization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      completedOrders: 'desc', // Sort by experience/success
    },
  });

  // Hydrate with clean data
  const initialData = JSON.parse(JSON.stringify(professionals));

  return <TailorsClient initialProfessionals={initialData} />;
}