-- Run this once in your Supabase SQL editor
create type if not exists app_role as enum ('admin','user');

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  unique(user_id, role)
);
alter table user_roles enable row level security;

create or replace function has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from user_roles where user_id=_user_id and role=_role)
$$;

drop policy if exists "read own role" on user_roles;
create policy "read own role" on user_roles for select using (auth.uid() = user_id);
drop policy if exists "admin manage roles" on user_roles;
create policy "admin manage roles" on user_roles for all using (has_role(auth.uid(),'admin'));

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  kickoff time,
  league text,
  home_team text not null,
  away_team text not null,
  prediction text not null,
  odds numeric(6,2),
  tier text not null check (tier in ('free','single','combo','five','ten','premium')) default 'free',
  status text not null check (status in ('pending','won','lost','void')) default 'pending',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table predictions enable row level security;
drop policy if exists "free readable" on predictions;
create policy "free readable" on predictions for select using (published and tier='free');
drop policy if exists "paid readable to buyers" on predictions;
create policy "paid readable to buyers" on predictions for select using (
  published and (
    tier='free'
    or has_role(auth.uid(),'admin')
    or exists(select 1 from purchases p where p.user_id=auth.uid() and (p.tier=predictions.tier or p.tier='premium') and p.expires_at > now() and p.match_date=predictions.match_date)
  )
);
drop policy if exists "admin manage predictions" on predictions;
create policy "admin manage predictions" on predictions for all using (has_role(auth.uid(),'admin'));

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tier text not null,
  amount_ghs numeric(10,2) not null,
  reference text not null unique,
  match_date date,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
alter table purchases enable row level security;
drop policy if exists "user read own purchases" on purchases;
create policy "user read own purchases" on purchases for select using (auth.uid() = user_id);
drop policy if exists "user insert own purchase" on purchases;
create policy "user insert own purchase" on purchases for insert with check (auth.uid() = user_id);
drop policy if exists "admin read all purchases" on purchases;
create policy "admin read all purchases" on purchases for select using (has_role(auth.uid(),'admin'));

-- Auto-create default user role
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
