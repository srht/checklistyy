'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchChecklistSuggestions } from '@/lib/ai'

export default function CreateChecklistPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  // AI'dan öneri getir
  const handleFetchAISuggestions = async () => {
    setAiLoading(true)
    setMessage('')
    setItems([])
    const prompt = title || description
    const generatedItems = await fetchChecklistSuggestions(prompt)
    setItems(generatedItems)
    if (!generatedItems.length) setMessage('AI suggestions not found.')
    setAiLoading(false)
  }

  const handleItemChange = (index: number, value: string) => {
    setItems(items.map((item, i) => (i === index ? value : item)))
  }

  const addItem = () => setItems([...items, ''])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      setMessage('You need to sign in!')
      setLoading(false)
      return
    }
    const { error } = await supabase.from('checklists').insert({
      title,
      description,
      items,
      author_id: user.id,
      published,
    })
    setLoading(false)
    if (error) setMessage('Error: ' + error.message)
    else setMessage('Checklist created!')
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create new checklist</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button
          type="button"
          onClick={handleFetchAISuggestions}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={aiLoading || !title}
        >
          {aiLoading ? 'Loading...' : 'Get AI suggestions'}
        </button>
        <div>
          <label className="font-semibold">Checklist Items:</label>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 my-1">
              <input
                className="flex-1 border p-2 rounded"
                value={item}
                onChange={e => handleItemChange(i, e.target.value)}
                required
              />
              <button type="button" onClick={() => removeItem(i)} className="text-red-500">Delete</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-blue-500 mt-2">+ Add item</button>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={e => setPublished(e.target.checked)}
          />
          Let everyone see it?
        </label>
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Create'}
        </button>
        {message && <div className="mt-2 text-center">{message}</div>}
      </form>
    </div>
  )
} 