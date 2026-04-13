import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InboxClient } from '@/app/components/chat/InboxClient';
import { prisma } from '@/lib/prisma';

export default async function Page() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/messages');
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
    select: { businessName: true }
  });


  return (
    <div className="bg-[#FAFAF9] min-h-screen pt-20 pb-12 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Editorial Title */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-stone-200 pb-8">
          <div className="space-y-4">
             <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400">TrendiZip Chat</span>
             <h1 className="text-6xl md:text-8xl font-serif text-stone-900 leading-none tracking-tighter">
                My Messages
             </h1>
          </div>
          <p className="max-w-xs text-sm text-stone-500 font-serif italic text-right leading-relaxed translate-y-[-10px]">
            Chat directly with sellers and artisans. Ask questions about products or follow up on your custom orders here.
          </p>
        </div>

        {/* The Inbox UI */}
        <InboxClient currentUserId={session.user.id} businessName={profile?.businessName} />
        
        {/* Footer Meta */}
        <div className="flex justify-between items-center text-[10px] font-mono text-stone-300 uppercase tracking-widest pt-8">
            <p>© TrendiZip Private Concierge</p>
            <p>End-to-end encrypted messaging</p>
        </div>
      </div>
    </div>
  );
}
