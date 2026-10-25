'use client'

import Link from 'next/link'
import TypewriterInput from './components/TypewriterInput'
import { useEffect, useState } from 'react'

export default function Home() {
  const [recentChecklists, setRecentChecklists] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentChecklists = async () => {
      setLoadingRecent(true);
      const res = await fetch('/api/checklists?limit=5');
      if (res.ok) setRecentChecklists(await res.json());
      setLoadingRecent(false);
    };
    fetchRecentChecklists();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Checklisty
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create, manage, and share your checklists with the world
          </p>

          <TypewriterInput />

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors w-full md:w-auto text-center"
            >
              Create New Checklist
            </Link>
            <Link
              href="/browse"
              className="bg-slate-100 text-primary border-2 border-primary px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors w-full md:w-auto text-center"
            >
              Browse Checklists
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-100 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Create</h3>
            <p className="text-gray-600">
              Create beautiful, organized checklists for any purpose
            </p>
          </div>
          <div className="bg-slate-100 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Share</h3>
            <p className="text-gray-600">
              Share your checklists with friends, family, or the world
            </p>
          </div>
          <div className="bg-slate-100 p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Collaborate</h3>
            <p className="text-gray-600">
              Work together with others on shared checklists
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Recent Public Checklists</h2>
          {loadingRecent ? (
            <div className="text-center">Loading recent checklists...</div>
          ) : recentChecklists.length === 0 ? (
            <div className="text-center text-gray-600">No public checklists found yet.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentChecklists.map(list => (
                <li key={list.id} className="bg-slate-100 p-6 rounded-xl shadow-sm border border-slate-300">
                  <Link href={`/checklist/${list.id}`}>
                    <h3 className="text-xl font-semibold mb-2 text-lime-300 hover:underline cursor-pointer">{list.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{list.description || 'No description.'}</p>
                  {list.items && list.items.length > 0 && (
                    <p className="text-gray-800 text-sm mt-2">{list.items[0]}</p>
                  )}
                  <p className="text-xs text-gray-400">Created: {new Date(list.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 