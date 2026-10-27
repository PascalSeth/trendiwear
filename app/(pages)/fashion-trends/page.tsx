import { prisma } from '@/lib/prisma';
import TrendsClient from './TrendsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Popular Fashion Trends & Outfit Lookbooks",
  description: "Explore the latest fashion trends, seasonal style inspirations, and outfit lookbooks from top designers and tailors in Ghana and worldwide.",
  alternates: {
    canonical: 'https://trendizip.com/fashion-trends',
  },
};

export default async function Page() {
  // Fetch all events on the server
  const events = await prisma.event.findMany({
    include: {
      outfitInspirations: {
        where: { isActive: true },
        take: 3,
        select: {
          outfitImageUrl: true,
        },
      },
      _count: {
        select: {
          outfitInspirations: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Serialize and hydrate
  const initialData = JSON.parse(JSON.stringify(events));

  return <TrendsClient initialEvents={initialData} />;
}
