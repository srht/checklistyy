'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Key = { id: string; name: string | null; created_at: string }

export default function ApiKeysPage() {
  const { data: session, status } = useSession()
  const [keys, setKeys] = useState<Key[]>([])
  const [name, setName] = useState('')
  const [created, setCreated] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetch('/api/keys').then(r => r.json()).then(d => Array.isArray(d) && setKeys(d))

  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const create = async () => {
    setError('')
    const res = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const d = await res.json()
    if (!res.ok) return setError(d.error || 'Something went wrong')
    setCreated(d.key)
    setCopied(false)
    setName('')
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this key? Anything using it will stop working.')) return
    await fetch('/api/keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  if (status === 'loading') return null
  if (!session?.user) return <div className="mx-auto max-w-xl p-6"><Link href="/auth/signin" className="text-primary underline">Sign in to manage API keys</Link></div>

  const config = JSON.stringify({ mcpServers: { checklisty: { url: `${typeof window === 'undefined' ? '' : window.location.origin}/api/mcp`, headers: { Authorization: `Bearer ${created || 'ck_...'}` } } } }, null, 2)

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">API keys</h1>
        <p className="mt-1 text-sm text-gray-600">Use a key as <code>Authorization: Bearer ck_...</code> or with the Checklisty MCP server.</p>
      </div>

      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Key name (optional)" className="flex-1 rounded-lg border px-3 py-2" />
        <button onClick={create} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-blue-600">Create key</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {created && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Copy your key now. It will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white p-2 text-xs">{created}</code>
            <button onClick={() => copy(created)} className="rounded-lg border bg-white px-3 py-2 text-sm">{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
      )}

      <ul className="divide-y rounded-xl border">
        {keys.length === 0 && <li className="p-4 text-sm text-gray-500">No keys yet.</li>}
        {keys.map(k => (
          <li key={k.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-medium">{k.name || 'Unnamed key'}</div>
              <div className="text-gray-500">Created {new Date(k.created_at).toLocaleString()}</div>
            </div>
            <button onClick={() => remove(k.id)} className="text-red-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>

      <div>
        <h2 className="mb-2 font-semibold">MCP config</h2>
        <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">{config}</pre>
      </div>
    </div>
  )
}
