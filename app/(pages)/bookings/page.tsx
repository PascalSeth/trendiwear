import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { BookingsClient } from "./BookingsClient";
import ServerNavbar from "@/app/components/ServerNavbar";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "My Bookings | TrendiZip",
  description: "View and manage your professional service bookings.",
};

export default async function BookingsPage() {
  await requireAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9]">
      <ServerNavbar />
      <main className="flex-grow pt-32 pb-20">
        <BookingsClient />
      </main>
      <Footer />
    </div>
  );
}
