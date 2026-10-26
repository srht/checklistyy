import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { progress } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return unauthorized()
  if (!UUID.test(params.id)) return NextResponse.json([])
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
