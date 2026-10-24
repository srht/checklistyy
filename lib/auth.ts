import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { timingSafeEqual } from 'crypto'

const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

function passwordOk(input?: string) {
  const expected = process.env.SIGNIN_PASSWORD
  if (!expected) return process.env.NODE_ENV !== 'production'
  const a = Buffer.from(input ?? '')
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

providers.push(
  CredentialsProvider({
    name: 'Email',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase()
      if (!email || !passwordOk(credentials?.password)) return null
      return { id: email, email, name: email.split('@')[0] }
    },
  })
)

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
