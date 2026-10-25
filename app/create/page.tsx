'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { fetchChecklistSuggestions } from '@/lib/ai'
import RichItem, { stripMarkdown } from '@/app/components/RichItem'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20'

export default function CreateChecklistPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const { data: session } = useSession()

  const notify = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  // Prefill from localStorage if navigated from homepage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('generatedChecklist')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.title) setTitle(parsed.title)
          if (parsed.items) setItems(parsed.items)
        } catch {}
        localStorage.removeItem('generatedChecklist')
      }
    }
  }, [])

  const handleFetchAISuggestions = async () => {
    setAiLoading(true)
    setMessage('')
    setSuggestions([])
    const generated = await fetchChecklistSuggestions(title || description)
    setSuggestions(generated)
    if (!generated.length) notify('AI suggestions not found.', true)
    setAiLoading(false)
  }

  const addSuggestion = (s: string) => {
    setItems(prev => [...prev, s])
    setSuggestions(prev => prev.filter(x => x !== s))
  }
  const addAllSuggestions = () => {
    setItems(prev => [...prev, ...suggestions])
    setSuggestions([])
  }

  const handleItemChange = (index: number, value: string) =>
    setItems(items.map((item, i) => (i === index ? value : item)))
  const addItem = () => setItems([...items, ''])
  const [struck, setStruck] = useState<Set<number>>(new Set())
  const removeItem = (index: number) =>
    setStruck(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    if (!session?.user) {
      notify('You need to sign in!', true)
      setLoading(false)
      return
    }
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, items: items.filter((_, i) => !struck.has(i)), published }),
    })
    setLoading(false)
    if (!res.ok) notify('Error: ' + ((await res.json().catch(() => ({}))).error || res.statusText), true)
    else notify('Checklist created!')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create new checklist</h1>
        <p className="mt-1 text-sm text-gray-500">Name it, let AI suggest items, then fine-tune your list.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-3 rounded-2xl border border-slate-300 bg-slate-200/60 p-5">
          <input className={inputCls} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea
            className={inputCls + ' min-h-[90px] resize-y'}
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </section>

        <section className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-green-900">✨ AI suggestions</h2>
              <p className="text-xs text-green-700/80">Click a suggestion to add it to your list.</p>
            </div>
            <button
              type="button"
              onClick={handleFetchAISuggestions}
              disabled={aiLoading || !title}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? 'Thinking...' : suggestions.length ? 'Regenerate' : 'Get suggestions'}
            </button>
          </div>

          {aiLoading && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[40, 56, 32, 48, 36].map((w, i) => (
                <div key={i} className="h-8 animate-pulse rounded-full bg-green-200/70" style={{ width: `${w * 3}px` }} />
              ))}
            </div>
          )}

          {!aiLoading && suggestions.length > 0 && (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="group flex items-center gap-1.5 rounded-full border border-green-300 bg-slate-100 px-3 py-1.5 text-left text-sm text-green-900 shadow-sm transition hover:border-green-500 hover:bg-green-100"
                  >
                    <span className="font-bold text-green-600 group-hover:scale-110">+</span>
                    {stripMarkdown(s)}
                  </button>
                ))}
              </div>
              <button type="button" onClick={addAllSuggestions} className="mt-3 text-sm font-medium text-green-700 hover:underline">
                Add all ({suggestions.length})
              </button>
            </>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Checklist items</h2>
            <span className="text-xs text-gray-500">{items.length} items</span>
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
              No items yet. Add from AI suggestions or create your own.
            </div>
          )}

          {items.map((item, i) => (
            <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                {i + 1}
              </span>
              <textarea
                rows={1}
                className={inputCls + ' flex-1 resize-none overflow-hidden leading-relaxed' + (struck.has(i) ? ' line-through text-gray-400 bg-slate-200' : '')}
                readOnly={struck.has(i)}
                value={item}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }
                }}
                onChange={e => handleItemChange(i, e.target.value)}
                required={!struck.has(i)}
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label={struck.has(i) ? 'Restore item' : 'Delete item'}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              >
                {struck.has(i) ? '↺' : '✕'}
              </button>
            </div>
            {!struck.has(i) && /https?:\/\//.test(item) && (
              <div className="ml-9 rounded-xl bg-slate-200 p-3">
                <RichItem text={item} />
              </div>
            )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition hover:border-green-500 hover:text-green-600"
          >
            + Add item
          </button>
        </section>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 shadow-sm">
          <span className="text-sm">Let everyone see it?</span>
          <input type="checkbox" className="h-5 w-5 accent-green-600" checked={published} onChange={e => setPublished(e.target.checked)} />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-black shadow transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Create'}
        </button>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-center text-sm ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
