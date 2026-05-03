import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

// Each spec file uses its own tmp dir so JSONL writes don't collide.
process.env.FUNNEL_STORAGE_DIR = mkdtempSync(
  join(tmpdir(), 'ibis-signup-spec-'),
);

import {
  buildSignupRequest,
  clearSignupRequestsForTest,
  parseSignupPayload,
  readSignupRequests,
  recordSignupRequest,
  SignupValidationError,
} from '../app/api/v1/signup/helpers';

test('parseSignupPayload accepts a well-formed payload', () => {
  const parsed = parseSignupPayload({
    email: 'jane@firm.com',
    name: 'Jane Smith',
    company: 'Capital Partners',
    useCase: 'long-only equity research',
    plan: 'researcher',
  });
  assert.equal(parsed.email, 'jane@firm.com');
  assert.equal(parsed.plan, 'researcher');
});

test('parseSignupPayload rejects non-object body', () => {
  assert.throws(() => parseSignupPayload('hello' as unknown), SignupValidationError);
  assert.throws(() => parseSignupPayload(null as unknown), SignupValidationError);
});

test('parseSignupPayload rejects malformed email', () => {
  assert.throws(
    () =>
      parseSignupPayload({
        email: 'not-an-email',
        name: 'A',
        company: 'B',
        plan: 'researcher',
      }),
    SignupValidationError,
  );
});

test('parseSignupPayload rejects missing required fields', () => {
  for (const field of ['email', 'name', 'company', 'plan']) {
    const base: Record<string, string> = {
      email: 'jane@firm.com',
      name: 'Jane',
      company: 'Acme',
      plan: 'researcher',
    };
    delete base[field];
    assert.throws(
      () => parseSignupPayload(base),
      SignupValidationError,
      `should reject when ${field} is missing`,
    );
  }
});

test('parseSignupPayload rejects unsupported plan', () => {
  assert.throws(
    () =>
      parseSignupPayload({
        email: 'jane@firm.com',
        name: 'Jane',
        company: 'Acme',
        plan: 'enterprise',
      }),
    SignupValidationError,
  );
});

test('parseSignupPayload trims whitespace and treats blank as missing', () => {
  assert.throws(
    () =>
      parseSignupPayload({
        email: '   ',
        name: 'Jane',
        company: 'Acme',
        plan: 'researcher',
      }),
    SignupValidationError,
  );
});

test('parseSignupPayload allows useCase to be optional', () => {
  const parsed = parseSignupPayload({
    email: 'jane@firm.com',
    name: 'Jane',
    company: 'Acme',
    plan: 'team',
  });
  assert.equal(parsed.useCase, '');
});

test('buildSignupRequest stamps receivedAt', () => {
  const record = buildSignupRequest(
    {
      email: 'jane@firm.com',
      name: 'Jane',
      company: 'Acme',
      useCase: '',
      plan: 'researcher',
    },
    '2026-05-03T12:00:00Z',
  );
  assert.equal(record.receivedAt, '2026-05-03T12:00:00Z');
});

test('recordSignupRequest persists across read calls', async () => {
  await clearSignupRequestsForTest();
  await recordSignupRequest({
    email: 'jane@firm.com',
    name: 'Jane',
    company: 'Acme',
    useCase: '',
    plan: 'researcher',
    receivedAt: '2026-05-03T12:00:00Z',
  });
  const rows = await readSignupRequests();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'jane@firm.com');
  await clearSignupRequestsForTest();
});

test('recordSignupRequest appends multiple records in order', async () => {
  await clearSignupRequestsForTest();
  for (const email of ['a@firm.com', 'b@firm.com', 'c@firm.com']) {
    await recordSignupRequest({
      email,
      name: 'Person',
      company: 'Acme',
      useCase: '',
      plan: 'researcher',
      receivedAt: new Date().toISOString(),
    });
  }
  const rows = await readSignupRequests();
  assert.deepEqual(
    rows.map((r) => r.email),
    ['a@firm.com', 'b@firm.com', 'c@firm.com'],
  );
  await clearSignupRequestsForTest();
});

test('parseSignupPayload caps absurdly long inputs', () => {
  assert.throws(
    () =>
      parseSignupPayload({
        email: 'jane@firm.com',
        name: 'A'.repeat(1000),
        company: 'Acme',
        plan: 'researcher',
      }),
    SignupValidationError,
  );
});
