-- ============================================================
-- Lotus Phase - Initial Schema
-- ============================================================

-- profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default 'Friend',
  avatar_seed text default 'luna',
  avg_cycle_length int default 28,
  avg_period_length int default 5,
  birth_year int,
  accent_theme text default 'rose',
  diet_preference text default 'nonveg',
  health_goal text default 'maintain',
  activity_level text,
  height int,
  weight int,
  medical_conditions text[] default '{}',
  food_allergies text[] default '{}',
  stress_level int,
  is_admin boolean default false,
  is_active boolean default true,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- cycles
create table if not exists public.cycles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  start_date date not null,
  end_date date,
  created_at timestamptz default now(),
  unique(user_id, start_date)
);

-- daily_logs
create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  flow text,
  mood text,
  symptoms text[] default '{}',
  sleep_hrs numeric,
  water_cups numeric,
  notes text,
  unique(user_id, date)
);

-- pcos_assessments
create table if not exists public.pcos_assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  answers jsonb default '{}',
  completed_at timestamptz,
  unique(user_id)
);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.cycles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.pcos_assessments enable row level security;
alter table public.chat_messages enable row level security;

-- profiles
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- cycles
drop policy if exists "own cycles" on public.cycles;
create policy "own cycles" on public.cycles
  for all using (auth.uid() = user_id);

-- daily_logs
drop policy if exists "own logs" on public.daily_logs;
create policy "own logs" on public.daily_logs
  for all using (auth.uid() = user_id);

-- pcos_assessments
drop policy if exists "own pcos" on public.pcos_assessments;
create policy "own pcos" on public.pcos_assessments
  for all using (auth.uid() = user_id);

-- chat_messages
drop policy if exists "own chat" on public.chat_messages;
create policy "own chat" on public.chat_messages
  for all using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- updated_at auto-update for profiles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
