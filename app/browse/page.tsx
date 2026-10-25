import Link from 'next/link'
import { checklists as store } from '@/lib/db'
import PremiumBadge from '@/app/components/PremiumBadge'

export const dynamic = 'force-dynamic'

export default async function BrowseChecklistsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q || '').trim()
  const needle = q.toLocaleLowerCase()
  const all = store.listPublished()
  const checklists = needle
    ? all.filter(l =>
        [l.title, l.description, ...(Array.isArray(l.items) ? l.items : [])]
          .some(s => typeof s === 'string' && s.toLocaleLowerCase().includes(needle)))
    : all

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All published checklists</h1>
        <p className="mt-1 text-sm text-gray-500">{checklists.length} public checklists{q && ` matching "${q}"`}</p>
        <form action="/browse" className="mt-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search checklists..."
            className="w-full rounded-full border-2 border-gray-200 px-5 py-3 focus:border-primary focus:outline-none"
          />
        </form>
      </div>
      {checklists.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          No published checklist yet.
        </div>
      )}
      <ul className="space-y-3">
        {checklists.map(list => (
          <li key={list.id}>
            <Link
              href={`/checklist/${list.id}`}
              className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-green-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold">{list.title}</div>
                  {list.description && <div className="mt-1 line-clamp-2 text-sm text-gray-500">{list.description}</div>}
                </div>
                {Array.isArray(list.items) && (
                  <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {list.items.length} items
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400"><span className="inline-flex items-center gap-1.5">{list.author_name || 'Anonymous'}{list.author_premium && <PremiumBadge />}</span> · {new Date(list.created_at).toLocaleDateString()}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
