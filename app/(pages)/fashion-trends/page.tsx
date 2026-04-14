import { prisma } from '@/lib/prisma';
import TrendsClient from './TrendsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Global Fashion Trends & Style Moodboards",
  description: "Explore the latest fashion trends, seasonal style inspirations, and curated moodboards from top designers and stylists around the world.",
  alternates: {
    canonical: 'https://trendizip.com/fashion-trends',
  },
};

export default async function Page() {
  // Fetch all events on the server
  const events = await prisma.event.findMany({
    include: {
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
