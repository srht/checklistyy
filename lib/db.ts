import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

const g = globalThis as unknown as { sqlite?: Database.Database }

function open() {
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'checklisty.db')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.exec(`
    create table if not exists checklists (
      id text primary key,
      title text not null,
      description text,
      items text not null default '[]',
      author_id text not null,
      published integer not null default 0,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    create index if not exists checklists_author_id_idx on checklists(author_id);
  `)
  return db
}

export const db = g.sqlite ?? (g.sqlite = open())

export type ChecklistRow = {
  id: string
  title: string
  description: string | null
  items: unknown[]
  author_id: string
  published: boolean
  created_at: string
}

function toChecklist(r: any): ChecklistRow {
  return { ...r, items: JSON.parse(r.items), published: !!r.published }
}

export const checklists = {
  get: (id: string) => {
    const r = db.prepare('select * from checklists where id = ?').get(id)
    return r ? toChecklist(r) : undefined
  },
  listPublished: (limit = 100) =>
    db.prepare('select * from checklists where published = 1 order by created_at desc limit ?').all(limit).map(toChecklist),
  listByAuthor: (authorId: string) =>
    db.prepare('select * from checklists where author_id = ? order by created_at desc').all(authorId).map(toChecklist),
  create: (c: { title: string; description?: string | null; items?: unknown[]; author_id: string; published?: boolean }) => {
    const id = randomUUID()
    db.prepare('insert into checklists (id, title, description, items, author_id, published) values (?,?,?,?,?,?)').run(
      id,
      c.title,
      c.description ?? null,
      JSON.stringify(c.items ?? []),
      c.author_id,
      c.published ? 1 : 0
    )
    return checklists.get(id)!
  },
  update: (id: string, authorId: string, c: { title?: string | null; items?: unknown[] | null; published?: boolean | null }) => {
    const r = db
      .prepare(
        `update checklists set
           title = coalesce(?, title),
           items = coalesce(?, items),
           published = coalesce(?, published)
         where id = ? and author_id = ?`
      )
      .run(
        c.title ?? null,
        c.items ? JSON.stringify(c.items) : null,
        typeof c.published === 'boolean' ? (c.published ? 1 : 0) : null,
        id,
        authorId
      )
    return r.changes ? checklists.get(id) : undefined
  },
  remove: (id: string, authorId: string) =>
    db.prepare('delete from checklists where id = ? and author_id = ?').run(id, authorId).changes > 0,
}
