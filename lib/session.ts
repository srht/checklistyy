import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiKeys } from '@/lib/db'

export async function getSession(req: Request) {
  const m = req.headers.get('authorization')?.match(/^Bearer\s+(ck_\S+)$/i)
  if (m) {
    const id = apiKeys.verify(m[1])
    return id ? { user: { id } } : null
  }
  return getServerSession(authOptions)
}
