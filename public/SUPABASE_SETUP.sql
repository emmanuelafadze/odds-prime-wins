-- ODDSPrime unified Supabase setup (run as a single script)

create extension if not exists pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin','user');
  END IF;
END $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  match_date date not null,
  kickoff time,
  league text,
  home_team text not null,
  away_team text not null,
  prediction text not null,
  odds numeric(8,2),
  tier text not null default 'single',
  status text not null check (status in ('pending','won','lost','void')) default 'pending',
  result_status text not null default 'pending',
  access_level text not null default 'paid',
  publish_state text not null default 'published',
  published boolean not null default true,
  is_locked boolean not null default true,
  sportybet_code text,
  betway_code text,
  mybet_code text,
  prediction_image_1 text,
  prediction_image_2 text,
  prediction_image_3 text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint predictions_tier_check check (tier in ('single','combo','fixed_draw','premium'))
);
alter table public.predictions enable row level security;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  prediction_id uuid references public.predictions(id) on delete set null,
  tier text not null,
  amount_ghs numeric(10,2) not null,
  reference text not null unique,
  match_date date,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;

create table if not exists public.prediction_matches (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  position int not null default 0,
  home_team text not null,
  away_team text not null,
  league text,
  kickoff_time timestamptz,
  prediction text not null,
  odds numeric(8,2),
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  bookmaker_codes jsonb not null default '{}'::jsonb,
  notes text,
  confidence int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prediction_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  source text not null check (source in ('purchase','admin_unlock')),
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id,prediction_id,source)
);
create unique index if not exists prediction_access_user_prediction_source_idx
  on public.prediction_access(user_id, prediction_id, source);

create table if not exists public.prediction_codes (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  bookmaker text not null,
  booking_code text not null,
  created_at timestamptz not null default now(),
  unique(prediction_id,bookmaker)
);

create table if not exists public.prediction_status (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  status text not null check (status in ('pending','won','lost','void')),
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  notes text
);

create table if not exists public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id uuid references public.predictions(id) on delete set null,
  tier text not null check (tier in ('single','combo','fixed_draw','premium')),
  amount_ghs numeric(10,2) not null,
  currency text not null default 'GHS',
  reference text not null unique,
  status text not null check (status in ('successful','failed','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('prediction-images', 'prediction-images', false)
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select using (auth.uid() = user_id);
drop policy if exists "admin manage roles" on public.user_roles;
create policy "admin manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

drop policy if exists "public read published predictions" on public.predictions;
create policy "public read published predictions" on public.predictions
for select using (published = true);
drop policy if exists "admin manage predictions" on public.predictions;
create policy "admin manage predictions" on public.predictions
for all using (public.has_role(auth.uid(),'admin'));

drop policy if exists "user read own purchases" on public.purchases;
create policy "user read own purchases" on public.purchases for select using (auth.uid() = user_id);
drop policy if exists "user insert own purchase" on public.purchases;
create policy "user insert own purchase" on public.purchases for insert with check (auth.uid() = user_id);
drop policy if exists "admin read all purchases" on public.purchases;
create policy "admin read all purchases" on public.purchases for select using (public.has_role(auth.uid(),'admin'));
