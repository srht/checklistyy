import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './tools.mjs'

const BASE = (process.env.CHECKLISTY_URL || 'http://localhost:3000').replace(/\/$/, '')
const API_KEY = process.env.CHECKLISTY_API_KEY || ''

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) {
    const hint = res.status === 401 ? ' (set CHECKLISTY_API_KEY to use authenticated tools)' : ''
    throw new Error(`${method} ${path} -> ${res.status}: ${data?.error || text}${hint}`)
  }
  return data
}

const server = new McpServer({ name: 'checklisty', version: '0.1.0' })
registerTools(server, api)

await server.connect(new StdioServerTransport())
