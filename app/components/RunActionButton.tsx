'use client'

import { useState } from 'react'
import type { ItemAction } from '@/lib/items'

type Result = { ok: boolean; text?: string; download?: { href: string; name: string; label: string } }

export default function RunActionButton({ checklistId, index, action, signedIn, onSuccess }: { checklistId: string; index: number; action: ItemAction; signedIn: boolean; onSuccess?: () => void }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [values, setValues] = useState<Record<string, string | File>>({})
  const inputs = action.inputs ?? []

  const run = async () => {
    setRunning(true)
    setResult(null)
    const fd = new FormData()
    for (const [k, v] of Object.entries(values)) if (v !== '') fd.append(k, v)
    const res = await fetch(`/api/checklists/${checklistId}/items/${index}/run`, { method: 'POST', body: fd })
    const d = await res.json().catch(() => ({}))
    setRunning(false)
    if (!res.ok) return setResult({ ok: false, text: d.error || res.statusText })
    if (d.binary) {
      const ext = (d.contentType.split(';')[0].split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '')
      setResult({
        ok: d.ok,
        text: `${d.status} · ${d.contentType} · ${(d.size / 1024).toFixed(1)} KB${d.truncated ? ' (too large to download)' : ''}`,
        download: d.data ? { href: `data:${d.contentType};base64,${d.data}`, name: `response.${ext}`, label: 'Download response' } : undefined,
      })
    } else setResult({ ok: d.ok, text: `${d.status}\n${d.body}` })
    if (d.ok) onSuccess?.()
  }

  const host = (() => { try { return new URL(action.url).hostname } catch { return action.url } })()
  const small = 'rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs'

  return (
    <div className="mt-2" onClick={e => e.stopPropagation()}>
      {inputs.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {inputs.map(i => (
            <label key={i.name} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-24 shrink-0 truncate font-medium" title={i.name}>{i.name}</span>
              {i.type === 'file' ? (
                <input type="file" className="min-w-0 flex-1 text-xs" onChange={e => setValues(v => ({ ...v, [i.name]: e.target.files?.[0] ?? '' }))} />
              ) : (
                <input className={small + ' min-w-0 flex-1'} value={(values[i.name] as string) ?? ''} onChange={e => setValues(v => ({ ...v, [i.name]: e.target.value }))} />
              )}
            </label>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={run}
        onMouseDown={e => e.preventDefault()}
        disabled={running || !signedIn}
        title={signedIn ? '' : 'Sign in to run'}
        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? 'Running...' : `⚡ Run (${action.method} ${host})`}
      </button>
      {result && (
        <div className={`mt-2 rounded-lg p-2 text-[11px] ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all">{result.text}</pre>
          {result.download && <a href={result.download.href} download={result.download.name} className="mt-1 inline-block font-medium underline">{result.download.label}</a>}
        </div>
      )}
    </div>
  )
}
