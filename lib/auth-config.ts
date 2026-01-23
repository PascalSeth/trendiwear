import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: parseInt(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
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
            return true
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      if (account?.provider === 'credentials') {
        console.log('Credentials signin attempt')
        // For credentials, validate user exists
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        if (!dbUser) {
          console.log('User not found in database for credentials login')
          return false
        }
        console.log('User found for credentials login')
        return true
      }
      return true
    },
    async session({ session, user }) {
      console.log('Session callback:', { session, user })
      // Send properties to the client, like the user id from database
      if (session.user && user.id) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback:', { token, user, account })
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