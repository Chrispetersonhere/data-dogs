-- 001_initial.sql
-- Initial schema for issuer + filing provenance-safe ingestion and parsing lineage.

BEGIN;

CREATE TABLE ingestion_job (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issuer (
  id BIGSERIAL PRIMARY KEY,
  cik TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  ticker TEXT,
  exchange TEXT,
  country_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_url TEXT,
  source_accessed_at TIMESTAMPTZ,
  provenance_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE filing (
  id BIGSERIAL PRIMARY KEY,
  issuer_id BIGINT NOT NULL REFERENCES issuer(id) ON DELETE RESTRICT,
  accession_number TEXT NOT NULL UNIQUE,
  filing_type TEXT NOT NULL,
  filing_date DATE,
  period_end_date DATE,
  accepted_at TIMESTAMPTZ,
  sec_filing_url TEXT,
  source_url TEXT NOT NULL,
  source_accessed_at TIMESTAMPTZ NOT NULL,
  ingestion_job_id BIGINT REFERENCES ingestion_job(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE filing_document (
  id BIGSERIAL PRIMARY KEY,
  filing_id BIGINT NOT NULL REFERENCES filing(id) ON DELETE CASCADE,
  document_type TEXT,
  sequence_number TEXT,
  file_name TEXT,
  document_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NOT NULL,
  source_accessed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (filing_id, document_url)
);

CREATE TABLE raw_artifact (
  id BIGSERIAL PRIMARY KEY,
  filing_id BIGINT REFERENCES filing(id) ON DELETE SET NULL,
  filing_document_id BIGINT REFERENCES filing_document(id) ON DELETE SET NULL,
  ingestion_job_id BIGINT REFERENCES ingestion_job(id) ON DELETE SET NULL,
  artifact_kind TEXT NOT NULL,
  source_url TEXT NOT NULL,
  accession_number TEXT,
  fetched_at TIMESTAMPTZ NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  content_type TEXT,
  byte_size BIGINT,
  storage_uri TEXT NOT NULL,
  parser_version TEXT,
  parser_name TEXT,
  parser_job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (checksum_sha256),
  UNIQUE (source_url, fetched_at)
);

CREATE TABLE parser_run (
  id BIGSERIAL PRIMARY KEY,
  ingestion_job_id BIGINT REFERENCES ingestion_job(id) ON DELETE SET NULL,
  raw_artifact_id BIGINT NOT NULL REFERENCES raw_artifact(id) ON DELETE CASCADE,
  parser_name TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  parser_job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parser_name, parser_job_id)
);

CREATE INDEX idx_ingestion_job_status ON ingestion_job(status);
CREATE INDEX idx_issuer_ticker ON issuer(ticker);
CREATE INDEX idx_filing_issuer_id ON filing(issuer_id);
CREATE INDEX idx_filing_type_date ON filing(filing_type, filing_date DESC);
CREATE INDEX idx_filing_ingestion_job_id ON filing(ingestion_job_id);
CREATE INDEX idx_filing_document_filing_id ON filing_document(filing_id);
CREATE INDEX idx_raw_artifact_filing_id ON raw_artifact(filing_id);
CREATE INDEX idx_raw_artifact_filing_document_id ON raw_artifact(filing_document_id);
CREATE INDEX idx_raw_artifact_ingestion_job_id ON raw_artifact(ingestion_job_id);
CREATE INDEX idx_raw_artifact_accession_number ON raw_artifact(accession_number);
CREATE INDEX idx_parser_run_raw_artifact_id ON parser_run(raw_artifact_id);
CREATE INDEX idx_parser_run_ingestion_job_id ON parser_run(ingestion_job_id);
CREATE INDEX idx_parser_run_status ON parser_run(status);

COMMIT;
