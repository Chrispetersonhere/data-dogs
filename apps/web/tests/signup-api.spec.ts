import assert from 'node:assert/strict';
import test from 'node:test';

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

test('recordSignupRequest persists to in-memory store', () => {
  clearSignupRequestsForTest();
  recordSignupRequest({
    email: 'jane@firm.com',
    name: 'Jane',
    company: 'Acme',
    useCase: '',
    plan: 'researcher',
    receivedAt: '2026-05-03T12:00:00Z',
  });
  assert.equal(readSignupRequests().length, 1);
  assert.equal(readSignupRequests()[0].email, 'jane@firm.com');
  clearSignupRequestsForTest();
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
