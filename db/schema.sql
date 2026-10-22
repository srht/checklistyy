create extension if not exists pgcrypto;
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  items jsonb not null default '[]',
  author_id text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists checklists_author_id_idx on checklists(author_id);
