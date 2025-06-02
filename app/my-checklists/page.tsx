'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function MyChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)
      if (userData.user) {
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .eq('author_id', userData.user.id)
          .order('created_at', { ascending: false })
        if (!error) setChecklists(data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const togglePublished = async (id: string, published: boolean) => {
    await supabase.from('checklists').update({ published: !published }).eq('id', id)
    setChecklists(checklists.map(c => c.id === id ? { ...c, published: !published } : c))
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">You need to sign in.</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My checklists</h1>
      {checklists.length === 0 && <div>No checklist yet.</div>}
      <ul className="space-y-4">
        {checklists.map(list => (
          <li key={list.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <Link href={`/checklist/${list.id}`}>
                <div className="font-semibold hover:underline cursor-pointer">{list.title}</div>
              </Link>
              <div className="text-gray-500 text-sm">{list.description}</div>
              <div className="text-xs text-gray-400">{new Date(list.created_at).toLocaleString()}</div>
            </div>
            <button
              onClick={() => togglePublished(list.id, list.published)}
              className={`ml-4 px-3 py-1 rounded ${list.published ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
            >
              {list.published ? 'Yayında' : 'Gizli'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 