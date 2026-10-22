import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      name: 'Local dev (email only)',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        return email ? { id: email, email, name: email.split('@')[0] } : null
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub as string
      return session
    },
  },
}
