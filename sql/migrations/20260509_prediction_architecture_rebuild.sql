-- Prediction architecture rebuild: normalized access + match management

alter table predictions
  drop constraint if exists predictions_tier_check;

alter table predictions
  add column if not exists slug text unique,
  add column if not exists access_level text not null default 'paid',
  add column if not exists publish_state text not null default 'published',
  add column if not exists result_status text not null default 'pending',
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_locked boolean not null default true;

alter table predictions
  add constraint predictions_tier_check check (tier in ('single','combo','fixed_draw','premium'));

create table if not exists prediction_matches (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
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

create table if not exists prediction_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id uuid not null references predictions(id) on delete cascade,
  source text not null check (source in ('purchase','subscription','admin_unlock')),
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id,prediction_id,source)
);

create table if not exists prediction_codes (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  bookmaker text not null,
  booking_code text not null,
  created_at timestamptz not null default now(),
  unique(prediction_id,bookmaker)
);

create table if not exists prediction_status (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  status text not null check (status in ('pending','won','lost','void')),
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  notes text
);

create table if not exists purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id uuid references predictions(id) on delete set null,
  tier text not null check (tier in ('single','combo','fixed_draw','premium')),
  amount_ghs numeric(10,2) not null,
  currency text not null default 'GHS',
  reference text not null unique,
  status text not null check (status in ('successful','failed','refunded')),
  created_at timestamptz not null default now()
);

create unique index if not exists prediction_access_user_prediction_source_idx
  on prediction_access(user_id, prediction_id, source);

alter table if exists purchases
  add column if not exists prediction_id uuid references predictions(id) on delete set null;

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);
