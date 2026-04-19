-- Day 65: insider dataset schema with raw + normalized separation and strict source traceability.

create table if not exists raw_insider_artifact (
  raw_insider_artifact_id text primary key,
  dataset_name text not null,
  source_url text not null,
  source_accession text not null,
  issuer_cik text,
  checksum_sha256 text not null unique,
  parser_version text not null,
  ingest_job_id text not null,
  fetched_at timestamptz not null,
  payload_json text not null
);

create table if not exists insider (
  insider_id text primary key,
  issuer_cik text not null,
  insider_cik text,
  insider_full_name text not null,
  is_director boolean not null default false,
  is_officer boolean not null default false,
  is_ten_percent_owner boolean not null default false,
  is_other_reporter boolean not null default false,
  officer_title text,
  recorded_at timestamptz not null,
  unique (issuer_cik, insider_full_name, insider_cik)
);

create table if not exists insider_transaction (
  insider_transaction_id text primary key,
  insider_id text not null references insider(insider_id),
  issuer_cik text not null,
  security_ticker text,
  security_title text not null,
  transaction_date date not null,
  transaction_code text not null,
  acquired_or_disposed text not null check (acquired_or_disposed in ('A', 'D')),
  shares numeric(24, 6),
  price_per_share numeric(20, 6),
  shares_owned_after numeric(24, 6),
  ownership_form text check (ownership_form is null or ownership_form in ('D', 'I')),
  raw_insider_artifact_id text not null references raw_insider_artifact(raw_insider_artifact_id),
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (
    issuer_cik,
    insider_id,
    security_title,
    transaction_date,
    transaction_code,
    acquired_or_disposed,
    shares,
    price_per_share,
    source_accession
  )
);

create table if not exists insider_holding (
  insider_holding_id text primary key,
  insider_id text not null references insider(insider_id),
  issuer_cik text not null,
  security_ticker text,
  security_title text not null,
  shares_owned numeric(24, 6) not null,
  ownership_form text check (ownership_form is null or ownership_form in ('D', 'I')),
  as_of_date date not null,
  raw_insider_artifact_id text not null references raw_insider_artifact(raw_insider_artifact_id),
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (insider_id, security_title, as_of_date, ownership_form, source_accession)
);

create index if not exists raw_insider_artifact_by_issuer_idx
  on raw_insider_artifact (issuer_cik);

create index if not exists raw_insider_artifact_by_accession_idx
  on raw_insider_artifact (source_accession);

create index if not exists insider_by_issuer_idx
  on insider (issuer_cik);

create index if not exists insider_transaction_by_issuer_date_idx
  on insider_transaction (issuer_cik, transaction_date);

create index if not exists insider_transaction_by_insider_date_idx
  on insider_transaction (insider_id, transaction_date);

create index if not exists insider_transaction_by_ticker_date_idx
  on insider_transaction (security_ticker, transaction_date);

create index if not exists insider_holding_by_issuer_asof_idx
  on insider_holding (issuer_cik, as_of_date);
