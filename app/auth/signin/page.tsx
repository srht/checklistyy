'use client'

import { FaGoogle } from 'react-icons/fa'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_AUTH

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const handleSignIn = () => signIn('google', { callbackUrl: '/' })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup') {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!r.ok) return setError((await r.json().catch(() => ({}))).error || 'Sign up failed')
    }
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) window.location.href = '/'
    else setError('Invalid email or password')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200">
      <div className="max-w-md w-full space-y-8 p-8 bg-slate-100 rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Checklisty</h2>
          <p className="mt-2 text-gray-600">Sign in to create and manage your checklists</p>
        </div>

        <div className="mt-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full border rounded-lg px-3 py-2"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border rounded-lg px-3 py-2"
            />
            <input
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
              className="w-full border rounded-lg px-3 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 rounded-lg text-white bg-primary">{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
            <button
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
              className="w-full text-sm text-gray-600 hover:underline"
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </form>
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