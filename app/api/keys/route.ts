import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiKeys } from '@/lib/db'

export const dynamic = 'force-dynamic'

const uid = async () => (await getServerSession(authOptions))?.user?.id
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET() {
  const u = await uid()
  return u ? NextResponse.json(apiKeys.list(u)) : unauthorized()
}

export async function POST(req: Request) {
  const u = await uid()
  if (!u) return unauthorized()
  const { name } = await req.json().catch(() => ({}))
  return NextResponse.json(apiKeys.create(u, typeof name === 'string' ? name.slice(0, 80) : undefined), { status: 201 })
}

export async function DELETE(req: Request) {
  const u = await uid()
  if (!u) return unauthorized()
  const { id } = await req.json().catch(() => ({}))
  return typeof id === 'string' && apiKeys.remove(u, id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
