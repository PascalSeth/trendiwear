import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.email) redirect('/auth/signin');

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      address: true,
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, images: true, price: true, currency: true, sizes: true, colors: true,
              professional: {
                select: {
                  firstName: true, lastName: true,
                  professionalProfile: { select: { businessName: true, slug: true } }
                }
              }
            }
          }
        }
      },
      deliveryConfirmation: true,
      paymentEscrow: true,
    }
  });

  if (!order) notFound();

  // Verify access
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  const isCustomer = order.customerId === user?.id;
  const isSeller = order.items.some(i => i.professionalId === user?.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  if (!isCustomer && !isSeller && !isAdmin) notFound();

  const serialized = JSON.parse(JSON.stringify(order));

  return <OrderDetailClient order={serialized} isCustomer={isCustomer} />;
}
