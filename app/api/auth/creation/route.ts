import prisma from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    if (!process.env.NEXT_RUNTIME) {
        return new Response("This API route is not accessible during static generation.", {
            status: 403,
        });
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
        throw new Error("User not found");
    }

    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email ?? "",
                name: user.given_name ?? "",
                profileImage: user?.picture ?? `https://avatar.vercel.sh/${user.given_name}`,
            },
        });
    }

    return NextResponse.redirect("https://trendiwear.netlify.app/");
}
