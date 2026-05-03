import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const TMP = mkdtempSync(join(tmpdir(), 'ibis-funnel-store-spec-'));
process.env.FUNNEL_STORAGE_DIR = TMP;

import {
  appendContact,
  appendSignup,
  clearFunnelMemoryForTest,
  readContacts,
  readSignups,
  _resolvedPathsForTest,
} from '../lib/storage/funnelStore';

const sampleSignup = {
  email: 'jane@firm.com',
  name: 'Jane',
  company: 'Acme',
  useCase: 'kicking the tires',
  plan: 'researcher' as const,
  receivedAt: '2026-05-03T12:00:00Z',
};

const sampleContact = {
  email: 'cio@firm.com',
  name: 'Pat',
  company: 'Atlas',
  topic: 'pricing' as const,
  message: 'enterprise quote please',
  receivedAt: '2026-05-03T12:30:00Z',
};

async function reset(): Promise<void> {
  clearFunnelMemoryForTest();
  await rm(TMP, { recursive: true, force: true });
}

test('appendSignup writes a JSONL line readable by readSignups', async () => {
  await reset();
  await appendSignup(sampleSignup);
  const rows = await readSignups();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'jane@firm.com');
});

test('appendSignup writes one line per record (JSONL invariant)', async () => {
  await reset();
  await appendSignup(sampleSignup);
  await appendSignup({ ...sampleSignup, email: 'b@firm.com' });
  await appendSignup({ ...sampleSignup, email: 'c@firm.com' });

  const { signup } = _resolvedPathsForTest();
  const raw = readFileSync(signup, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.length > 0);
  assert.equal(lines.length, 3);
  for (const line of lines) {
    const parsed = JSON.parse(line);
    assert.equal(typeof parsed.email, 'string');
    assert.equal(parsed.plan, 'researcher');
  }
});

test('appendContact + readContacts round-trip', async () => {
  await reset();
  await appendContact(sampleContact);
  const rows = await readContacts();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].topic, 'pricing');
  assert.equal(rows[0].message, 'enterprise quote please');
});

test('readSignups returns [] when the file does not exist', async () => {
  await reset();
  const rows = await readSignups();
  assert.deepEqual(rows, []);
});

test('readContacts returns [] when the file does not exist', async () => {
  await reset();
  const rows = await readContacts();
  assert.deepEqual(rows, []);
});

test('FUNNEL_STORAGE_DIR controls where files land', async () => {
  await reset();
  const { signup, contact, dir } = _resolvedPathsForTest();
  assert.equal(dir, TMP);
  await appendSignup(sampleSignup);
  await appendContact(sampleContact);
  assert.ok(existsSync(signup), 'signup file should exist after append');
  assert.ok(existsSync(contact), 'contact file should exist after append');
});

test('append creates the storage dir if missing', async () => {
  // Force-remove the dir to verify ensureDir creates it on next append.
  await rm(TMP, { recursive: true, force: true });
  clearFunnelMemoryForTest();
  await appendSignup(sampleSignup);
  const { signup } = _resolvedPathsForTest();
  assert.ok(existsSync(signup));
});

test.after(async () => {
  await rm(TMP, { recursive: true, force: true });
});
