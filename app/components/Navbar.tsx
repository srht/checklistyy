import Link from 'next/link'
import { FaCheckSquare } from 'react-icons/fa'

export default function Navbar() {
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
            <Link
              href="/login"
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-600 hover:text-primary">
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
      </div>
    </nav>
  )
} 