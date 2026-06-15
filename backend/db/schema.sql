create extension if not exists pgcrypto;

create table if not exists countries (
  country_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_discord_id text,
  allies text[] not null default '{}',
  enemies text[] not null default '{}'
);

create table if not exists players (
  discord_id text primary key,
  username text not null,
  country_id uuid references countries(country_id) on delete set null,
  role text not null default 'soldier' check (role in ('leader', 'officer', 'soldier'))
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'countries_leader_fk'
  ) then
    alter table countries
      add constraint countries_leader_fk
      foreign key (leader_discord_id) references players(discord_id)
      deferrable initially deferred;
  end if;
end $$;

create table if not exists units (
  unit_id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(country_id) on delete cascade,
  type text not null check (type in ('infantry', 'tank', 'jet', 'heli', 'ship', 'aa', 'artillery')),
  assigned_player text references players(discord_id) on delete set null,
  health integer not null default 100,
  lat double precision not null,
  lng double precision not null
);

create table if not exists movement_orders (
  order_id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(unit_id) on delete cascade,
  start_lat double precision not null,
  start_lng double precision not null,
  end_lat double precision not null,
  end_lng double precision not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'active' check (status in ('active', 'complete', 'cancelled'))
);

create table if not exists join_requests (
  request_id uuid primary key default gen_random_uuid(),
  discord_id text not null references players(discord_id) on delete cascade,
  country_id uuid not null references countries(country_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied'))
);

create index if not exists units_country_idx on units(country_id);
create index if not exists movement_orders_unit_status_idx on movement_orders(unit_id, status);
