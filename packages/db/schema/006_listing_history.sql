-- Day 18: listing and exchange history with effective dating

create table if not exists listing_history (
  security_id text not null references security_master(security_id) on delete cascade,
  venue_code text not null,
  listing_symbol text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  recorded_at timestamptz not null,
  primary key (security_id, venue_code, listing_symbol, effective_from)
);

create index if not exists listing_history_security_effective_idx
  on listing_history (security_id, effective_from);

create index if not exists listing_history_active_idx
  on listing_history (security_id)
  where effective_to is null;
