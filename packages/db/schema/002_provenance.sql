-- 002_provenance.sql
-- Admin provenance ledger for raw artifact inspection.

BEGIN;

CREATE VIEW provenance_ledger AS
SELECT
  ra.id AS raw_artifact_id,
  ra.source_url,
  COALESCE(ra.accession_number, f.accession_number, '') AS accession,
  ra.fetched_at AS fetch_timestamp,
  ra.checksum_sha256 AS checksum,
  COALESCE(ra.parser_version, pr.parser_version, '') AS parser_version,
  COALESCE(ra.parser_job_id, pr.parser_job_id, '') AS job_id,
  COALESCE(pr.status, ij.status, 'unknown') AS status
FROM raw_artifact ra
LEFT JOIN filing f ON f.id = ra.filing_id
LEFT JOIN LATERAL (
  SELECT parser_version, parser_job_id, status
  FROM parser_run pr
  WHERE pr.raw_artifact_id = ra.id
  ORDER BY pr.started_at DESC
  LIMIT 1
) pr ON TRUE
LEFT JOIN ingestion_job ij ON ij.id = ra.ingestion_job_id;

COMMIT;
