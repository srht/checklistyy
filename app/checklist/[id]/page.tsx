'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function ChecklistDetailPage() {
  const { id } = useParams()
  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<boolean[]>([])
  const [user, setUser] = useState<any>(null)
  const [deletedItems, setDeletedItems] = useState<{item: string, index: number}[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemInput, setItemInput] = useState('')

  useEffect(() => {
    const fetchChecklist = async () => {
      const { data } = await supabase
        .from('checklists')
        .select('*')
        .eq('id', id)
        .single()
      setChecklist(data)
      setTitleInput(data?.title || '')
      setLoading(false)
      if (data?.items) setChecked(new Array(data.items.length).fill(false))
    }
    fetchChecklist()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [id])

  const handleCheck = (idx: number) => {
    setChecked(prev => prev.map((val, i) => (i === idx ? !val : val)))
  }

  // Silinen item'ı ayrı bir diziye al
  const handleDelete = (idx: number) => {
    if (!checklist) return
    setDeletedItems([...deletedItems, { item: checklist.items[idx], index: idx }])
    setChecklist({
      ...checklist,
      items: checklist.items.filter((_: string, i: number) => i !== idx)
    })
    setChecked(checked.filter((_, i) => i !== idx))
  }

  // Geri al (undo)
  const handleUndo = () => {
    if (!deletedItems.length || !checklist) return
    const last = deletedItems[deletedItems.length - 1]
    const newItems = [...checklist.items]
    newItems.splice(last.index, 0, last.item)
    setChecklist({ ...checklist, items: newItems })
    setChecked(prev => {
      const arr = [...prev]
      arr.splice(last.index, 0, false)
      return arr
    })
    setDeletedItems(deletedItems.slice(0, -1))
  }

  // Maddeyi düzenlemeye başla
  const handleEditItem = (idx: number) => {
    setEditingItemIndex(idx)
    setItemInput(checklist.items[idx])
  }

  // Maddeyi güncelle
  const handleSaveItem = () => {
    if (editingItemIndex === null || !checklist) return
    const newItems = [...checklist.items]
    newItems[editingItemIndex] = itemInput
    setChecklist({ ...checklist, items: newItems })
    setEditingItemIndex(null)
    setItemInput('')
  }

  // Kaydet
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('checklists')
      .update({ items: checklist.items, title: titleInput })
      .eq('id', id)
    setSaving(false)
    setEditingTitle(false)
    if (error) setMessage('Hata: ' + error.message)
    else setMessage('Saved!')
    setChecklist({ ...checklist, title: titleInput })
  }

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !checklist) return
    const newItems = Array.from(checklist.items)
    const [removed] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, removed)
    setChecklist({ ...checklist, items: newItems })
    // checked dizisini de aynı şekilde yeniden sırala
    const newChecked = Array.from(checked)
    const [checkedRemoved] = newChecked.splice(result.source.index, 1)
    newChecked.splice(result.destination.index, 0, checkedRemoved)
    setChecked(newChecked)
  }

  const handleCopy = async () => {
    if (!user || !checklist) return;
    const { error } = await supabase.from('checklists').insert({
      title: checklist.title + ' (Copy)',
      description: checklist.description,
      items: checklist.items,
      author_id: user.id,
      published: false,
    });
    if (error) setMessage('Copy error: ' + error.message);
    else setMessage('List copied! You can see it in My checklists page.');
  };

  // WhatsApp paylaşım fonksiyonu
  const handleShareWhatsApp = () => {
    if (!checklist || !checklist.published) return;
    const shareUrl = `${window.location.origin}/checklist/${checklist.id}`;
    const text = `Check out this checklist: ${checklist.title} - ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Listeyi silme fonksiyonu
  const handleDeleteChecklist = async () => {
    if (!isOwner || !checklist || !window.confirm('Do you want to delete this checklist?')) return;
    setLoading(true);
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    setLoading(false);
    if (error) setMessage('Delete error: ' + error.message);
    else {
      setMessage('Checklist deleted.');
      // Silme başarılı olursa Listelerim sayfasına yönlendir
      window.location.href = '/my-checklists'; 
    }
  };

  if (loading) return <div className="p-6">Loading...</div>
  if (!checklist) return <div className="p-6">Checklist can't be found.</div>

  const isOwner = user && checklist.author_id === user.id

  return (
    <div className="max-w-xl mx-auto p-6">
      {isOwner && editingTitle ? (
        <input
          className="text-2xl font-bold mb-2 w-full border p-2 rounded"
          value={titleInput}
          onChange={e => setTitleInput(e.target.value)}
          onBlur={() => setEditingTitle(false)}
          autoFocus
        />
      ) : (
        <h1
          className={`text-2xl font-bold mb-2 ${isOwner ? 'cursor-pointer hover:underline' : ''}`}
          onClick={() => isOwner && setEditingTitle(true)}
        >
          {titleInput}
        </h1>
      )}
      <div className="mb-2 text-gray-500">{checklist.description}</div>
      <div className="mb-4 flex gap-2">
        {!isOwner && user && (
          <button
            onClick={handleCopy}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            type="button"
          >
            Copy
          </button>
        )}
        {checklist.published && (
          <button
            onClick={handleShareWhatsApp}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            type="button"
          >
            Share on WhatsApp
          </button>
        )}
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist-items">
          {(provided) => (
            <ul
              className="mb-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {checklist.items?.map((item: string, i: number) => (
                <Draggable
                  key={i}
                  draggableId={String(i)}
                  index={i}
                  isDragDisabled={!isOwner}
                >
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-2 my-4 text-lg bg-white ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      {isOwner && (
                        <>
                          <span
                            className="cursor-move text-gray-400"
                            title="Move"
                          >
                            &#9776;
                          </span>
                          <button
                            onClick={() => handleDelete(i)}
                            className="text-red-500 text-xs border px-2 py-1 rounded hover:bg-red-100"
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <input
                        type="checkbox"
                        checked={checked[i] || false}
                        onChange={() => handleCheck(i)}
                        className="w-5 h-5"
                      />
                      {isOwner && editingItemIndex === i ? (
                        <>
                          <input
                            className="border p-1 rounded flex-1"
                            value={itemInput}
                            onChange={e => setItemInput(e.target.value)}
                            onBlur={handleSaveItem}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveItem}
                            className="text-green-600 text-xs border px-2 py-1 rounded hover:bg-green-100"
                            type="button"
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <span
                          className={`${checked[i] ? 'line-through text-gray-400' : ''} ${isOwner ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={() => isOwner && handleEditItem(i)}
                        >
                          {item}
                        </span>
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
      {isOwner && deletedItems.length > 0 && (
        <button
          onClick={handleUndo}
          className="mb-2 text-green-500 text-xs border px-2 py-1 rounded hover:bg-blue-100"
          type="button"
        >
          Geri Al
        </button>
      )}
      {isOwner && (
        <button
          onClick={handleSave}
          className="ml-2 bg-primary text-white px-4 py-2 rounded"
          disabled={saving}
          type="button"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      )}
      {isOwner && (
        <button
          onClick={handleDeleteChecklist}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          type="button"
        >
          Remove Checklist
        </button>
      )}
      {message && <div className="mt-2 text-center">{message}</div>}
      <div className="text-xs text-gray-400 mt-4">
        Created at: {new Date(checklist.created_at).toLocaleString()}
      </div>
      <div className="text-xs text-gray-800">
        {checklist.published ? 'Published' : 'Private'}
      </div>
    </div>
  )
} 