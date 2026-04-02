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

  const displayTitle = profile?.businessName || "Inbox";

  return (
    <div className="bg-[#FAFAF9] min-h-screen pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Editorial Title */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-4">
             <span className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-stone-400">Atelier Inquiries</span>
             <h1 className="text-6xl md:text-8xl font-serif text-stone-900 leading-none tracking-tighter">
                {displayTitle}
             </h1>
          </div>
          <p className="max-w-xs text-sm text-stone-500 font-serif italic text-right leading-relaxed translate-y-[-10px]">
            Direct connection between the artisan and the collector. Manage your custom bespoke commissions and product questions here.
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
