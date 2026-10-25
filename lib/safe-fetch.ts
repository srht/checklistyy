import dns from 'dns/promises'
import net from 'net'
import type { ItemAction } from './items'

function isPrivate(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase()
    if (l.startsWith('::ffff:')) return isPrivate(l.slice(7))
    return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe8') || l.startsWith('fe9') || l.startsWith('fea') || l.startsWith('feb')
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

const MAX_BYTES = 64 * 1024

export async function runAction(action: ItemAction) {
  const u = new URL(action.url)
  if (!/^https?:$/.test(u.protocol)) throw new Error('Only http(s) URLs are allowed')
  const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true })
  if (!addrs.length || addrs.some(a => isPrivate(a.address))) throw new Error('This address is not allowed')

  const headers = { ...(action.headers ?? {}) }
  if (action.body && !Object.keys(headers).some(h => h.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json'
  const res = await fetch(u, {
    method: action.method,
    headers,
    body: action.method === 'GET' ? undefined : action.body,
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  })
  const text = (await res.text()).slice(0, MAX_BYTES)
  return { status: res.status, ok: res.ok, body: text }
}
