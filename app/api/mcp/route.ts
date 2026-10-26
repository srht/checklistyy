import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { registerTools } from '../../../mcp/tools.mjs'

export const dynamic = 'force-dynamic'

async function handle(req: Request) {
  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || new URL(req.url).origin
  const auth = req.headers.get('authorization')

  const api = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(origin + path, {
      method,
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(auth && { Authorization: auth }) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = text }
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.error || text}${res.status === 401 ? ' (send an API key as "Authorization: Bearer ck_...")' : ''}`)
    return data
  }

  const server = new McpServer({ name: 'checklisty', version: '0.1.0' })
  registerTools(server, api)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  return transport.handleRequest(req)
}

export { handle as GET, handle as POST, handle as DELETE }
