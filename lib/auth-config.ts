import { NextAuthOptions } from "next-auth"
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      firstName?: string
      lastName?: string
      role: Role
    }
  }
  interface JWT {
    id: string
    role: Role
    firstName?: string
    lastName?: string
  }
  interface User {
    id: string
    role: Role
    firstName?: string
    lastName?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name || profile.name.split(' ')[0] || '',
          lastName: profile.family_name || profile.name.split(' ').slice(1).join(' ') || '',
          role: 'CUSTOMER' as Role,
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[auth:signIn] Attempting sign in', { 
        provider: account?.provider, 
        userEmail: user.email,
        hasAccount: !!account,
        hasProfile: !!profile
      })
      // ... (rest of the logic preserved)
      // SECURITY: Ensure the email from the provider matches the user we are signing in as
      // This prevents silent account linking/swapping if there's a mismatch.
      if (account?.provider === 'google' && profile?.email && user.email) {
        if (profile.email.toLowerCase() !== user.email.toLowerCase()) {
          console.error('[auth:signIn] SECURITY ALERT: Email mismatch during Google Sign-In', {
            profileEmail: profile.email,
            userEmail: user.email,
            providerAccountId: account.providerAccountId
          })
          // Throwing an error will redirect to the error page with this error as a query param
          throw new Error('EmailMismatch')
        }
      }

      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          })
          if (existingUser) {
            // Check if Google account is already linked
            const googleAccount = existingUser.accounts.find(acc => acc.provider === 'google')
            if (!googleAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  scope: account.scope,
                  token_type: account.token_type,
                  id_token: account.id_token,
                }
              })
            }
            return true
          }
          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      console.log('[auth:session] Creating session from token', {
        userId: token.id,
        role: token.role,
        email: session.user?.email
      })
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }
      return session
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        console.log('[auth:jwt] Initial token creation/update', {
          userId: user.id,
          role: user.role,
          trigger
        })
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName

        // Ensure we have the correct role from the database if it's an OAuth sign-in
        // or if the role returned by the provider is the default 'CUSTOMER'
        if (token.id && token.role === 'CUSTOMER') {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true }
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        }
      }
      
      // OPTIMIZATION: If role is still missing (e.g. old session), fetch it
      if (!token.role && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, firstName: true, lastName: true }
        })
        if (dbUser) {
          token.role = dbUser.role
          token.firstName = dbUser.firstName
          token.lastName = dbUser.lastName
        }
      }

      // Allow updating role in token if trigger is update
      if (trigger === "update" && session?.role) {
        token.role = session.role
      }

      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
}