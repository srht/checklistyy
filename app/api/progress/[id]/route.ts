import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists, progress } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return unauthorized()
  if (!UUID.test(params.id)) return NextResponse.json([])
  if (new URL(req.url).searchParams.get('members')) {
    const c = checklists.get(params.id)
    return NextResponse.json(c?.shared && c.published ? progress.members(c.id, c.items.length) : [])
  }
  return NextResponse.json(progress.get(session.user.id, params.id) ?? [])
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return unauthorized()
  if (!UUID.test(params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { checked } = await req.json()
  if (!Array.isArray(checked) || checked.length > 1000) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  progress.set(session.user.id, params.id, checked.map(Boolean))
  return NextResponse.json({ ok: true })
}
