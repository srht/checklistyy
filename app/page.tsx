import Link from 'next/link'
import TypewriterInput from './components/TypewriterInput'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Checklisty
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create, manage, and share your checklists with the world
          </p>

          <TypewriterInput />

          <div className="space-x-4">
            <Link
              href="/create"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Create New Checklist
            </Link>
            <Link
              href="/browse"
              className="bg-white text-primary border-2 border-primary px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Browse Checklists
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Create</h3>
            <p className="text-gray-600">
              Create beautiful, organized checklists for any purpose
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Share</h3>
            <p className="text-gray-600">
              Share your checklists with friends, family, or the world
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Collaborate</h3>
            <p className="text-gray-600">
              Work together with others on shared checklists
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 