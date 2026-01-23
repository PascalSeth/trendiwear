import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

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

export async function POST(request: Request) {
    try {
        const { email, password, name, phone } = await request.json()

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: 'Email, password, and name are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' '),
                phone: phone || null,
                emailVerified: new Date(), // Since they registered with email/password, consider email verified
            }
        })

        return NextResponse.json(
            { message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name } },
            { status: 201 }
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}