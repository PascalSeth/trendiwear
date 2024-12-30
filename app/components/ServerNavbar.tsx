// app/dashboard/components/ServerNavbar.tsx
import { getUserRole } from '@/app/api/getUserRole/action';
import Navbar from './Navbar'; // Import your Client Component
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const ServerNavbar = async () => {
  const { role } = await getUserRole(); // Fetch the user's role
  const {getUser}= getKindeServerSession()
  const user = await getUser()
  

  return <Navbar role={role} user={user} />;
};

export default ServerNavbar;
