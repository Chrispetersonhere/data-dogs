/**
 * Pure helpers for the contact / sales-inquiry route. Importable from
 * tests without spinning up Next.js.
 */

const VALID_TOPICS = [
  'pricing',
  'sso',
  'deployment',
  'data',
  'other',
] as const;
export type ContactTopic = (typeof VALID_TOPICS)[number];

const MAX_LEN = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactValidationError';
  }
}

export type ParsedContactPayload = {
  email: string;
  name: string;
  company: string;
  topic: ContactTopic;
  message: string;
};

export type ContactRequestRecord = ParsedContactPayload & {
  receivedAt: string;
};

function requireString(
  value: unknown,
  field: string,
  { required, max }: { required: boolean; max: number },
): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new ContactValidationError(`Missing field: ${field}.`);
    }
    return '';
  }
  if (typeof value !== 'string') {
    throw new ContactValidationError(`Field ${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new ContactValidationError(`Missing field: ${field}.`);
  }
  if (trimmed.length > max) {
    throw new ContactValidationError(
      `Field ${field} exceeds ${max} characters.`,
    );
  }
  return trimmed;
}

export function parseContactPayload(input: unknown): ParsedContactPayload {
  if (input === null || typeof input !== 'object') {
    throw new ContactValidationError('Request body must be a JSON object.');
  }
  const obj = input as Record<string, unknown>;
  const email = requireString(obj.email, 'email', { required: true, max: 320 });
  if (!EMAIL_RE.test(email)) {
    throw new ContactValidationError('Email is not a valid address.');
  }
  const name = requireString(obj.name, 'name', { required: true, max: 200 });
  const company = requireString(obj.company, 'company', {
    required: true,
    max: 200,
  });
  const topicRaw = requireString(obj.topic, 'topic', {
    required: true,
    max: 32,
  });
  if (!VALID_TOPICS.includes(topicRaw as ContactTopic)) {
    throw new ContactValidationError(
      `Topic must be one of: ${VALID_TOPICS.join(', ')}.`,
    );
  }
  const message = requireString(obj.message, 'message', {
    required: true,
    max: MAX_LEN,
  });
  return {
    email,
    name,
    company,
    topic: topicRaw as ContactTopic,
    message,
  };
}

export function buildContactRequest(
  parsed: ParsedContactPayload,
  receivedAt: string,
): ContactRequestRecord {
  return { ...parsed, receivedAt };
}

import {
  appendContact,
  clearFunnelMemoryForTest,
  readContacts,
  _resolvedPathsForTest,
} from '../../../../lib/storage/funnelStore';

export async function recordContactRequest(
  record: ContactRequestRecord,
): Promise<void> {
  await appendContact(record);
  // eslint-disable-next-line no-console
  console.log('[contact] received', {
    topic: record.topic,
    email: record.email,
    company: record.company,
    receivedAt: record.receivedAt,
  });
}

export async function readContactRequests(): Promise<
  ReadonlyArray<ContactRequestRecord>
> {
  return readContacts();
}

export async function clearContactRequestsForTest(): Promise<void> {
  clearFunnelMemoryForTest();
  const { contact } = _resolvedPathsForTest();
  const { unlink } = await import('node:fs/promises');
  try {
    await unlink(contact);
  } catch {
    // Missing file — nothing to clear.
  }
}
