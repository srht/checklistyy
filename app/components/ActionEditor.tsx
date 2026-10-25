'use client'

import { useState } from 'react'
import { METHODS, type ActionInput, type ItemAction } from '@/lib/items'

const cls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-green-500'

const toText = (h: Record<string, string> | undefined, sep: string) => Object.entries(h ?? {}).map(([k, v]) => `${k}${sep}${v}`).join('\n')
const toMap = (t: string, sep: string) => {
  const h: Record<string, string> = {}
  for (const line of t.split('\n')) {
    const i = line.indexOf(sep)
    if (i > 0 && line.slice(0, i).trim()) h[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return h
}

export default function ActionEditor({ action, onChange }: { action?: ItemAction; onChange: (a?: ItemAction) => void }) {
  const [open, setOpen] = useState(!!action)
  const [headersText, setHeadersText] = useState(toText(action?.headers, ': '))
  const [queryText, setQueryText] = useState(toText(action?.query, '='))
  const [fieldsText, setFieldsText] = useState(toText(action?.fields, '='))

  if (!open)
    return (
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(true); onChange(action ?? { method: 'GET', url: '' }) }} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
        ⚡ Add API call
      </button>
    )

  const a: ItemAction = action ?? { method: 'GET', url: '' }
  const set = (p: Partial<ItemAction>) => onChange({ ...a, ...p })
  const inputs = a.inputs ?? []
  const hasFile = inputs.some(i => i.type === 'file')
  const bodyType = hasFile ? 'multipart' : a.bodyType ?? 'json'
  const setInput = (idx: number, p: Partial<ActionInput>) => set({ inputs: inputs.map((x, i) => (i === idx ? { ...x, ...p } : x)) })

  return (
    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
        <span>⚡ API call</span>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); setHeadersText(''); setQueryText(''); setFieldsText(''); onChange(undefined) }} className="text-gray-400 hover:text-red-500">Remove</button>
      </div>
      <div className="flex gap-2">
        <select className={cls + ' !w-24'} value={a.method} onChange={e => set({ method: e.target.value as ItemAction['method'] })}>
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input className={cls} placeholder="https://api.example.com/endpoint" value={a.url} onChange={e => set({ url: e.target.value })} />
      </div>
      <textarea className={cls + ' font-mono'} rows={2} placeholder={'Headers (one per line)\nAuthorization: Bearer ...'} value={headersText} onChange={e => { setHeadersText(e.target.value); set({ headers: toMap(e.target.value, ':') }) }} />
      <textarea className={cls + ' font-mono'} rows={2} placeholder={'Query params (one per line)\nkey=value'} value={queryText} onChange={e => { setQueryText(e.target.value); set({ query: toMap(e.target.value, '=') }) }} />

      {a.method !== 'GET' && (
        <>
          <select className={cls} value={bodyType} disabled={hasFile} onChange={e => set({ bodyType: e.target.value as ItemAction['bodyType'] })}>
            <option value="json">Body: JSON</option>
            <option value="form">Body: form (urlencoded)</option>
            <option value="multipart">Body: multipart (file upload)</option>
          </select>
          {bodyType === 'json' ? (
            <textarea className={cls + ' font-mono'} rows={3} placeholder='Body (JSON), e.g. {"key": "value"}' value={a.body ?? ''} onChange={e => set({ body: e.target.value })} />
          ) : (
            <textarea className={cls + ' font-mono'} rows={2} placeholder={'Fixed form fields (one per line)\nkey=value'} value={fieldsText} onChange={e => { setFieldsText(e.target.value); set({ fields: toMap(e.target.value, '=') }) }} />
          )}
        </>
      )}

      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-blue-800">Inputs asked from the person who runs it (parameters / files)</div>
        {inputs.map((inp, idx) => (
          <div key={idx} className="flex gap-1.5">
            <input className={cls} placeholder="name" value={inp.name} onChange={e => setInput(idx, { name: e.target.value })} />
            <select className={cls + ' !w-20'} value={inp.type} onChange={e => setInput(idx, { type: e.target.value as ActionInput['type'], ...(e.target.value === 'file' && { target: 'body' }) })}>
              <option value="text">text</option>
              {a.method !== 'GET' && <option value="file">file</option>}
            </select>
            {inp.type === 'text' && a.method !== 'GET' && (
              <select className={cls + ' !w-20'} value={inp.target} onChange={e => setInput(idx, { target: e.target.value as ActionInput['target'] })}>
                <option value="body">body</option>
                <option value="query">query</option>
              </select>
            )}
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => set({ inputs: inputs.filter((_, i) => i !== idx) })} className="px-1 text-gray-400 hover:text-red-500">✕</button>
          </div>
        ))}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => set({ inputs: [...inputs, { name: '', type: 'text', target: a.method === 'GET' ? 'query' : 'body' }] })} className="text-xs font-medium text-blue-700 hover:underline">
          + Add input
        </button>
      </div>
      <p className="text-[11px] text-gray-500">Headers, query, body and fixed fields are only visible to you. Others can only fill the inputs and run the call.</p>
    </div>
  )
}
