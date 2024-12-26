"use server";

import prisma from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function getUserRole() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.email) {
    return { role: null, error: "Unauthorized" };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (!dbUser) {
      return { role: null, error: "User not found" };
    }

    return { role: dbUser.role, error: null };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { role: null, error: "Internal Server Error" };
  }
}
