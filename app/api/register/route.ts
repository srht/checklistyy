import { NextResponse } from 'next/server'
import { users } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  const name = String(b.name ?? '').trim().slice(0, 80)
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (users.findByEmail(email)) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  users.create(email, password, name)
  return NextResponse.json({ ok: true }, { status: 201 })
}
