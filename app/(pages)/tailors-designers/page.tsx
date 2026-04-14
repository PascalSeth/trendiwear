import { prisma } from '@/lib/prisma';
import TailorsClient from './TailorsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bespoke Tailors & Custom Fashion Designers",
  description: "Connect with the most talented tailors and designers. Discover artisans who specialize in custom clothing, traditional wear, and high-fashion bespoke design.",
  alternates: {
    canonical: 'https://trendizip.com/tailors-designers',
  },
};

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
          professionalServices: {
            select: {
              price: true,
            },
            take: 10,
          },
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