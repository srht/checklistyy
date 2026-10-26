import Database from 'better-sqlite3'
import { createHash, randomBytes, randomUUID } from 'crypto'
import path from 'path'

const login = process.argv[2]
if (!login) { console.error('Usage: node scripts/create-api-key.mjs <email|username> [key name]'); process.exit(1) }
const db = new Database(process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'checklisty.db'))
const u = db.prepare(login.includes('@') ? 'select id from users where email = ?' : 'select id from users where username = ? collate nocase').get(login.includes('@') ? login.toLowerCase() : login)
if (!u) { console.error('User not found'); process.exit(1) }
db.exec(`create table if not exists api_keys (id text primary key, user_id text not null, name text, key_hash text not null unique, created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))`)
const key = `ck_${randomBytes(24).toString('hex')}`
db.prepare('insert into api_keys (id, user_id, name, key_hash) values (?,?,?,?)').run(randomUUID(), u.id, process.argv[3] ?? null, createHash('sha256').update(key).digest('hex'))
console.log(key)
