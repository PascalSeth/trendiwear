// app/dashboard/components/ServerNavbar.tsx
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getCurrentUser } from '@/lib/auth'; // Import the auth helper
import { Role } from '@prisma/client';
import Navbar from './Navbar';

const ServerNavbar = async () => {
  const user = await getCurrentUser(); // Get the complete user data
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  // Extract role from user data
  const role: Role = user?.role || Role.CUSTOMER;



  return <Navbar role={role} user={kindeUser} />;
};

export default ServerNavbar;