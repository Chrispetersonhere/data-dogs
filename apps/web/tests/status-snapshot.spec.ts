import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeSnapshot,
  formatLatestIngest,
} from '../lib/status/snapshot';

const NOW = new Date('2026-05-03T16:00:00.000Z');

test('computeSnapshot has the expected top-level shape', () => {
  const s = computeSnapshot(NOW);
  assert.equal(s.generatedAt, NOW.toISOString());
  assert.ok(typeof s.latestIngestAt === 'string');
  assert.ok(typeof s.medianLatencySeconds === 'number');
  assert.ok(typeof s.p95LatencySeconds === 'number');
  assert.ok(s.medianLatencySeconds <= s.p95LatencySeconds, 'p50 ≤ p95');
});

test('computeSnapshot jobsLast24h totals are consistent', () => {
  const { jobsLast24h } = computeSnapshot(NOW);
  assert.ok(jobsLast24h.finished + jobsLast24h.failed <= jobsLast24h.total);
  assert.ok(jobsLast24h.total > 0);
});

test('computeSnapshot covers the headline form types', () => {
  const { formTypeFreshness } = computeSnapshot(NOW);
  const forms = formTypeFreshness.map((f) => f.form);
  for (const required of ['10-K', '10-Q', '8-K', 'DEF 14A', '4']) {
    assert.ok(forms.includes(required), `missing form ${required}`);
  }
});

test('computeSnapshot form-type timestamps are all in the past', () => {
  const { formTypeFreshness } = computeSnapshot(NOW);
  for (const row of formTypeFreshness) {
    assert.ok(
      new Date(row.lastIngestAt).getTime() <= NOW.getTime(),
      `${row.form} lastIngestAt is not in the past`,
    );
    assert.ok(row.pendingCount >= 0);
  }
});

test('computeSnapshot recent jobs are well-formed', () => {
  const { recentJobs } = computeSnapshot(NOW);
  assert.equal(recentJobs.length, 10);
  for (const job of recentJobs) {
    assert.ok(/^ingest-[0-9a-f]{4}-[0-9a-f]{4}$/.test(job.jobId), job.jobId);
    assert.ok(['finished', 'running', 'failed'].includes(job.state));
    assert.ok(new Date(job.startedAt).getTime() <= NOW.getTime());
    if (job.state === 'running') {
      assert.equal(job.finishedAt, null);
      assert.equal(job.durationSeconds, null);
    } else {
      assert.ok(job.finishedAt !== null);
      assert.ok((job.durationSeconds ?? 0) > 0);
    }
  }
});

test('computeSnapshot is deterministic for the same now', () => {
  const a = computeSnapshot(NOW);
  const b = computeSnapshot(NOW);
  assert.deepEqual(a, b);
});

test('formatLatestIngest: < 90s renders as Ns ago', () => {
  const ts = new Date(NOW.getTime() - 30_000).toISOString();
  assert.equal(formatLatestIngest(ts, { now: NOW }), '30s ago');
});

test('formatLatestIngest: < 60min renders as Nm ago', () => {
  const ts = new Date(NOW.getTime() - 12 * 60 * 1000).toISOString();
  assert.equal(formatLatestIngest(ts, { now: NOW }), '12m ago');
});

test('formatLatestIngest: > 60min renders as HH:MM TZ', () => {
  const ts = new Date(NOW.getTime() - 4 * 60 * 60 * 1000).toISOString();
  // NOW is 16:00:00Z, minus 4h = 12:00:00Z
  assert.equal(formatLatestIngest(ts, { now: NOW }), '12:00 ET');
});

test('formatLatestIngest: respects timezoneLabel override', () => {
  const ts = new Date(NOW.getTime() - 4 * 60 * 60 * 1000).toISOString();
  assert.equal(
    formatLatestIngest(ts, { now: NOW, timezoneLabel: 'UTC' }),
    '12:00 UTC',
  );
});
