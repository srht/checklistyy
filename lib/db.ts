import Database from 'better-sqlite3'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
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
    create table if not exists users (
      id text primary key,
      email text not null unique,
      name text,
      password_hash text not null,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    create table if not exists premium_users (
      user_id text primary key,
      stripe_session_id text,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    create table if not exists progress (
      user_id text not null,
      checklist_id text not null,
      checked text not null default '[]',
      updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      primary key (user_id, checklist_id)
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
  author_name: string | null
  author_premium: boolean
  published: boolean
  created_at: string
}

function toChecklist(r: any): ChecklistRow {
  return { ...r, items: JSON.parse(r.items), published: !!r.published, author_premium: !!r.author_premium }
}

export const checklists = {
  get: (id: string) => {
    const r = db.prepare('select c.*, u.name as author_name, exists(select 1 from premium_users p where p.user_id = c.author_id) as author_premium from checklists c left join users u on u.id = c.author_id where c.id = ?').get(id)
    return r ? toChecklist(r) : undefined
  },
  listPublished: (limit = 100) =>
    db.prepare('select c.*, u.name as author_name, exists(select 1 from premium_users p where p.user_id = c.author_id) as author_premium from checklists c left join users u on u.id = c.author_id where c.published = 1 order by c.created_at desc limit ?').all(limit).map(toChecklist),
  listByAuthor: (authorId: string) =>
    db.prepare('select c.*, u.name as author_name, exists(select 1 from premium_users p where p.user_id = c.author_id) as author_premium from checklists c left join users u on u.id = c.author_id where c.author_id = ? order by c.created_at desc').all(authorId).map(toChecklist),
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

const hash = (password: string, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(password, salt, 64).toString('hex')}`

export const users = {
  findByEmail: (email: string) =>
    db.prepare('select * from users where email = ?').get(email) as
      | { id: string; email: string; name: string | null; password_hash: string }
      | undefined,
  create: (email: string, password: string, name?: string) => {
    const id = randomUUID()
    db.prepare('insert into users (id, email, name, password_hash) values (?,?,?,?)').run(
      id,
      email,
      name || email.split('@')[0],
      hash(password)
    )
    return id
  },
  verify: (email: string, password: string) => {
    const u = users.findByEmail(email)
    if (!u) return null
    const [salt, key] = u.password_hash.split(':')
    const a = Buffer.from(key, 'hex')
    const b = scryptSync(password, salt, 64)
    return a.length === b.length && timingSafeEqual(a, b) ? u : null
  },
}

export const premium = {
  is: (userId: string) => !!db.prepare('select 1 from premium_users where user_id = ?').get(userId),
  grant: (userId: string, sessionId?: string) =>
    db.prepare('insert or ignore into premium_users (user_id, stripe_session_id) values (?,?)').run(userId, sessionId ?? null),
}

export const progress = {
  get: (userId: string, checklistId: string): boolean[] | undefined => {
    const r = db.prepare('select checked from progress where user_id = ? and checklist_id = ?').get(userId, checklistId) as any
    return r ? JSON.parse(r.checked) : undefined
  },
  set: (userId: string, checklistId: string, checked: boolean[]) => {
    if (!checked.some(Boolean)) return void db.prepare('delete from progress where user_id = ? and checklist_id = ?').run(userId, checklistId)
    db.prepare(
      `insert into progress (user_id, checklist_id, checked) values (?,?,?)
       on conflict(user_id, checklist_id) do update set checked = excluded.checked, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    ).run(userId, checklistId, JSON.stringify(checked))
  },
  listByUser: (userId: string) =>
    (db
      .prepare(
        `select c.id, c.title, c.description, c.items, p.checked, p.updated_at
         from progress p join checklists c on c.id = p.checklist_id
         where p.user_id = ? and (c.published = 1 or c.author_id = ?)
         order by p.updated_at desc`
      )
      .all(userId, userId) as any[]).map(r => {
      const items = JSON.parse(r.items) as unknown[]
      const checked = (JSON.parse(r.checked) as boolean[]).slice(0, items.length)
      return { id: r.id, title: r.title, description: r.description, total: items.length, done: checked.filter(Boolean).length, updated_at: r.updated_at }
    }),
}
