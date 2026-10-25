'use client'

import { useState } from 'react'
import { METHODS, type ItemAction } from '@/lib/items'

const cls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-green-500'

const toText = (h?: Record<string, string>) => Object.entries(h ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n')
const toHeaders = (t: string) => {
  const h: Record<string, string> = {}
  for (const line of t.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0 && line.slice(0, i).trim()) h[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return h
}

export default function ActionEditor({ action, onChange }: { action?: ItemAction; onChange: (a?: ItemAction) => void }) {
  const [open, setOpen] = useState(!!action)
  const [headersText, setHeadersText] = useState(toText(action?.headers))

  if (!open)
    return (
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(true); onChange(action ?? { method: 'GET', url: '' }) }} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
        ⚡ Add API call
      </button>
    )

  const a: ItemAction = action ?? { method: 'GET', url: '' }
  const set = (p: Partial<ItemAction>) => onChange({ ...a, ...p })
  return (
    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
        <span>⚡ API call</span>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); setHeadersText(''); onChange(undefined) }} className="text-gray-400 hover:text-red-500">Remove</button>
      </div>
      <div className="flex gap-2">
        <select className={cls + ' !w-24'} value={a.method} onChange={e => set({ method: e.target.value as ItemAction['method'] })}>
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input className={cls} placeholder="https://api.example.com/endpoint" value={a.url} onChange={e => set({ url: e.target.value })} />
      </div>
      <textarea className={cls + ' font-mono'} rows={2} placeholder={'Headers (one per line)\nAuthorization: Bearer ...'} value={headersText} onChange={e => { setHeadersText(e.target.value); set({ headers: toHeaders(e.target.value) }) }} />
      {a.method !== 'GET' && <textarea className={cls + ' font-mono'} rows={3} placeholder='Body (JSON), e.g. {"key": "value"}' value={a.body ?? ''} onChange={e => set({ body: e.target.value })} />}
      <p className="text-[11px] text-gray-500">Headers and body are only visible to you. Others can run the call, not read it.</p>
    </div>
  )
}
