import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function GET(){
    noStore()
    const session = await getServerSession(authOptions);

    if(!session || !session.user?.email){
        throw new Error("Something went Wrong.... Sorry")
    }

    let dbUser=await prisma.user.findUnique({
        where:{
            email: session.user.email,
        }
    });

    if (!dbUser){
        dbUser=await prisma.user.create({
            data :{
                email: session.user.email,
                firstName: session.user.name?.split(' ')[0] ?? '',
                lastName: session.user.name?.split(' ').slice(1).join(' ') ?? '',
                profileImage: session.user.image ?? null,
            }
        })
    }
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`)
}