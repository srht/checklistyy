'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import PremiumBadge from '@/app/components/PremiumBadge'

export default function PremiumPage() {
  const { data: session, status } = useSession()
  const [isPremium, setIsPremium] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status !== 'authenticated') return
    const sid = new URLSearchParams(window.location.search).get('session_id')
    const load = () => fetch('/api/premium/status').then(r => r.json()).then(d => setIsPremium(d.premium))
    if (sid) {
      fetch('/api/premium/checkout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid }) })
        .then(r => { if (!r.ok) setError('Payment could not be verified.') })
        .finally(load)
    } else load()
  }, [status])

  const buy = async () => {
    setBusy(true)
    setError('')
    const res = await fetch('/api/premium/checkout', { method: 'POST' })
    const d = await res.json()
    if (d.url) window.location.href = d.url
    else { setError(d.error || 'Something went wrong'); setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold">Verified Premium <PremiumBadge /></h1>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>Premium badge on your profile</li>
          <li>Premium badge on every checklist you create</li>
          <li>One-time payment, no subscription</li>
        </ul>
        <div className="mt-6">
          {status === 'loading' ? null : !session?.user ? (
            <Link href="/auth/signin" className="block rounded-xl bg-green-600 py-3 text-center font-semibold text-white">Sign in to continue</Link>
          ) : isPremium ? (
            <div className="rounded-xl bg-green-50 py-3 text-center text-sm font-medium text-green-700">You are a Verified Premium member.</div>
          ) : (
            <button onClick={buy} disabled={busy} className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-amber-950 shadow transition hover:bg-amber-400 disabled:opacity-50">
              {busy ? 'Redirecting...' : 'Get Premium'}
            </button>
          )}
          {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
