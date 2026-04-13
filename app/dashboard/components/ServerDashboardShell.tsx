// app/dashboard/components/ServerDashboardShell.tsx
import DashboardShell from './DashboardShell';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';

export interface UserInfo {
  name: string;
  email: string;
  image: string | null;
  role: Role;
  businessName?: string;
  businessImage?: string | null;
  trialEndDate?: string | null;
  subscriptionStatus?: string | null;
  hasActiveSubscription?: boolean;
}

interface ServerDashboardShellProps {
  children: React.ReactNode;
}

const ServerDashboardShell = async ({ children }: ServerDashboardShellProps) => {
  const user = await getCurrentUser();
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/signin');
  }

  // Extract role from user data with proper type casting
  const role: Role = user?.role || Role.CUSTOMER;

  // 1. Minimum dashboard access: Only allow staff and professionals in the dashboard
  if (role === Role.CUSTOMER) {
    notFound();
  }

  // 2. Granular sub-path security: Ensure users can't access pages outside their role
  // These checks match the middleware logic for bulletproof security
  if (pathname.startsWith('/dashboard')) {
    // 2.1 Super Admin Only: Management tools
    if (pathname.startsWith('/dashboard/management') && role !== Role.SUPER_ADMIN) {
      notFound();
    }

    // 2.2 Admin/Super Admin Only paths
    const adminOnlyPaths = [
      '/dashboard/customers',
      '/dashboard/professionals',
      '/dashboard/trends',
      '/dashboard/catalogue/category',
      '/dashboard/catalogue/collections'
    ];
    if (adminOnlyPaths.some(p => pathname.startsWith(p)) && !(role === Role.ADMIN || role === Role.SUPER_ADMIN)) {
      notFound();
    }
  }

  // Build user info for display
  // For SUPER_ADMIN, show TrendiZip as the business name
  const userInfo: UserInfo = {
    name: user.name || user.firstName || 'User',
    email: user.email || '',
    image: user.profileImage || user.image,
    role: role,
    businessName: role === Role.SUPER_ADMIN 
      ? 'TrendiZip' 
      : (user.professionalProfile?.businessName || undefined),
    businessImage: role === Role.SUPER_ADMIN 
      ? '/logo3d.jpg' 
      : (user.professionalProfile?.businessImage || undefined),
    trialEndDate: user.professionalProfile?.trial?.endDate?.toISOString() || null,
    subscriptionStatus: user.professionalProfile?.subscription?.status || (user.professionalProfile?.trial ? 'TRIAL' : null),
    hasActiveSubscription: (role === Role.SUPER_ADMIN || role === Role.ADMIN) || !!(
      user.professionalProfile?.subscription && 
      user.professionalProfile.subscription.status === 'ACTIVE' && 
      new Date(user.professionalProfile.subscription.nextRenewalDate) > new Date()
    ) || !!(
      user.professionalProfile?.trial &&
      new Date(user.professionalProfile.trial.endDate) > new Date()
    ),
  };

  return <DashboardShell role={role} userInfo={userInfo}>{children}</DashboardShell>;
};

export default ServerDashboardShell;
