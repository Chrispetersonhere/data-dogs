-- Day 24: note/disclosure artifact staging (raw artifacts + explicit linkage)

create table if not exists sec_note_artifact_raw (
  artifact_checksum_sha256 text primary key,
  filing_accession text not null,
  issuer_cik text not null,
  note_type text not null,
  source_uri text not null,
  parser_version text not null,
  discovered_at timestamptz not null,
  content_json jsonb not null
);

create table if not exists sec_note_artifact_link_staging (
  link_id bigserial primary key,
  artifact_checksum_sha256 text not null references sec_note_artifact_raw(artifact_checksum_sha256),
  filing_accession text not null,
  issuer_cik text not null,
  linked_at timestamptz not null default now(),
  unique (artifact_checksum_sha256, filing_accession, issuer_cik)
);

create index if not exists sec_note_artifact_link_filing_idx
  on sec_note_artifact_link_staging (filing_accession, issuer_cik);

create index if not exists sec_note_artifact_raw_source_idx
  on sec_note_artifact_raw (issuer_cik, note_type, discovered_at);
