import { getProvenanceLedgerRows } from '../db/provenance';

export type AdminJobState = 'queued' | 'running' | 'failed' | 'completed';

export type AdminJob = {
  id: string;
  state: AdminJobState;
  parser: 'xbrl' | 'proxy' | 'sec';
  startedAt: string;
  finishedAt?: string;
};

export type FailedArtifact = {
  artifactPath: string;
  sourceUrl: string;
  accession: string;
  fetchTimestamp: string;
  checksum: string;
  parserVersion: string;
  jobId: string;
  parser: 'xbrl' | 'proxy' | 'sec';
  errorCode: string;
  errorMessage: string;
};

export type ParserFailureSummary = {
  parser: 'xbrl' | 'proxy' | 'sec';
  failures: number;
};

export type AdminQaFilters = {
  jobId?: string;
  parser?: string;
};

function mapParser(parserVersion: string): 'xbrl' | 'proxy' | 'sec' {
  const normalized = parserVersion.toLowerCase();

  if (normalized.includes('proxy')) {
    return 'proxy';
  }

  if (normalized.includes('xbrl')) {
    return 'xbrl';
  }

  return 'sec';
}

function mapJobState(status: string): AdminJobState {
  const normalized = status.toLowerCase();

  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'failed';
  }

  if (normalized.includes('run') || normalized.includes('process')) {
    return 'running';
  }

  if (normalized.includes('queue') || normalized.includes('pending')) {
    return 'queued';
  }

  return 'completed';
}

function artifactPathFromSourceUrl(sourceUrl: string, accession: string): string {
  const withoutProtocol = sourceUrl.replace(/^[a-z]+:\/\//i, '');
  const firstSlash = withoutProtocol.indexOf('/');

  if (firstSlash === -1) {
    return accession;
  }

  const path = withoutProtocol.slice(firstSlash + 1);
  return path.length > 0 ? path : accession;
}

export async function getAdminJobs(): Promise<AdminJob[]> {
  const rows = await getProvenanceLedgerRows();

  const byJob = rows.reduce<Record<string, AdminJob>>((acc, row) => {
    const state = mapJobState(row.status);
    const parser = mapParser(row.parserVersion);

    if (!acc[row.jobId]) {
      acc[row.jobId] = {
        id: row.jobId,
        state,
        parser,
        startedAt: row.fetchTimestamp,
        finishedAt: state === 'running' || state === 'queued' ? undefined : row.fetchTimestamp,
      };
      return acc;
    }

    const existing = acc[row.jobId];
    if (row.fetchTimestamp < existing.startedAt) {
      existing.startedAt = row.fetchTimestamp;
    }

    if (state === 'failed') {
      existing.state = 'failed';
      existing.finishedAt = row.fetchTimestamp;
    } else if (existing.state !== 'failed' && (state === 'running' || state === 'queued')) {
      existing.state = state;
      existing.finishedAt = undefined;
    } else if (existing.state !== 'failed') {
      existing.state = 'completed';
      if (!existing.finishedAt || row.fetchTimestamp > existing.finishedAt) {
        existing.finishedAt = row.fetchTimestamp;
      }
    }

    return acc;
  }, {});

  return Object.values(byJob).sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export async function getFailedArtifacts(filters: AdminQaFilters = {}): Promise<FailedArtifact[]> {
  const rows = await getProvenanceLedgerRows();

  return rows
    .map((row) => ({
      row,
      state: mapJobState(row.status),
      parser: mapParser(row.parserVersion),
    }))
    .filter(({ row, state, parser }) => {
      if (state !== 'failed') {
        return false;
      }

      const matchesJob = filters.jobId ? row.jobId === filters.jobId : true;
      const matchesParser = filters.parser ? parser === filters.parser : true;
      return matchesJob && matchesParser;
    })
    .map(({ row, parser }) => ({
      artifactPath: artifactPathFromSourceUrl(row.sourceUrl, row.accession),
      sourceUrl: row.sourceUrl,
      accession: row.accession,
      fetchTimestamp: row.fetchTimestamp,
      checksum: row.checksum,
      parserVersion: row.parserVersion,
      jobId: row.jobId,
      parser,
      errorCode: 'PARSER_FAILED',
      errorMessage: `Ledger status: ${row.status}`,
    }))
    .sort((left, right) => right.fetchTimestamp.localeCompare(left.fetchTimestamp));
}

export async function getParserFailureSummary(
  filters: AdminQaFilters = {},
): Promise<ParserFailureSummary[]> {
  const filtered = await getFailedArtifacts(filters);
  const counts = filtered.reduce<Record<string, number>>((acc, artifact) => {
    acc[artifact.parser] = (acc[artifact.parser] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([parser, failures]) => ({ parser: parser as ParserFailureSummary['parser'], failures }))
    .sort((left, right) => right.failures - left.failures);
}
