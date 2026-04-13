-- Day 16: security master separated from issuer master

create table if not exists security_master (
  security_id text primary key,
  issuer_id text not null references issuer_master(issuer_id) on delete cascade,
  security_key text not null unique,
  security_type text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists security_listing (
  security_id text not null references security_master(security_id) on delete cascade,
  venue_code text not null,
  listing_symbol text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  primary key (security_id, venue_code, listing_symbol, effective_from)
);

create index if not exists security_listing_active_idx
  on security_listing (security_id, venue_code, listing_symbol)
  where effective_to is null;
