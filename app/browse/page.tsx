'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function BrowseChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChecklists = async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
      setChecklists(data || [])
      setLoading(false)
    }
    fetchChecklists()
  }, [])

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All published checklists</h1>
      {checklists.length === 0 && <div>No published checklist yet.</div>}
      <ul className="space-y-4">
        {checklists.map(list => (
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