import {
  PageContainer,
  SectionHeader,
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@data-dogs/ui';

import {
  formatLatestIngest,
  getStatusSnapshot,
  type IngestJobState,
} from '../../lib/status/snapshot';

import styles from './page.module.css';

export const metadata = {
  title: 'Ingest status — Ibis',
  description:
    'Live SEC EDGAR ingest freshness, latency and per-form-type coverage for the Ibis data platform.',
};

const STATE_LABEL: Record<IngestJobState, string> = {
  finished: 'Finished',
  running: 'Running',
  failed: 'Failed',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function formatRelative(iso: string, now: Date): string {
  const ageSeconds = Math.max(
    0,
    Math.round((now.getTime() - new Date(iso).getTime()) / 1000),
  );
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  if (ageSeconds < 60 * 60) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 60 * 60 * 24)
    return `${Math.floor(ageSeconds / (60 * 60))}h ago`;
  return `${Math.floor(ageSeconds / (60 * 60 * 24))}d ago`;
}

export default async function StatusPage() {
  const snapshot = await getStatusSnapshot();
  const now = new Date(snapshot.generatedAt);

  const finishedShare =
    snapshot.jobsLast24h.total === 0
      ? 0
      : Math.round((snapshot.jobsLast24h.finished / snapshot.jobsLast24h.total) * 1000) /
        10;

  const overallHealthy = snapshot.jobsLast24h.failed === 0;

  return (
    <PageContainer maxWidth="1100px">
      <main id="main-content" className={styles.pageMain}>
        <header className={styles.heroHeader}>
          <p className={styles.heroEyebrow}>System status</p>
          <h1 className={styles.heroTitle}>Ingest pipeline</h1>
          <p className={styles.heroSubtitle}>
            Real-time freshness, latency and job state for the SEC EDGAR ingest pipeline
            that powers every fact you see in the product.
          </p>
        </header>

        <section
          aria-label="Overall health"
          className={
            overallHealthy ? styles.healthBanner : styles.healthBannerWarn
          }
        >
          <span
            aria-hidden="true"
            className={
              overallHealthy ? styles.healthDot : styles.healthDotWarn
            }
          />
          <p className={styles.healthText}>
            {overallHealthy
              ? 'All systems normal — no failed jobs in the last 24h.'
              : `${snapshot.jobsLast24h.failed} failed job${
                  snapshot.jobsLast24h.failed === 1 ? '' : 's'
                } in the last 24h. Operators paged.`}
          </p>
          <span className={styles.healthMetaTag}>
            generated {formatRelative(snapshot.generatedAt, now)}
          </span>
        </section>

        <section aria-label="Headline metrics" className={styles.statGrid}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Latest ingest</p>
            <p className={styles.statValue}>
              {formatLatestIngest(snapshot.latestIngestAt, { now })}
            </p>
            <p className={styles.statDelta}>
              {new Date(snapshot.latestIngestAt).toISOString()}
            </p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Median ingest latency</p>
            <p className={styles.statValue}>{snapshot.medianLatencySeconds}s</p>
            <p className={styles.statDelta}>
              SEC accept → queryable fact, p50 over the last 24h.
            </p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>p95 ingest latency</p>
            <p className={styles.statValue}>{snapshot.p95LatencySeconds}s</p>
            <p className={styles.statDelta}>Worst case over the same window.</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Jobs last 24h</p>
            <p className={styles.statValue}>
              {snapshot.jobsLast24h.finished}
              <span className={styles.statValueDenom}>
                /{snapshot.jobsLast24h.total}
              </span>
            </p>
            <p className={styles.statDelta}>
              {finishedShare.toFixed(1)}% finished · {snapshot.jobsLast24h.failed} failed
            </p>
          </article>
        </section>

        <hr className={styles.sectionDivider} />

        <section aria-label="Per-form freshness">
          <SectionHeader
            title="Form-type freshness"
            subtitle="Most recent ingest by SEC form type, plus how many filings are still in flight."
          />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Form</th>
                  <th scope="col">Last ingest</th>
                  <th scope="col">Age</th>
                  <th scope="col" className={styles.tableNumCol}>
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.formTypeFreshness.map((row) => (
                  <tr key={row.form}>
                    <th scope="row" className={styles.formCell}>
                      {row.form}
                    </th>
                    <td className={styles.tsCell}>{row.lastIngestAt}</td>
                    <td className={styles.relCell}>
                      {formatRelative(row.lastIngestAt, now)}
                    </td>
                    <td className={styles.tableNumCol}>{row.pendingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        <section aria-label="Recent jobs">
          <SectionHeader
            title="Recent jobs"
            subtitle="Latest ten ingestion runs across submissions, companyfacts, frames, XBRL and proxy parsers."
          />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Job ID</th>
                  <th scope="col">Pipeline</th>
                  <th scope="col">State</th>
                  <th scope="col">Started</th>
                  <th scope="col" className={styles.tableNumCol}>
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentJobs.map((job) => (
                  <tr key={job.jobId}>
                    <th scope="row" className={styles.idCell}>
                      {job.jobId}
                    </th>
                    <td>{job.jobName}</td>
                    <td>
                      <span
                        className={`${styles.stateChip} ${
                          job.state === 'finished'
                            ? styles.stateOk
                            : job.state === 'running'
                              ? styles.stateRunning
                              : styles.stateFailed
                        }`}
                      >
                        {STATE_LABEL[job.state]}
                      </span>
                    </td>
                    <td className={styles.relCell}>
                      {formatRelative(job.startedAt, now)}
                    </td>
                    <td className={styles.tableNumCol}>
                      {formatDuration(job.durationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className={styles.fineprint}>
          Status payload available at{' '}
          <a className={styles.fineprintLink} href="/api/v1/status">
            <code>GET /api/v1/status</code>
          </a>
          {' '}— same shape, JSON. Updates every 60 seconds.
        </p>

        <section
          aria-label="Final call to action"
          style={{
            marginTop: spacingTokens['8'],
            padding: `${spacingTokens['8']} ${spacingTokens['6']}`,
            textAlign: 'center',
            background: colorTokens.surface.elevated,
            border: `1px solid ${colorTokens.border.subtle}`,
            borderRadius: radiusTokens.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: typographyTokens.fontSize['2xl'],
              fontWeight: typographyTokens.fontWeight.semibold,
              color: colorTokens.text.primary,
            }}
          >
            Build on this
          </h2>
          <p
            style={{
              margin: `${spacingTokens['3']} auto 0`,
              maxWidth: '40rem',
              fontSize: typographyTokens.fontSize.md,
              color: colorTokens.text.secondary,
            }}
          >
            Every figure you cite from Ibis carries six fields of provenance — source URL,
            accession, fetch timestamp, checksum, parser version and job ID. Open the API
            docs or start a 14-day trial.
          </p>
        </section>
      </main>
    </PageContainer>
  );
}
