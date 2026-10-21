-- ============================================================
-- Partner sharing
-- ============================================================

create table if not exists public.partner_shares (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  token text not null unique,
  partner_name text default '',
  partner_email text default '',
  include_dashboard boolean default true,
  include_logs boolean default true,
  include_pcos boolean default true,
  is_active boolean default true,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_id)
);

alter table public.partner_shares enable row level security;

drop policy if exists "own partner shares" on public.partner_shares;
create policy "own partner shares" on public.partner_shares
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop trigger if exists partner_shares_updated_at on public.partner_shares;
create trigger partner_shares_updated_at
  before update on public.partner_shares
  for each row execute procedure public.set_updated_at();
