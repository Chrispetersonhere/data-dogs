import assert from 'node:assert/strict';
import test from 'node:test';

import { GET } from '../app/healthz/route';
import { buildLogEntry, buildObservabilityContext, HEALTHCHECK_PATH } from '../lib/observability';

test('health check path is exposed and GET /healthz returns healthy payload', async () => {
  assert.equal(HEALTHCHECK_PATH, '/healthz');

  const response = GET();
  assert.equal(response.status, 200);

  const payload = (await response.json()) as Record<string, unknown>;
  assert.equal(payload.ok, true);
  assert.equal(payload.service, 'web');
  assert.equal(typeof payload.timestamp, 'string');
});

test('structured logs include request id and job id from context', () => {
  const headers = new Headers();
  headers.set('x-request-id', 'req-123');
  headers.set('x-job-id', 'job-abc');

  const context = buildObservabilityContext(headers);
  const log = buildLogEntry(context, {
    event: 'api.request',
    message: 'ok',
    level: 'info',
  });

  assert.equal(log.requestId, 'req-123');
  assert.equal(log.jobId, 'job-abc');
});
