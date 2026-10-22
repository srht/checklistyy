import { Pool } from 'pg'

const g = globalThis as unknown as { pgPool?: Pool }

export const pool =
  g.pgPool ??
  (g.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/checklisty',
  }))
