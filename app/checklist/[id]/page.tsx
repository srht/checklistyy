'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import RichItem from '@/app/components/RichItem'
import PremiumBadge from '@/app/components/PremiumBadge'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20'

export default function ChecklistDetailPage() {
  const { id } = useParams()
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<boolean[]>([])
  const [struck, setStruck] = useState<boolean[]>([])
  const { data: session } = useSession()
  const user = session?.user
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemInput, setItemInput] = useState('')

  const notify = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  useEffect(() => {
    const fetchChecklist = async () => {
      const res = await fetch(`/api/checklists/${id}`)
      const data = res.ok ? await res.json() : null
      setChecklist(data)
      setTitleInput(data?.title || '')
      setLoading(false)
      if (data?.items) {
        setChecked(new Array(data.items.length).fill(false))
        setStruck(new Array(data.items.length).fill(false))
      }
    }
    fetchChecklist()
  }, [id])

  const handleCheck = (idx: number) => setChecked(prev => prev.map((v, i) => (i === idx ? !v : v)))
  const toggleStrike = (idx: number) => setStruck(prev => prev.map((v, i) => (i === idx ? !v : v)))

  const handleEditItem = (idx: number) => {
    setEditingItemIndex(idx)
    setItemInput(checklist.items[idx])
  }

  const handleSaveItem = () => {
    if (editingItemIndex === null || !checklist) return
    const newItems = [...checklist.items]
    newItems[editingItemIndex] = itemInput
    setChecklist({ ...checklist, items: newItems })
    setEditingItemIndex(null)
    setItemInput('')
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const items = checklist.items.filter((_: string, i: number) => !struck[i])
    const res = await fetch(`/api/checklists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, title: titleInput }),
    })
    setSaving(false)
    setEditingTitle(false)
    if (!res.ok) return notify('Hata: ' + res.statusText, true)
    notify('Saved!')
    setChecked(checked.filter((_, i) => !struck[i]))
    setStruck(new Array(items.length).fill(false))
    setChecklist({ ...checklist, items, title: titleInput })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !checklist) return
    const move = <T,>(arr: T[]) => {
      const a = Array.from(arr)
      const [removed] = a.splice(result.source.index, 1)
      a.splice(result.destination!.index, 0, removed)
      return a
    }
    setChecklist({ ...checklist, items: move(checklist.items) })
    setChecked(move(checked))
    setStruck(move(struck))
  }

  const handleCopy = async () => {
    if (!user || !checklist) return
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: checklist.title + ' (Copy)',
        description: checklist.description,
        items: checklist.items,
        published: false,
      }),
    })
    if (!res.ok) notify('Copy error: ' + res.statusText, true)
    else notify('List copied! You can see it in My checklists page.')
  }

  const handleShareWhatsApp = () => {
    if (!checklist || !checklist.published) return
    const shareUrl = `${window.location.origin}/checklist/${checklist.id}`
    const text = `Check out this checklist: ${checklist.title} - ${shareUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleDeleteChecklist = async () => {
    if (!isOwner || !checklist || !window.confirm('Do you want to delete this checklist?')) return
    setLoading(true)
    const res = await fetch(`/api/checklists/${id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) notify('Delete error: ' + res.statusText, true)
    else window.location.href = '/my-checklists'
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!checklist) return <div className="p-6">Checklist can't be found.</div>

  const isOwner = user && checklist.author_id === user.id
  const total = checklist.items?.length || 0
  const doneCount = checked.filter((c, i) => c && !struck[i]).length
  const activeTotal = total - struck.filter(Boolean).length
  const pct = activeTotal ? Math.round((doneCount / activeTotal) * 100) : 0

  const btn = 'rounded-full px-4 py-2 text-sm font-medium shadow-sm transition'

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        {isOwner && editingTitle ? (
          <input
            className={inputCls + ' text-2xl font-bold'}
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            autoFocus
          />
        ) : (
          <h1
            className={`text-3xl font-bold tracking-tight ${isOwner ? 'cursor-pointer hover:text-green-700' : ''}`}
            onClick={() => isOwner && setEditingTitle(true)}
          >
            {titleInput}
          </h1>
        )}
        {checklist.description && <p className="mt-1 text-sm text-gray-500">{checklist.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${checklist.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {checklist.published ? 'Published' : 'Private'}
          </span>
          {checklist.author_premium && <PremiumBadge />}
          {!isOwner && user && (
            <button onClick={handleCopy} type="button" className={`${btn} bg-blue-500 text-white hover:bg-blue-600`}>
              Copy
            </button>
          )}
          {checklist.published && (
            <button onClick={handleShareWhatsApp} type="button" className={`${btn} bg-green-600 text-white hover:bg-green-700`}>
              Share on WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="mb-2 flex justify-between text-xs font-medium text-green-800">
          <span>{doneCount} / {activeTotal} done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-green-200/70">
          <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist-items">
          {provided => (
            <ul className="mb-4 space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
              {checklist.items?.map((item: string, i: number) => (
                <Draggable key={i} draggableId={String(i)} index={i} isDragDisabled={!isOwner}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition ${
                        snapshot.isDragging ? 'border-green-400 shadow-lg' : 'border-gray-100'
                      } ${struck[i] ? 'bg-gray-50' : ''}`}
                    >
                      {isOwner && <span className="cursor-move select-none pt-0.5 text-gray-300 hover:text-gray-500" title="Move">&#9776;</span>}
                      <input
                        type="checkbox"
                        checked={checked[i] || false}
                        onChange={() => handleCheck(i)}
                        disabled={struck[i]}
                        className="mt-1 h-5 w-5 shrink-0 accent-green-600"
                      />
                      {isOwner && editingItemIndex === i ? (
                        <textarea
                          ref={el => {
                            if (el) {
                              el.style.height = 'auto'
                              el.style.height = el.scrollHeight + 'px'
                            }
                          }}
                          className={inputCls + ' flex-1 resize-none overflow-hidden leading-relaxed'}
                          value={itemInput}
                          onChange={e => {
                            setItemInput(e.target.value)
                            const el = e.target
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                          onBlur={handleSaveItem}
                          autoFocus
                        />
                      ) : (
                        <div
                          className={`min-w-0 flex-1 ${struck[i] ? 'text-gray-400 line-through' : checked[i] ? 'opacity-50' : ''} ${isOwner ? 'cursor-pointer' : ''}`}
                          onClick={() => isOwner && !struck[i] && handleEditItem(i)}
                        >
                          <RichItem text={item} />
                        </div>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => toggleStrike(i)}
                          aria-label={struck[i] ? 'Restore item' : 'Delete item'}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          {struck[i] ? '↺' : '✕'}
                        </button>
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      {isOwner && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-black shadow transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDeleteChecklist}
            type="button"
            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Remove Checklist
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-center text-sm ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
      <div className="mt-4 text-xs text-gray-400">Created by: {checklist.author_name || 'Anonymous'}{checklist.author_premium && <PremiumBadge className="ml-1" />} · Created at: {new Date(checklist.created_at).toLocaleString()}</div>
    </div>
  )
}
