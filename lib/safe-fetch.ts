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

export const MAX_UPLOAD = 10 * 1024 * 1024
const MAX_RESPONSE = 5 * 1024 * 1024
const TEXTUAL = /^(text\/|application\/(json|xml|javascript|x-www-form-urlencoded)|.*[+/](json|xml)$)/i

export type RunInputs = Record<string, string | File>

export async function runAction(action: ItemAction, values: RunInputs = {}) {
  const u = new URL(action.url)
  if (!/^https?:$/.test(u.protocol)) throw new Error('Only http(s) URLs are allowed')
  const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true })
  if (!addrs.length || addrs.some(a => isPrivate(a.address))) throw new Error('This address is not allowed')

  const inputs = action.inputs ?? []
  for (const [k, v] of Object.entries(action.query ?? {})) u.searchParams.set(k, v)
  for (const i of inputs) if (i.type === 'text' && i.target === 'query' && typeof values[i.name] === 'string') u.searchParams.set(i.name, values[i.name] as string)

  const headers: Record<string, string> = { ...(action.headers ?? {}) }
  const hasHeader = (n: string) => Object.keys(headers).some(h => h.toLowerCase() === n)
  const bodyText = inputs.filter(i => i.type === 'text' && i.target === 'body' && typeof values[i.name] === 'string')
  let body: BodyInit | undefined

  if (action.method !== 'GET') {
    if (action.bodyType === 'multipart') {
      const fd = new FormData()
      for (const [k, v] of Object.entries(action.fields ?? {})) fd.append(k, v)
      for (const i of bodyText) fd.append(i.name, values[i.name] as string)
      for (const i of inputs) {
        const f = values[i.name]
        if (i.type !== 'file' || typeof f === 'string' || !f) continue
        if (f.size > MAX_UPLOAD) throw new Error(`File "${i.name}" is too large (max ${MAX_UPLOAD / 1024 / 1024}MB)`)
        fd.append(i.name, f, f.name)
      }
      for (const h of Object.keys(headers)) if (h.toLowerCase() === 'content-type') delete headers[h]
      body = fd
    } else if (action.bodyType === 'form') {
      const p = new URLSearchParams(action.fields ?? {})
      for (const i of bodyText) p.set(i.name, values[i.name] as string)
      if (!hasHeader('content-type')) headers['Content-Type'] = 'application/x-www-form-urlencoded'
      body = p.toString()
    } else {
      let obj: any = undefined
      if (action.body?.trim()) {
        try { obj = JSON.parse(action.body) } catch { if (bodyText.length) throw new Error('Body is not valid JSON, cannot add parameters') }
      }
      if (bodyText.length) {
        obj = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
        for (const i of bodyText) obj[i.name] = values[i.name]
        body = JSON.stringify(obj)
      } else body = action.body?.trim() ? action.body : undefined
      if (body !== undefined && !hasHeader('content-type')) headers['Content-Type'] = 'application/json'
    }
  }

  const res = await fetch(u, { method: action.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(15_000) })
  const chunks: Uint8Array[] = []
  let size = 0
  const reader = res.body?.getReader()
  let truncated = false
  while (reader) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    chunks.push(value)
    if (size > MAX_RESPONSE) { truncated = true; await reader.cancel(); break }
  }
  const buf = Buffer.concat(chunks)
  const contentType = res.headers.get('content-type') || ''
  const base = { status: res.status, ok: res.ok, contentType, truncated }
  if (!contentType || TEXTUAL.test(contentType.split(';')[0].trim())) return { ...base, body: buf.toString('utf8').slice(0, 64 * 1024) }
  return { ...base, binary: true, size: buf.length, data: truncated ? undefined : buf.toString('base64') }
}
