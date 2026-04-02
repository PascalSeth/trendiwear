import { requireAuth } from "@/lib/auth";
import ServerDashboardShell from "@/app/dashboard/components/ServerDashboardShell";
import { BookingsManager } from "./BookingsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Management | Dashboard",
  description: "Manage your professional service appointments and requests.",
};

export default async function DashboardBookingsPage() {
  const user = await requireAuth();

  // Redirect or show denuded access if not professional/admin
  if (!["PROFESSIONAL", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return (
       <div className="flex items-center justify-center h-screen font-serif text-2xl italic text-stone-400">
          Access Denied. Professional credentials required.
       </div>
    );
  }

  return (
    <ServerDashboardShell>
      <main className="p-8 md:p-12">
        <BookingsManager />
      </main>
    </ServerDashboardShell>
  );
}
