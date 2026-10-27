import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists, collaborators } from '@/lib/db'
import { redactItems } from '@/lib/items'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return notFound()
  const row = checklists.get(params.id)
  if (!row) return notFound()
  const session = await getSession(req)
  const uid = session?.user?.id
  const owner = uid === row.author_id
  const editor = !!uid && (owner || checklists.canEdit(row.id, uid))
  if (!row.published && !editor) return notFound()
  const collabs = editor ? collaborators.list(row.id) : undefined
  return NextResponse.json(editor ? { ...row, can_edit: true, collaborators: collabs } : { ...row, items: redactItems(row.items) })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  const b = await req.json()
  const existing = checklists.get(params.id)
  if (existing && existing.author_id !== session.user.id) delete b.published
  const row = checklists.update(params.id, session.user.id, b)
  return row ? NextResponse.json(row) : notFound()
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!UUID.test(params.id)) return notFound()
  return checklists.remove(params.id, session.user.id) ? NextResponse.json({ ok: true }) : notFound()
}
