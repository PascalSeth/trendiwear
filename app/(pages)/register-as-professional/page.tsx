import { getProfessionalProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import RegisterProfessionalClient from "./RegisterProfessionalClient";

export const metadata: Metadata = {
  title: "Register as a Professional | Join TrendiZip",
  description: "Join TrendiZip's elite collective of African fashion designers and tailors. Launch your digital storefront, showcase your portfolio, and manage your business on Ghana's premier fashion marketplace.",
  keywords: ["register tailor Ghana", "join TrendiZip", "sell fashion online Ghana", "fashion designer platform", "tailor platform Accra", "African fashion collective"],
  openGraph: {
    title: "Register as a Professional | Join TrendiZip",
    description: "Launch your digital storefront and manage your fashion business on Ghana's premier fashion marketplace.",
    url: "https://trendizip.com/register-as-professional",
    type: "website",
  },
  alternates: {
    canonical: "https://trendizip.com/register-as-professional",
  },
};

export default async function RegisterProfessionalPage() {
  const profile = await getProfessionalProfile();

  if (profile && profile.slug) {
    redirect(`/tz/${profile.slug}`);
  }

  return <RegisterProfessionalClient />;
}
