import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists } from '@/lib/db'
import { redactItems } from '@/lib/items'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const limit = Math.min(Number(sp.get('limit')) || 100, 100)
  if (sp.get('mine')) {
    const session = await getSession(req)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(checklists.listByAuthor(session.user.id))
  }
  return NextResponse.json(checklists.listPublished(limit).map(r => ({ ...r, items: redactItems(r.items) })))
}

export async function POST(req: Request) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'You need to sign in!' }, { status: 401 })
  const { title, description, items, published } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const row = checklists.create({ title, description, items, author_id: session.user.id, published: !!published })
  return NextResponse.json(row, { status: 201 })
}
