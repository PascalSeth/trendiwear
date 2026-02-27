import { NextAuthOptions } from "next-auth"
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      firstName?: string
      lastName?: string
    }
  }
  interface JWT {
    id: string
    firstName?: string
    lastName?: string
  }
  interface User {
    firstName?: string
    lastName?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Use JWT strategy to ensure JWT callback is called
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback:', { user, account, profile, email, credentials })
      // Allow linking OAuth accounts to existing users
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          })
          console.log('Existing user:', existingUser)
          if (existingUser) {
            console.log('Existing user emailVerified:', existingUser.emailVerified)
            // Check if Google account is already linked
            const googleAccount = existingUser.accounts.find(acc => acc.provider === 'google')
            if (googleAccount) {
              console.log('Google account already linked')
              return true
            } else {
              console.log('Linking Google account to existing user')
              // Update emailVerified if not set, since Google verified the email
              if (!existingUser.emailVerified) {
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { emailVerified: new Date() }
                })
                console.log('Updated emailVerified for existing user')
              }
              // Manually create the account to link it
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
              console.log('Manually created Google account for existing user')
              return true
            }
          } else {
            console.log('New user, creating account')
            // Add firstName and lastName to the user object for database creation
            const googleProfile = profile as GoogleProfile
            if (googleProfile?.given_name && googleProfile?.family_name) {
              user.firstName = googleProfile.given_name
              user.lastName = googleProfile.family_name
            } else {
              // Fallback: split the name if given_name/family_name are not available
              const nameParts = user.name?.split(' ') || []
              user.firstName = nameParts[0] || ''
              user.lastName = nameParts.slice(1).join(' ') || ''
            }
            return true
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      // Credentials provider handles its own validation
      return true
    },
    async session({ session, token }) {
      // console.log('Session callback:', { session, token })
      // Send properties to the client, like the user id from database
      if (session.user && token && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, user,  }) {
      // console.log('JWT callback:', { token, user, account })
      if (user) {
        token.id = user.id
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