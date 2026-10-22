'use client'

import { FaGoogle } from 'react-icons/fa'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_AUTH
const isDev = process.env.NODE_ENV !== 'production'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const handleSignIn = () => signIn('google', { callbackUrl: '/' })
  const handleDevSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    signIn('credentials', { email, callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Checklisty</h2>
          <p className="mt-2 text-gray-600">Sign in to create and manage your checklists</p>
        </div>

        <div className="mt-8 space-y-4">
          {isDev && (
            <form onSubmit={handleDevSignIn} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Local dev email"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button type="submit" className="px-4 py-2 rounded-lg text-white bg-primary">Sign in</button>
            </form>
          )}
          {hasGoogle && <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-blue-600 transition-colors"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>}
        </div>
      </div>
    </div>
  )
} 