import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { premium } from '@/lib/db'

export const dynamic = 'force-dynamic'

const stripe = (path: string, body?: URLSearchParams) =>
  fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }) },
    body,
  }).then(r => r.json())

const origin = () => process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST() {
  const session = await getServerSession(authOptions)
  const uid = session?.user?.id
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (premium.is(uid)) return NextResponse.json({ url: `${origin()}/premium` })
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 })
    premium.grant(uid, 'dev')
    return NextResponse.json({ url: `${origin()}/premium?success=1` })
  }
  const s = await stripe('checkout/sessions', new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': process.env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    client_reference_id: uid,
    success_url: `${origin()}/premium?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin()}/premium`,
  }))
  return s.url ? NextResponse.json({ url: s.url }) : NextResponse.json({ error: s.error?.message || 'Stripe error' }, { status: 502 })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  const uid = session?.user?.id
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { session_id } = await req.json()
  if (typeof session_id !== 'string' || !/^cs_[\w]+$/.test(session_id)) return NextResponse.json({ error: 'Bad session' }, { status: 400 })
  const s = await stripe(`checkout/sessions/${session_id}`)
  if (s.payment_status !== 'paid' || s.client_reference_id !== uid) return NextResponse.json({ premium: false }, { status: 402 })
  premium.grant(uid, session_id)
  return NextResponse.json({ premium: true })
}
