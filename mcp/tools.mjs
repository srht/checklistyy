import { z } from 'zod'

export function registerTools(server, api) {
  const run = fn => async args => {
    try {
      return { content: [{ type: 'text', text: JSON.stringify(await fn(args), null, 2) }] }
    } catch (e) {
      return { isError: true, content: [{ type: 'text', text: e.message }] }
    }
  }
  const id = z.string().uuid().describe('Checklist UUID')

  server.tool('list_public_checklists', 'List published checklists', { limit: z.number().int().min(1).max(100).optional() },
    run(({ limit }) => api('GET', `/api/checklists${limit ? `?limit=${limit}` : ''}`)))

  server.tool('list_my_checklists', 'List checklists of the signed-in user (requires auth)', {},
    run(() => api('GET', '/api/checklists?mine=1')))

  server.tool('get_checklist', 'Get a checklist by id', { id }, run(({ id }) => api('GET', `/api/checklists/${id}`)))

  server.tool('create_checklist', 'Create a checklist (requires auth)', {
    title: z.string(),
    description: z.string().optional(),
    items: z.array(z.any()).optional().describe('Items: markdown strings or item objects as used by the app'),
    published: z.boolean().optional(),
  }, run(b => api('POST', '/api/checklists', b)))

  server.tool('update_checklist', 'Update a checklist you own (requires auth)', {
    id,
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(z.any()).optional(),
    published: z.boolean().optional(),
  }, run(({ id, ...b }) => api('PATCH', `/api/checklists/${id}`, b)))

  server.tool('delete_checklist', 'Delete a checklist you own (requires auth)', { id }, run(({ id }) => api('DELETE', `/api/checklists/${id}`)))

  server.tool('get_progress', 'Get checked state of a checklist for the signed-in user (requires auth)', { id }, run(({ id }) => api('GET', `/api/progress/${id}`)))

  server.tool('set_progress', 'Set checked state array of a checklist for the signed-in user (requires auth)', {
    id,
    checked: z.array(z.boolean()).max(1000),
  }, run(({ id, checked }) => api('PUT', `/api/progress/${id}`, { checked })))

  server.tool('premium_status', 'Get premium status of the signed-in user (requires auth)', {}, run(() => api('GET', '/api/premium/status')))
}
