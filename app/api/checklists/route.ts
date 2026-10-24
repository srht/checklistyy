import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checklists } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const limit = Math.min(Number(sp.get('limit')) || 100, 100)
  if (sp.get('mine')) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(checklists.listByAuthor(session.user.id))
  }
  return NextResponse.json(checklists.listPublished(limit))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'You need to sign in!' }, { status: 401 })
  const { title, description, items, published } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const row = checklists.create({ title, description, items, author_id: session.user.id, published: !!published })
  return NextResponse.json(row, { status: 201 })
}
