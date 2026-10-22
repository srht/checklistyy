import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const limit = Math.min(Number(sp.get('limit')) || 100, 100)
  if (sp.get('mine')) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { rows } = await pool.query(
      'select * from checklists where author_id = $1 order by created_at desc',
      [session.user.id]
    )
    return NextResponse.json(rows)
  }
  const { rows } = await pool.query(
    'select * from checklists where published = true order by created_at desc limit $1',
    [limit]
  )
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'You need to sign in!' }, { status: 401 })
  const { title, description, items, published } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const { rows } = await pool.query(
    'insert into checklists (title, description, items, author_id, published) values ($1,$2,$3::jsonb,$4,$5) returning *',
    [title, description ?? null, JSON.stringify(items ?? []), session.user.id, !!published]
  )
  return NextResponse.json(rows[0], { status: 201 })
}
