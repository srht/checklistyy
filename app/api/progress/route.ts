import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { progress } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(progress.listByUser(session.user.id))
}
