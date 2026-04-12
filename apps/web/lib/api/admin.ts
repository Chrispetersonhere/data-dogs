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

const JOBS: AdminJob[] = [
  {
    id: 'job-2026-04-11-xbrl-001',
    state: 'failed',
    parser: 'xbrl',
    startedAt: '2026-04-11T09:13:00Z',
    finishedAt: '2026-04-11T09:14:22Z',
  },
  {
    id: 'job-2026-04-11-proxy-002',
    state: 'running',
    parser: 'proxy',
    startedAt: '2026-04-11T09:40:00Z',
  },
  {
    id: 'job-2026-04-11-sec-003',
    state: 'completed',
    parser: 'sec',
    startedAt: '2026-04-11T08:05:00Z',
    finishedAt: '2026-04-11T08:22:10Z',
  },
  {
    id: 'job-2026-04-11-xbrl-004',
    state: 'queued',
    parser: 'xbrl',
    startedAt: '2026-04-11T10:15:00Z',
  },
];

const FAILED_ARTIFACTS: FailedArtifact[] = [
  {
    artifactPath: 'raw/sec/submissions/0000320193/0000320193-26-000040.json',
    sourceUrl: 'https://data.sec.gov/submissions/CIK0000320193.json',
    accession: '0000320193-26-000040',
    fetchTimestamp: '2026-04-11T09:13:29Z',
    checksum: 'sha256:3f5b2f0cdd3f06ca9d6ca53c6d8db6d532f4e9c4579b271e0278f1118da6b8f1',
    parserVersion: 'xbrl-1.12.0',
    jobId: 'job-2026-04-11-xbrl-001',
    parser: 'xbrl',
    errorCode: 'MISSING_CONTEXT',
    errorMessage: 'XBRL contextRef missing for fact us-gaap:AssetsCurrent.',
  },
  {
    artifactPath: 'raw/sec/companyfacts/0000789019/0000789019-26-000012.json',
    sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000789019.json',
    accession: '0000789019-26-000012',
    fetchTimestamp: '2026-04-11T09:13:41Z',
    checksum: 'sha256:2b4fbc6050b9709c4668fd13031f24e6c070780af7a60f7f8606fd2e6cb2f5d7',
    parserVersion: 'xbrl-1.12.0',
    jobId: 'job-2026-04-11-xbrl-001',
    parser: 'xbrl',
    errorCode: 'INVALID_DECIMAL',
    errorMessage: 'Numeric field could not be parsed as decimal for unit USD.',
  },
  {
    artifactPath: 'raw/sec/proxy/0001018724/0001018724-26-000066.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000066/def14a.htm',
    accession: '0001018724-26-000066',
    fetchTimestamp: '2026-04-11T09:40:17Z',
    checksum: 'sha256:78f9f3345f95af97af7ddc2f736f67c19486310cf6d96e1e90f2fed4ce89c086',
    parserVersion: 'proxy-0.9.4',
    jobId: 'job-2026-04-11-proxy-002',
    parser: 'proxy',
    errorCode: 'TABLE_PARSE_ERROR',
    errorMessage: 'Unable to parse compensation table rows due to merged cells.',
  },
];

export type AdminQaFilters = {
  jobId?: string;
  parser?: string;
};

export async function getAdminJobs(): Promise<AdminJob[]> {
  return JOBS;
}

export async function getFailedArtifacts(filters: AdminQaFilters = {}): Promise<FailedArtifact[]> {
  return FAILED_ARTIFACTS.filter((artifact) => {
    const matchesJob = filters.jobId ? artifact.jobId === filters.jobId : true;
    const matchesParser = filters.parser ? artifact.parser === filters.parser : true;
    return matchesJob && matchesParser;
  });
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
