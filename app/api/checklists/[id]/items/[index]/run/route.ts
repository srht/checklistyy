import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checklists } from '@/lib/db'
import { runAction, type RunInputs } from '@/lib/safe-fetch'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: { id: string; index: string } }) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: 'You need to sign in!' }, { status: 401 })
  const row = checklists.get(params.id)
  if (!row || (!row.published && row.author_id !== session.user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const action = row.items[Number(params.index)]?.action
  if (!action) return NextResponse.json({ error: 'No action on this item' }, { status: 404 })
  const values: RunInputs = {}
  try {
    const fd = await req.formData()
    for (const i of action.inputs ?? []) {
      const v = fd.get(i.name)
      if (v == null) continue
      if (i.type === 'file' ? typeof v !== 'string' : typeof v === 'string') values[i.name] = v as string | File
    }
    return NextResponse.json(await runAction(action, values))
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Request failed' }, { status: 502 })
  }
}
