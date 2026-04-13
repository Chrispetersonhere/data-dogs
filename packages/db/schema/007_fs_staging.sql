-- Day 23: SEC financial statement dataset staging (raw/staging separated)

create table if not exists sec_fs_dataset_raw (
  raw_checksum_sha256 text primary key,
  dataset_name text not null,
  source_url text not null,
  period_start date not null,
  period_end date not null,
  period_type text not null,
  parser_version text not null,
  fetch_timestamp timestamptz not null,
  payload_json jsonb not null
);

create table if not exists sec_fs_statement_staging (
  staging_id bigserial primary key,
  dataset_name text not null,
  issuer_cik text not null,
  statement_code text not null,
  line_item text not null,
  amount numeric,
  unit text,
  period_start date not null,
  period_end date not null,
  period_type text not null,
  raw_checksum_sha256 text not null references sec_fs_dataset_raw(raw_checksum_sha256),
  inserted_at timestamptz not null default now(),
  unique (dataset_name, issuer_cik, statement_code, line_item, period_start, period_end)
);

create index if not exists sec_fs_statement_staging_period_idx
  on sec_fs_statement_staging (issuer_cik, period_end, period_start);

create index if not exists sec_fs_statement_staging_raw_checksum_idx
  on sec_fs_statement_staging (raw_checksum_sha256);
