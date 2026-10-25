'use client'

import { useState } from 'react'
import type { ItemAction } from '@/lib/items'

export default function RunActionButton({ checklistId, index, action, signedIn, onSuccess }: { checklistId: string; index: number; action: ItemAction; signedIn: boolean; onSuccess?: () => void }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async () => {
    setRunning(true)
    setResult(null)
    const res = await fetch(`/api/checklists/${checklistId}/items/${index}/run`, { method: 'POST' })
    const d = await res.json().catch(() => ({}))
    setRunning(false)
    if (!res.ok) return setResult({ ok: false, text: d.error || res.statusText })
    setResult({ ok: d.ok, text: `${d.status}\n${d.body}` })
    if (d.ok) onSuccess?.()
  }

  return (
    <div className="mt-2" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={run}
        onMouseDown={e => e.preventDefault()}
        disabled={running || !signedIn}
        title={signedIn ? '' : 'Sign in to run'}
        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? 'Running...' : `⚡ Run (${action.method} ${(() => { try { return new URL(action.url).hostname } catch { return action.url } })()})`}
      </button>
      {result && (
        <pre className={`mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg p-2 text-[11px] ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{result.text}</pre>
      )}
    </div>
  )
}
