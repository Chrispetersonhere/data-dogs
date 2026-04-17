import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildErrorBoundaryLog,
  buildHealthStatus,
  buildLogEntry,
  buildObservabilityContext,
  HEALTHCHECK_PATH,
  resolveRequestId,
  serializeLogEntry,
  toErrorBoundaryPayload,
} from './index';

test('health check path and payload are stable', () => {
  assert.equal(HEALTHCHECK_PATH, '/healthz');

  const status = buildHealthStatus(new Date('2026-04-17T00:00:00.000Z'));
  assert.deepEqual(status, {
    ok: true,
    service: 'web',
    timestamp: '2026-04-17T00:00:00.000Z',
  });
});

test('structured logs include request id and job id', () => {
  const context = {
    requestId: 'req-1',
    jobId: 'job-1',
  };

  const entry = buildLogEntry(context, {
    event: 'api.request',
    level: 'info',
    message: 'handled request',
  });

  const payload = JSON.parse(serializeLogEntry(entry)) as Record<string, unknown>;
  assert.equal(payload.requestId, 'req-1');
  assert.equal(payload.jobId, 'job-1');
  assert.equal(payload.event, 'api.request');
});

test('request id is synthesized when header is missing', () => {
  const requestId = resolveRequestId(undefined, () => 'generated-request-id');
  assert.equal(requestId, 'generated-request-id');

  const headers = new Headers();
  headers.set('x-job-id', 'job-42');

  const context = buildObservabilityContext(headers);
  assert.equal(context.jobId, 'job-42');
  assert.ok(context.requestId.length > 0);
});

test('error boundary log includes ids', () => {
  const log = buildErrorBoundaryLog(new Error('boom'), { requestId: 'req-99', jobId: 'job-99' });
  const payload = JSON.parse(log) as Record<string, unknown>;

  assert.equal(payload.requestId, 'req-99');
  assert.equal(payload.jobId, 'job-99');
  assert.equal(payload.event, 'ui.error_boundary');
});

test('error boundary payload/log handle unknown errors consistently', () => {
  const context = { requestId: 'req-unknown' };
  const payload = toErrorBoundaryPayload('boom', context);

  assert.equal(payload.message, 'Unexpected error');
  assert.equal(payload.requestId, 'req-unknown');

  const log = buildErrorBoundaryLog('boom', context);
  const logPayload = JSON.parse(log) as Record<string, unknown>;

  assert.equal(logPayload.message, 'Unexpected error');
  assert.deepEqual(logPayload.details, { name: 'UnknownError' });
});

