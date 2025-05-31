'use client'

import Link from 'next/link'
import { FaCheckSquare } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/auth/signin'
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FaCheckSquare className="text-primary text-2xl" />
            <span className="text-xl font-bold text-gray-900">Checklisty</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/create"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Create
            </Link>
            <Link
              href="/browse"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Browse
            </Link>
            {user && (
              <Link
                href="/my-checklists"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                My Checklists 
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {user.user_metadata?.full_name?.[0] || 'U'}
                    </div>
                  )}
                  <span>{user.user_metadata?.full_name || user.email}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-600 hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              href="/create"
              className="block text-gray-600 hover:text-primary transition-colors"
            >
              Create
            </Link>
            <Link
              href="/browse"
              className="block text-gray-600 hover:text-primary transition-colors"
            >
              Browse
            </Link>
            {user && (
              <Link
                href="/my-checklists"
                className="block text-gray-600 hover:text-primary transition-colors"
              >
                Checklistlerim
              </Link>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="block w-full text-left text-gray-600 hover:text-primary transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
} 