-- Day 17: identifier mapping layer with historical support

create table if not exists identifier_map (
  subject_type text not null check (subject_type in ('company', 'issuer', 'security')),
  subject_id text not null,
  identifier_type text not null,
  identifier_value text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  observed_at timestamptz not null,
  primary key (subject_type, subject_id, identifier_type, identifier_value, valid_from)
);

create index if not exists identifier_map_external_lookup_idx
  on identifier_map (identifier_type, identifier_value, valid_from);

create index if not exists identifier_map_external_current_idx
  on identifier_map (identifier_type, identifier_value)
  where valid_to is null;
