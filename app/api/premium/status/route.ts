import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { premium } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getSession(req)
  return NextResponse.json({ premium: !!session?.user?.id && premium.is(session.user.id) })
}
