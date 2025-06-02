'use client'

import { FaGoogle } from 'react-icons/fa'
import { supabase } from '@/lib/supabaseClient'

export default function SignIn() {
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL || (typeof window !== 'undefined' ? window.location.origin : undefined),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Checklisty</h2>
          <p className="mt-2 text-gray-600">Sign in to create and manage your checklists</p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-blue-600 transition-colors"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
} 