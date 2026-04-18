-- Day 57: executive compensation schema with normalized role history and auditable compensation facts

create table if not exists executive (
  executive_id text primary key,
  issuer_cik text not null,
  person_full_name text not null,
  person_given_name text,
  person_family_name text,
  external_person_ref text,
  created_at timestamptz not null,
  unique (issuer_cik, person_full_name)
);

create table if not exists executive_role_history (
  executive_role_history_id text primary key,
  executive_id text not null references executive(executive_id),
  role_title text not null,
  role_start_date date not null,
  role_end_date date,
  is_principal_executive_officer boolean not null default false,
  is_principal_financial_officer boolean not null default false,
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (executive_id, role_title, role_start_date, source_accession),
  check (role_end_date is null or role_end_date >= role_start_date)
);

create table if not exists comp_summary (
  comp_summary_id text primary key,
  executive_id text not null references executive(executive_id),
  fiscal_year integer not null,
  summary_component_code text not null,
  summary_component_label text not null,
  amount numeric(20, 2),
  currency text not null,
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (executive_id, fiscal_year, summary_component_code, source_accession)
);

create table if not exists comp_award (
  comp_award_id text primary key,
  executive_id text not null references executive(executive_id),
  fiscal_year integer not null,
  award_type text not null,
  award_grant_date date,
  award_vest_date date,
  award_quantity numeric(24, 6),
  award_exercise_price numeric(20, 6),
  award_target_value numeric(20, 2),
  award_realized_value numeric(20, 2),
  currency text not null,
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (executive_id, fiscal_year, award_type, award_grant_date, source_accession),
  check (award_vest_date is null or award_grant_date is null or award_vest_date >= award_grant_date)
);

create table if not exists governance_fact (
  governance_fact_id text primary key,
  executive_id text references executive(executive_id),
  fiscal_year integer,
  fact_type text not null,
  fact_value_text text not null,
  effective_date date,
  source_url text not null,
  source_accession text not null,
  source_fetched_at timestamptz not null,
  source_checksum text not null,
  parser_version text not null,
  ingest_job_id text not null,
  recorded_at timestamptz not null,
  unique (executive_id, fiscal_year, fact_type, fact_value_text, source_accession)
);

create index if not exists executive_by_issuer_idx
  on executive (issuer_cik);

create index if not exists executive_role_history_asof_idx
  on executive_role_history (executive_id, role_start_date, role_end_date);

create index if not exists comp_summary_executive_year_idx
  on comp_summary (executive_id, fiscal_year);

create index if not exists comp_award_executive_year_idx
  on comp_award (executive_id, fiscal_year);

create index if not exists governance_fact_executive_year_idx
  on governance_fact (executive_id, fiscal_year);
