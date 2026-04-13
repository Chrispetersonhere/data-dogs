-- Day 15: canonical issuer master (no security master/ticker logic)

create table if not exists issuer_master (
  issuer_id text primary key,
  issuer_key text not null unique,
  current_name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists issuer_name_history (
  issuer_id text not null references issuer_master(issuer_id) on delete cascade,
  name text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  primary key (issuer_id, valid_from)
);

create index if not exists issuer_name_history_current_idx
  on issuer_name_history (issuer_id)
  where valid_to is null;
