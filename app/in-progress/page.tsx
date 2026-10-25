'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function InProgressPage() {
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const user = session?.user

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { setLoading(false); return }
    fetch('/api/progress')
      .then(r => (r.ok ? r.json() : []))
      .then(setLists)
      .finally(() => setLoading(false))
  }, [status, user])

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">You need to sign in.</div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">In progress</h1>
        <p className="mt-1 text-sm text-gray-500">{lists.length} checklists</p>
      </div>
      {lists.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          Check an item in any checklist and it will show up here.
        </div>
      )}
      <ul className="space-y-3">
        {lists.map(l => {
          const pct = l.total ? Math.round((l.done / l.total) * 100) : 0
          return (
            <li key={l.id}>
              <Link href={`/checklist/${l.id}`} className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-green-400 hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{l.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pct === 100 ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>
                    {pct === 100 ? 'Completed' : `${l.done} / ${l.total}`}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-green-200/70">
                  <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 text-xs text-gray-400">{new Date(l.updated_at).toLocaleString()}</div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
