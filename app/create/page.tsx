'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChecklistItem {
  content: string
  completed: boolean
}

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedChecklist = localStorage.getItem('generatedChecklist')
    if (savedChecklist) {
      const { title, items } = JSON.parse(savedChecklist)
      setTitle(title)
      setItems(items.map((item: string) => ({ content: item, completed: false })))
      // Clear the saved checklist
      localStorage.removeItem('generatedChecklist')
    }
    setIsLoading(false)
  }, [])

  const toggleItem = (index: number) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ))
  }

  const addItem = () => {
    setItems([...items, { content: '', completed: false }])
  }

  const updateItem = (index: number, content: string) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, content } : item
    ))
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Checklist Title"
              className="w-full text-2xl font-bold mb-6 p-2 border-b-2 border-gray-200 focus:border-primary focus:outline-none"
            />

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(index)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={item.content}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="flex-1 p-2 border-b border-gray-200 focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 space-x-4">
              <button
                onClick={addItem}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Item
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 