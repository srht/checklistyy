import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { users } from '@/lib/db'

const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

providers.push(
  CredentialsProvider({
    name: 'Email',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      const login = credentials?.email?.trim()
      if (!login || !credentials?.password) return null
      const u = users.verify(login.includes('@') ? login.toLowerCase() : login, credentials.password)
      return u ? { id: u.id, email: u.email, name: u.name } : null
    },
  })
)

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.email) token.sub = users.upsertOAuth(profile.email, profile.name)
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub as string
      return session
    },
  },
}
