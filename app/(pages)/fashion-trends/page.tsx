import { prisma } from '@/lib/prisma';
import TrendsClient from './TrendsClient';

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
