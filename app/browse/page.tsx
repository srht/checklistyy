import Link from 'next/link'
import { checklists as store } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BrowseChecklistsPage() {
  const checklists = store.listPublished()

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">All published checklists</h1>
        <p className="mt-1 text-sm text-gray-500">{checklists.length} public checklists</p>
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
              className="block rounded-2xl border border-slate-300 bg-slate-100 p-5 shadow-sm transition hover:border-green-400 hover:shadow-md"
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
              <div className="mt-3 text-xs text-gray-400">{new Date(list.created_at).toLocaleDateString()}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
