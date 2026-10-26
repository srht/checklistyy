import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists } from '@/lib/db'
import { redactItems } from '@/lib/items'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return notFound()
  const row = checklists.get(params.id)
  if (!row) return notFound()
  const session = await getSession(req)
  const owner = session?.user?.id === row.author_id
  if (!row.published && !owner) return notFound()
  return NextResponse.json(owner ? row : { ...row, items: redactItems(row.items) })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  const b = await req.json()
  const row = checklists.update(params.id, session.user.id, b)
  return row ? NextResponse.json(row) : notFound()
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  return checklists.remove(params.id, session.user.id) ? NextResponse.json({ ok: true }) : notFound()
}
