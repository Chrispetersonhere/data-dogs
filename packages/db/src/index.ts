export const DB_SCHEMA_VERSION = '001_initial';

export const CORE_TABLES = [
  'issuer',
  'filing',
  'filing_document',
  'raw_artifact',
  'ingestion_job',
  'parser_run',
] as const;

export type CoreTableName = (typeof CORE_TABLES)[number];

export const PROVENANCE_FIELDS = {
  sourceUrl: 'source_url',
  accessionNumber: 'accession_number',
  fetchedAt: 'fetched_at',
  checksumSha256: 'checksum_sha256',
  parserVersion: 'parser_version',
  parserJobId: 'parser_job_id',
  ingestionJobId: 'ingestion_job_id',
} as const;
