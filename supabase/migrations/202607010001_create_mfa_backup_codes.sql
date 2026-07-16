create table if not exists public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create unique index if not exists mfa_backup_codes_user_code_hash_idx
  on public.mfa_backup_codes (user_id, code_hash);

create index if not exists mfa_backup_codes_user_unused_idx
  on public.mfa_backup_codes (user_id, used)
  where used = false;

alter table public.mfa_backup_codes enable row level security;

drop policy if exists "Users can read their MFA backup codes" on public.mfa_backup_codes;
create policy "Users can read their MFA backup codes"
  on public.mfa_backup_codes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their MFA backup codes" on public.mfa_backup_codes;
create policy "Users can create their MFA backup codes"
  on public.mfa_backup_codes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their MFA backup codes" on public.mfa_backup_codes;
create policy "Users can update their MFA backup codes"
  on public.mfa_backup_codes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their MFA backup codes" on public.mfa_backup_codes;
create policy "Users can delete their MFA backup codes"
  on public.mfa_backup_codes
  for delete
  using (auth.uid() = user_id);
