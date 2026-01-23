// app/dashboard/components/ServerNavbar.tsx
import Navbar from './Navbar'; // Import your Client Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCurrentUser } from '@/lib/auth'; // Import the auth helper
import { Role } from '@prisma/client';

const ServerNavbar = async () => {
  const user = await getCurrentUser(); // Get the complete user data
  const session = await getServerSession(authOptions);
  console.log(user?.role)
  // Handle case when session is null
  if (!session) {
    return null;
  }

  // Extract role from user data with proper type casting
  const role: Role = user?.role || Role.CUSTOMER;
  // Alternative approach if Role enum is not available:
  // const role = (user?.role as Role) || 'CUSTOMER' as Role;

  return <Navbar role={role} />;
};

export default ServerNavbar;