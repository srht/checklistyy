'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaSpinner } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { fetchChecklistSuggestions } from '@/lib/ai'

const examples = [
  'Plan a summer vacation to Bali...',
  'Prepare for a job interview...',
  'Organize a birthday party...',
  'Create a weekly meal plan...',
  'Plan a weekend camping trip...',
  'Prepare a business presentation...',
]

export default function TypewriterInput() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTyping, setIsTyping] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const currentExample = examples[currentExampleIndex]
    const speed = isDeleting ? 50 : 100 // Faster when deleting

    if (isTyping) {
      if (!isDeleting && text === currentExample) {
        // Pause at the end of typing
        setTimeout(() => setIsDeleting(true), 2000)
        return
      }

      if (isDeleting && text === '') {
        setIsDeleting(false)
        setCurrentExampleIndex((prev) => (prev + 1) % examples.length)
        return
      }

      const delta = isDeleting ? -1 : 1
      const nextText = currentExample.substring(0, text.length + delta)
      
      const timer = setTimeout(() => {
        setText(nextText)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [text, isDeleting, currentExampleIndex, isTyping])

  const handleClick = () => {
    setText('')
    setIsTyping(false)
    setError('')
  }

  const handleBlur = () => {
    if (text === '') {
      setIsTyping(true)
    }
  }

  const generateChecklist = async () => {
    if (!text.trim()) {
      setError('Please enter a checklist idea')
      return
    }

    setIsLoading(true)
    setError('')

    try {

      localStorage.setItem('generatedChecklist', JSON.stringify({
        title: text,
        items: []
      }))
      
      router.push('/create')
      
    } catch (error) {
      console.error('Error generating checklist:', error)
      setError('Failed to generate checklist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateChecklist()
    }
  }

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setIsTyping(false)
            setError('')
          }}
          onClick={handleClick}
          onFocus={() => setIsTyping(false)}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder="Enter your checklist idea..."
          className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-primary focus:outline-none shadow-sm"
        />
        <button
          onClick={generateChecklist}
          disabled={isLoading || !text.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-3 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaSearch className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
} 