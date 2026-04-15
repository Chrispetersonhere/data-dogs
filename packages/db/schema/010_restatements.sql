-- Day 31: amended filing/restatement handling with immutable history and separately resolved current truth

create table if not exists xbrl_restatement_versions (
  restatement_version_id text primary key,
  issuer_cik text not null,
  fiscal_period_end date not null,
  concept text not null,
  filing_accession text not null,
  value_text text not null,
  filed_at timestamptz not null,
  supersedes_restatement_version_id text references xbrl_restatement_versions(restatement_version_id),
  recorded_at timestamptz not null,
  unique (issuer_cik, fiscal_period_end, concept, filing_accession, value_text)
);

create table if not exists xbrl_restatement_current (
  issuer_cik text not null,
  fiscal_period_end date not null,
  concept text not null,
  current_restatement_version_id text not null references xbrl_restatement_versions(restatement_version_id),
  resolved_at timestamptz not null,
  primary key (issuer_cik, fiscal_period_end, concept)
);

create index if not exists xbrl_restatement_versions_truth_idx
  on xbrl_restatement_versions (issuer_cik, fiscal_period_end, concept, recorded_at);

create index if not exists xbrl_restatement_versions_supersedes_idx
  on xbrl_restatement_versions (supersedes_restatement_version_id)
  where supersedes_restatement_version_id is not null;
