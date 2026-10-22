import Link from 'next/link'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BrowseChecklistsPage() {
  const { rows: checklists } = await pool.query(
    'select * from checklists where published = true order by created_at desc'
  )

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All published checklists</h1>
      {!checklists || checklists.length === 0 && <div>No published checklist yet.</div>}
      <ul className="space-y-4">
        {checklists && checklists.map(list => (
          <li key={list.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <Link href={`/checklist/${list.id}`}>
                <div className="font-semibold text-lg hover:underline cursor-pointer">{list.title}</div>
              </Link>
              <div className="text-gray-500 text-sm mb-1">{list.description}</div>
              <div className="text-xs text-gray-400">{new Date(list.created_at).toLocaleDateString()}</div>
            </div>
            {/* İstersen yazar bilgisini de gösterebilirsin */}
          </li>
        ))}
      </ul>
    </div>
  )
} 