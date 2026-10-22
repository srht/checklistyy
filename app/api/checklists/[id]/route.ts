import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 })

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return notFound()
  const { rows } = await pool.query('select * from checklists where id = $1', [params.id])
  const row = rows[0]
  if (!row) return notFound()
  if (!row.published) {
    const session = await getServerSession(authOptions)
    if (session?.user?.id !== row.author_id) return notFound()
  }
  return NextResponse.json(row)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  const b = await req.json()
  const { rows } = await pool.query(
    `update checklists set
       title = coalesce($3, title),
       items = coalesce($4::jsonb, items),
       published = coalesce($5, published)
     where id = $1 and author_id = $2 returning *`,
    [
      params.id,
      session.user.id,
      b.title ?? null,
      b.items ? JSON.stringify(b.items) : null,
      typeof b.published === 'boolean' ? b.published : null,
    ]
  )
  return rows[0] ? NextResponse.json(rows[0]) : notFound()
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  const { rowCount } = await pool.query('delete from checklists where id = $1 and author_id = $2', [
    params.id,
    session.user.id,
  ])
  return rowCount ? NextResponse.json({ ok: true }) : notFound()
}
