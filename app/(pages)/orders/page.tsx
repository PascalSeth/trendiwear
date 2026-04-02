import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Handle pagination on the server
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  // Optimized parallel fetch for orders and total count
  const [user, total] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                    price: true,
                    currency: true,
                  }
                }
              }
            },
            address: {
              select: {
                street: true,
                city: true,
                state: true,
                country: true,
              }
            }
          }
        }
      }
    }),
    prisma.order.count({
      where: { customer: { email: session.user.email } }
    })
  ]);

  if (!user) {
    redirect('/auth/signin');
  }

  // Serialize and hydrate to the client
  const serializedOrders = JSON.parse(JSON.stringify(user.orders));
  const totalPages = Math.ceil(total / limit);

  return (
    <OrdersClient 
      initialOrders={serializedOrders} 
      totalPages={totalPages} 
      currentPage={page} 
    />
  );
}
