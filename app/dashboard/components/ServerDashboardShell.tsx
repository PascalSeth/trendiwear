// app/dashboard/components/ServerDashboardShell.tsx
import DashboardShell from './DashboardShell';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

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

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/signin');
  }

  // Extract role from user data with proper type casting
  const role: Role = user?.role || Role.CUSTOMER;

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
    trialEndDate: user.professionalProfile?.trialEndDate?.toISOString() || null,
    subscriptionStatus: user.professionalProfile?.subscriptionStatus || null,
    hasActiveSubscription: (role === Role.SUPER_ADMIN || role === Role.ADMIN) || !!(
      user.professionalProfile?.subscription && 
      user.professionalProfile.subscription.status === 'ACTIVE' && 
      new Date(user.professionalProfile.subscription.nextRenewalDate) > new Date()
    ),
  };

  return <DashboardShell role={role} userInfo={userInfo}>{children}</DashboardShell>;
};

export default ServerDashboardShell;
