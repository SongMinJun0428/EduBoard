-- EduBoard custom auth setup
-- This keeps accounts in public.users and does not create Supabase Auth users.
-- Run this in Supabase SQL Editor before deploying the Netlify function.

create extension if not exists pgcrypto;

create table if not exists public.app_sessions (
  token_hash text primary key,
  username text not null references public.users(username) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_username_idx
  on public.app_sessions(username);

create index if not exists app_sessions_expires_at_idx
  on public.app_sessions(expires_at);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  username text not null references public.users(username) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_requests_username_idx
  on public.password_reset_requests(username);

create index if not exists password_reset_requests_expires_at_idx
  on public.password_reset_requests(expires_at);

create table if not exists public.auth_attempts (
  bucket text primary key,
  action text not null,
  count integer not null default 0,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  blocked_until timestamptz
);

create index if not exists auth_attempts_action_last_at_idx
  on public.auth_attempts(action, last_at);

create index if not exists auth_attempts_blocked_until_idx
  on public.auth_attempts(blocked_until);

alter table public.app_sessions enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.auth_attempts enable row level security;

drop policy if exists "No direct client access to app sessions" on public.app_sessions;
create policy "No direct client access to app sessions"
on public.app_sessions
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct client access to password reset requests" on public.password_reset_requests;
create policy "No direct client access to password reset requests"
on public.password_reset_requests
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct client access to auth attempts" on public.auth_attempts;
create policy "No direct client access to auth attempts"
on public.auth_attempts
for all
to anon, authenticated
using (false)
with check (false);

-- Important hardening note:
-- The Netlify function uses SUPABASE_SERVICE_ROLE_KEY, so it can read/write these tables.
-- Browser clients must not be allowed to select public.users.password directly.
-- This schema uses username as the account key; public.users does not have an id column.
revoke select on public.users from anon, authenticated;
grant select (
  username,
  email,
  name,
  grade,
  class_num,
  coin_balance,
  role,
  student_number,
  level,
  xp,
  can_edit_username,
  can_edit_name,
  inventory,
  current_theme,
  avatar_url,
  equipped_title,
  equipped_border,
  equipped_effect,
  equipped_color,
  co_xp,
  co_level,
  co_unlocked_steps,
  auth_user_id,
  school_name,
  atpt_ofcdc_sc_code,
  sd_schul_code
) on public.users to anon, authenticated;
