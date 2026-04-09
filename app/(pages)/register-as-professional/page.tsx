import { getProfessionalProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterProfessionalClient from "./RegisterProfessionalClient";

export default async function RegisterProfessionalPage() {
  const profile = await getProfessionalProfile();

  if (profile && profile.slug) {
    redirect(`/tz/${profile.slug}`);
  }

  return <RegisterProfessionalClient />;
}
