import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists, collaborators, users } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const err = (error: string, status: number) => NextResponse.json({ error }, { status })

async function owned(req: Request, id: string) {
  const session = await getSession(req)
  if (!session?.user?.id) return { res: err('Unauthorized', 401) }
  const row = UUID.test(id) ? checklists.get(id) : undefined
  if (!row || row.author_id !== session.user.id) return { res: err('Not found', 404) }
  return { row }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { row, res } = await owned(req, params.id)
  if (!row) return res
  const { username } = await req.json()
  const u = typeof username === 'string' ? users.findByUsername(username.trim()) : undefined
  if (!u) return err('User not found', 404)
  if (u.id === row.author_id) return err('You already own this checklist', 400)
  collaborators.add(row.id, u.id)
  return NextResponse.json(collaborators.list(row.id))
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { row, res } = await owned(req, params.id)
  if (!row) return res
  const { userId } = await req.json()
  collaborators.remove(row.id, userId)
  return NextResponse.json(collaborators.list(row.id))
}
