'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import PremiumBadge from '@/app/components/PremiumBadge'

export default function MyChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const user = session?.user

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { setLoading(false); return }
    fetch('/api/checklists?mine=1')
      .then(r => (r.ok ? r.json() : []))
      .then(setChecklists)
      .finally(() => setLoading(false))
  }, [status, user])

  const togglePublished = async (id: string, published: boolean) => {
    await fetch(`/api/checklists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !published }) })
    setChecklists(checklists.map(c => c.id === id ? { ...c, published: !published } : c))
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">You need to sign in.</div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My checklists</h1>
          <p className="mt-1 text-sm text-gray-500">{checklists.length} checklists</p>
        </div>
        <Link href="/create" className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-green-700">
          + New
        </Link>
      </div>
      {checklists.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          No checklist yet.
        </div>
      )}
      <ul className="space-y-3">
        {checklists.map(list => (
          <li key={list.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-green-400 hover:shadow-md">
            <Link href={`/checklist/${list.id}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-semibold">{list.title}{list.author_premium && <PremiumBadge />}</div>
              {list.description && <div className="mt-1 line-clamp-2 text-sm text-gray-500">{list.description}</div>}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                {Array.isArray(list.items) && <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">{list.items.length} items</span>}
                <span>{new Date(list.created_at).toLocaleString()}</span>
              </div>
            </Link>
            <button
              onClick={() => togglePublished(list.id, list.published)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${list.published ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {list.published ? 'Published' : 'Private'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
