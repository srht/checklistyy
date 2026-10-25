import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checklists } from '@/lib/db'
import { runAction } from '@/lib/safe-fetch'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: { id: string; index: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'You need to sign in!' }, { status: 401 })
  const row = checklists.get(params.id)
  if (!row || (!row.published && row.author_id !== session.user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const action = row.items[Number(params.index)]?.action
  if (!action) return NextResponse.json({ error: 'No action on this item' }, { status: 404 })
  try {
    return NextResponse.json(await runAction(action))
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status: 502 })
  }
}
