// app/dashboard/components/ServerNavbar.tsx
import { getUserRole } from '@/app/api/getUserRole/action';
import Navbar from './Navbar'; // Import your Client Component

const ServerNavbar = async () => {
  const { role } = await getUserRole(); // Fetch the user's role

  

  return <Navbar role={role} />;
};

export default ServerNavbar;
