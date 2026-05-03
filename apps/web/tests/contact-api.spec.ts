import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

process.env.FUNNEL_STORAGE_DIR = mkdtempSync(
  join(tmpdir(), 'ibis-contact-spec-'),
);

import {
  buildContactRequest,
  clearContactRequestsForTest,
  ContactValidationError,
  parseContactPayload,
  readContactRequests,
  recordContactRequest,
} from '../app/api/v1/contact/helpers';

test('parseContactPayload accepts a well-formed payload', () => {
  const parsed = parseContactPayload({
    email: 'cio@firm.com',
    name: 'Pat Lee',
    company: 'Atlas Capital',
    topic: 'sso',
    message: 'Need Okta SAML and a private deployment.',
  });
  assert.equal(parsed.topic, 'sso');
});

test('parseContactPayload rejects unknown topics', () => {
  assert.throws(
    () =>
      parseContactPayload({
        email: 'cio@firm.com',
        name: 'Pat',
        company: 'Atlas',
        topic: 'haxxor',
        message: 'hi',
      }),
    ContactValidationError,
  );
});

test('parseContactPayload requires every key field', () => {
  for (const field of ['email', 'name', 'company', 'topic', 'message']) {
    const base: Record<string, string> = {
      email: 'cio@firm.com',
      name: 'Pat',
      company: 'Atlas',
      topic: 'pricing',
      message: 'hi',
    };
    delete base[field];
    assert.throws(
      () => parseContactPayload(base),
      ContactValidationError,
      `should reject when ${field} is missing`,
    );
  }
});

test('parseContactPayload caps message length', () => {
  assert.throws(
    () =>
      parseContactPayload({
        email: 'cio@firm.com',
        name: 'Pat',
        company: 'Atlas',
        topic: 'pricing',
        message: 'x'.repeat(5000),
      }),
    ContactValidationError,
  );
});

test('parseContactPayload rejects malformed email', () => {
  assert.throws(
    () =>
      parseContactPayload({
        email: 'not-an-email',
        name: 'Pat',
        company: 'Atlas',
        topic: 'pricing',
        message: 'hi',
      }),
    ContactValidationError,
  );
});

test('recordContactRequest persists across read calls', async () => {
  await clearContactRequestsForTest();
  const parsed = parseContactPayload({
    email: 'cio@firm.com',
    name: 'Pat',
    company: 'Atlas',
    topic: 'pricing',
    message: 'Enterprise quote please.',
  });
  await recordContactRequest(buildContactRequest(parsed, '2026-05-03T12:00:00Z'));
  const rows = await readContactRequests();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].topic, 'pricing');
  await clearContactRequestsForTest();
});

test('recordContactRequest appends multiple records', async () => {
  await clearContactRequestsForTest();
  for (const topic of ['pricing', 'sso', 'deployment'] as const) {
    await recordContactRequest({
      email: 'cio@firm.com',
      name: 'Pat',
      company: 'Atlas',
      topic,
      message: `interested in ${topic}`,
      receivedAt: new Date().toISOString(),
    });
  }
  const rows = await readContactRequests();
  assert.deepEqual(
    rows.map((r) => r.topic),
    ['pricing', 'sso', 'deployment'],
  );
  await clearContactRequestsForTest();
});
