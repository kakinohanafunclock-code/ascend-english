-- Ascend — Supabase schema (optional cloud sync + web push).
-- Run in the Supabase SQL editor. Free tier is sufficient.

-- Per-device snapshot of the learner's local state (last-write-wins).
create table if not exists public.user_state (
  device_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Web Push subscriptions for daily reminders (written by the server function only).
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  time text not null default '20:00',
  created_at timestamptz not null default now()
);

-- Row Level Security: the browser uses the anon key and only touches user_state.
alter table public.user_state enable row level security;

-- Demo policy: allow anon read/write keyed by device_id. For multi-user production,
-- replace with Supabase Auth + auth.uid()-scoped policies.
drop policy if exists "anon device state" on public.user_state;
create policy "anon device state" on public.user_state
  for all using (true) with check (true);

-- push_subscriptions is written by the service-role key (server). Keep RLS on with no
-- anon policy so it is not exposed to the browser.
alter table public.push_subscriptions enable row level security;
