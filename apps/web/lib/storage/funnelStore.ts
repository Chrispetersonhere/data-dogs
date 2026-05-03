/**
 * Funnel storage — JSONL-backed persistence for trial signup and sales
 * inquiry submissions.
 *
 * Why a file and not a database?
 *   The web app does not yet have runtime DB wiring (see
 *   `apps/web/lib/db/provenance.ts`). Until that lands, signup and
 *   contact submissions need to survive a dev-server restart so leads
 *   are not lost. JSONL on disk is the smallest persistence step that
 *   does that, costs zero new dependencies, and presents the same
 *   read/append interface a real DB layer will. When DB wiring is
 *   ready, swap the implementations of `appendSignup` / `appendContact`
 *   for SQL inserts and the route handlers + admin pages don't change.
 *
 * Storage layout (default, override with FUNNEL_STORAGE_DIR):
 *   <web cwd>/data/signup_requests.jsonl
 *   <web cwd>/data/contact_inquiries.jsonl
 *
 * Robustness:
 *   - If the storage directory cannot be created or written (read-only
 *     deploy, sandboxed runtime, etc.), the store falls back to an
 *     in-memory ring so the API still returns 201 and the operator
 *     sees the request in the dev console. The fallback is per-process
 *     and is cleared on restart — same behavior as before persistence
 *     existed.
 *   - All disk I/O is awaited; no fire-and-forget writes.
 *   - Append uses `fs.appendFile` so concurrent requests do not lose
 *     records (Node serializes writes per file descriptor on POSIX
 *     and Windows for small writes; one record per POST is well under
 *     PIPE_BUF).
 */

import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type { SignupRequestRecord } from '../../app/api/v1/signup/helpers';
import type { ContactRequestRecord } from '../../app/api/v1/contact/helpers';

const DEFAULT_DIR = 'data';
const SIGNUP_FILE = 'signup_requests.jsonl';
const CONTACT_FILE = 'contact_inquiries.jsonl';

function storageDir(): string {
  return resolve(process.env.FUNNEL_STORAGE_DIR ?? DEFAULT_DIR);
}

function signupPath(): string {
  return join(storageDir(), SIGNUP_FILE);
}

function contactPath(): string {
  return join(storageDir(), CONTACT_FILE);
}

/* In-memory fallbacks (used when filesystem writes fail). */
const signupMemory: SignupRequestRecord[] = [];
const contactMemory: ContactRequestRecord[] = [];

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

async function appendJsonLine(filePath: string, record: object): Promise<void> {
  await ensureDir(filePath);
  await appendFile(filePath, `${JSON.stringify(record)}\n`, { encoding: 'utf8' });
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  let raw: string;
  try {
    raw = await readFile(filePath, { encoding: 'utf8' });
  } catch (err) {
    // Missing file = empty store; anything else propagates.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

/* ── Signup ────────────────────────────────────────────────── */

export async function appendSignup(record: SignupRequestRecord): Promise<void> {
  try {
    await appendJsonLine(signupPath(), record);
  } catch {
    signupMemory.push(record);
  }
}

export async function readSignups(): Promise<ReadonlyArray<SignupRequestRecord>> {
  let onDisk: SignupRequestRecord[] = [];
  try {
    onDisk = await readJsonLines<SignupRequestRecord>(signupPath());
  } catch {
    onDisk = [];
  }
  return [...onDisk, ...signupMemory];
}

/* ── Contact ───────────────────────────────────────────────── */

export async function appendContact(record: ContactRequestRecord): Promise<void> {
  try {
    await appendJsonLine(contactPath(), record);
  } catch {
    contactMemory.push(record);
  }
}

export async function readContacts(): Promise<ReadonlyArray<ContactRequestRecord>> {
  let onDisk: ContactRequestRecord[] = [];
  try {
    onDisk = await readJsonLines<ContactRequestRecord>(contactPath());
  } catch {
    onDisk = [];
  }
  return [...onDisk, ...contactMemory];
}

/* ── Test helpers ──────────────────────────────────────────── */

export function clearFunnelMemoryForTest(): void {
  signupMemory.length = 0;
  contactMemory.length = 0;
}

export function _resolvedPathsForTest(): {
  dir: string;
  signup: string;
  contact: string;
} {
  return {
    dir: storageDir(),
    signup: signupPath(),
    contact: contactPath(),
  };
}
