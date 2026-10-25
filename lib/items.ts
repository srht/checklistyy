export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export type ActionInput = { name: string; type: 'text' | 'file'; target: 'query' | 'body' }
export type ItemAction = {
  method: (typeof METHODS)[number]
  url: string
  headers?: Record<string, string>
  query?: Record<string, string>
  bodyType?: 'json' | 'form' | 'multipart'
  body?: string
  fields?: Record<string, string>
  inputs?: ActionInput[]
}
export type ChecklistItem = { text: string; action?: ItemAction }

const strMap = (m: any) => {
  const out: Record<string, string> = {}
  if (m && typeof m === 'object') for (const [k, v] of Object.entries(m)) if (k.trim() && typeof v === 'string') out[k.trim()] = v
  return Object.keys(out).length ? out : undefined
}

export function normalizeAction(a: any): ItemAction | undefined {
  if (!a || typeof a.url !== 'string' || !/^https?:\/\//i.test(a.url.trim())) return undefined
  const method = METHODS.includes(String(a.method).toUpperCase() as any) ? (String(a.method).toUpperCase() as ItemAction['method']) : 'GET'
  const inputs: ActionInput[] = []
  if (Array.isArray(a.inputs))
    for (const i of a.inputs) {
      const name = typeof i?.name === 'string' ? i.name.trim() : ''
      if (!name || inputs.some(x => x.name === name)) continue
      const type = i.type === 'file' && method !== 'GET' ? 'file' : 'text'
      inputs.push({ name, type, target: type === 'file' || (method !== 'GET' && i.target !== 'query') ? 'body' : 'query' })
    }
  const out: ItemAction = { method, url: a.url.trim() }
  const headers = strMap(a.headers)
  const query = strMap(a.query)
  if (headers) out.headers = headers
  if (query) out.query = query
  if (inputs.length) out.inputs = inputs
  if (method !== 'GET') {
    const hasFile = inputs.some(i => i.type === 'file')
    out.bodyType = hasFile || a.bodyType === 'multipart' ? 'multipart' : a.bodyType === 'form' ? 'form' : 'json'
    if (out.bodyType === 'json') {
      if (typeof a.body === 'string' && a.body.trim()) out.body = a.body
    } else {
      const fields = strMap(a.fields)
      if (fields) out.fields = fields
    }
  }
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
  items.map(i => (i.action ? { text: i.text, action: { method: i.action.method, url: i.action.url, bodyType: i.action.bodyType, inputs: i.action.inputs } } : i))
