import { NextResponse } from 'next/server'
import { lookup } from 'dns/promises'
import net from 'net'

export const runtime = 'nodejs'

const cache = new Map<string, { at: number; data: Preview }>()
const TTL = 1000 * 60 * 60

type Preview = { url: string; title?: string; description?: string; image?: string; site?: string }

function isPrivate(ip: string) {
  if (net.isIPv6(ip)) return ip === '::1' || /^(fc|fd|fe80)/i.test(ip) || ip.startsWith('::ffff:')
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
}

async function assertPublic(u: URL) {
  if (!/^https?:$/.test(u.protocol)) throw new Error('bad protocol')
  const addrs = await lookup(u.hostname, { all: true })
  if (!addrs.length || addrs.some(a => isPrivate(a.address))) throw new Error('private host')
}

async function safeFetch(url: string): Promise<{ res: Response; finalUrl: string }> {
  let current = url
  for (let i = 0; i < 4; i++) {
    const u = new URL(current)
    await assertPublic(u)
    const res = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChecklistyBot/1.0)', accept: 'text/html' },
    })
    const loc = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString()
      continue
    }
    return { res, finalUrl: current }
  }
  throw new Error('too many redirects')
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function meta(html: string, keys: string[]) {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i')
    const m = html.match(re1) || html.match(re2)
    if (m?.[1]) return decode(m[1].trim())
  }
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url') || ''
  try {
    new URL(target)
    const hit = cache.get(target)
    if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data)

    const { res, finalUrl } = await safeFetch(target)
    if (!res.ok || !(res.headers.get('content-type') || '').includes('html')) throw new Error('not html')
    const html = (await res.text()).slice(0, 300_000)

    let image = meta(html, ['og:image', 'og:image:url', 'twitter:image'])
    if (image) {
      try {
        image = new URL(image, finalUrl).toString()
        if (!/^https?:/.test(image)) image = undefined
      } catch {
        image = undefined
      }
    }
    const data: Preview = {
      url: finalUrl,
      title: meta(html, ['og:title', 'twitter:title']) || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || ''),
      description: meta(html, ['og:description', 'description', 'twitter:description']),
      image,
      site: meta(html, ['og:site_name']) || new URL(finalUrl).hostname.replace(/^www\./, ''),
    }
    cache.set(target, { at: Date.now(), data })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'preview unavailable' }, { status: 404 })
  }
}
