import { NextResponse } from 'next/server'
import { users } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-zA-Z0-9_.-]{3,30}$/

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  const username = String(b.username ?? '').trim()
  if (!USERNAME.test(username)) return NextResponse.json({ error: 'Username must be 3-30 characters (letters, numbers, _ . -)' }, { status: 400 })
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (users.findByEmail(email)) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  if (users.findByUsername(username)) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  users.create(email, password, username)
  return NextResponse.json({ ok: true }, { status: 201 })
}
