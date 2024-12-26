import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/db";

export async function GET(){
    noStore()
    const {getUser}=getKindeServerSession();
    const user= await getUser();

    if(!user || user=== null || !user.id){
        throw new Error("Something went Wrong.... Sorry")
    }

    let dbUser=await prisma.user.findUnique({
        where:{
            id:user.id,
        }
    });

    if (!dbUser){
        dbUser=await prisma.user.create({
            data :{
                email:user.email ?? '',
                name: user.given_name ?? '',
                id:user.id,
                profileImage:user.picture ?? `https://avatar.vercel.sh/${user.given_name}`
            }
        })
    }
    return NextResponse.redirect("https://trendiwear.netlify.app/") 
}