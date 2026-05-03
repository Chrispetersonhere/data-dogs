import assert from 'node:assert/strict';
import test from 'node:test';

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

test('buildContactRequest + recordContactRequest persist a record', () => {
  clearContactRequestsForTest();
  const parsed = parseContactPayload({
    email: 'cio@firm.com',
    name: 'Pat',
    company: 'Atlas',
    topic: 'pricing',
    message: 'Enterprise quote please.',
  });
  recordContactRequest(buildContactRequest(parsed, '2026-05-03T12:00:00Z'));
  assert.equal(readContactRequests().length, 1);
  assert.equal(readContactRequests()[0].topic, 'pricing');
  clearContactRequestsForTest();
});
