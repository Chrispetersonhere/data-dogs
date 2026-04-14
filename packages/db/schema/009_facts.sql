-- Day 25: normalized XBRL fact skeleton (no mapping rules yet)

create table if not exists units (
  unit_id text primary key,
  measure_code text not null unique
);

create table if not exists periods (
  period_id text primary key,
  period_start date not null,
  period_end date not null,
  unique (period_start, period_end)
);

create table if not exists xbrl_fact_raw (
  raw_fact_id text primary key,
  source_filing_accession text not null,
  source_concept text not null,
  source_fact_key text not null,
  unit_id text not null references units(unit_id),
  period_id text not null references periods(period_id),
  value_text text not null,
  captured_at timestamptz not null,
  unique (source_filing_accession, source_fact_key, source_concept, unit_id, period_id)
);

create table if not exists xbrl_fact_normalized (
  normalized_fact_id text primary key,
  raw_fact_id text not null unique references xbrl_fact_raw(raw_fact_id),
  source_filing_accession text not null,
  source_concept text not null,
  unit_id text not null references units(unit_id),
  period_id text not null references periods(period_id),
  normalized_concept text,
  normalized_value_text text,
  normalization_status text not null,
  normalized_at timestamptz not null
);

create index if not exists xbrl_fact_raw_source_idx
  on xbrl_fact_raw (source_filing_accession, source_concept);

create index if not exists xbrl_fact_normalized_status_idx
  on xbrl_fact_normalized (normalization_status, source_filing_accession);
