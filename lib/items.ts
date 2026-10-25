export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export type ItemAction = {
  method: (typeof METHODS)[number]
  url: string
  headers?: Record<string, string>
  body?: string
}
export type ChecklistItem = { text: string; action?: ItemAction }

export function normalizeAction(a: any): ItemAction | undefined {
  if (!a || typeof a.url !== 'string' || !/^https?:\/\//i.test(a.url.trim())) return undefined
  const method = METHODS.includes(String(a.method).toUpperCase() as any) ? (String(a.method).toUpperCase() as ItemAction['method']) : 'GET'
  const headers: Record<string, string> = {}
  if (a.headers && typeof a.headers === 'object')
    for (const [k, v] of Object.entries(a.headers)) if (k.trim() && typeof v === 'string') headers[k.trim()] = v
  const out: ItemAction = { method, url: a.url.trim() }
  if (Object.keys(headers).length) out.headers = headers
  if (method !== 'GET' && typeof a.body === 'string' && a.body.trim()) out.body = a.body
  return out
}

export function normalizeItem(i: unknown): ChecklistItem {
  if (typeof i === 'string') return { text: i }
  const o = (i ?? {}) as any
  const action = normalizeAction(o.action)
  return action ? { text: String(o.text ?? ''), action } : { text: String(o.text ?? '') }
}

export const normalizeItems = (items: unknown): ChecklistItem[] => (Array.isArray(items) ? items.map(normalizeItem) : [])

export const redactItems = (items: ChecklistItem[]): ChecklistItem[] =>
  items.map(i => (i.action ? { text: i.text, action: { method: i.action.method, url: i.action.url } } : i))
