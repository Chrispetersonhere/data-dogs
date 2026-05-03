/**
 * Pure helpers for the trial-signup route. Importable from tests without
 * spinning up Next.js.
 */

const VALID_PLANS = ['researcher', 'team'] as const;
export type SignupPlan = (typeof VALID_PLANS)[number];

const MAX_LEN = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SignupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignupValidationError';
  }
}

export type ParsedSignupPayload = {
  email: string;
  name: string;
  company: string;
  useCase: string;
  plan: SignupPlan;
};

export type SignupRequestRecord = ParsedSignupPayload & {
  receivedAt: string;
};

function requireString(
  value: unknown,
  field: string,
  { required }: { required: boolean },
): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new SignupValidationError(`Missing field: ${field}.`);
    }
    return '';
  }
  if (typeof value !== 'string') {
    throw new SignupValidationError(`Field ${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new SignupValidationError(`Missing field: ${field}.`);
  }
  if (trimmed.length > MAX_LEN) {
    throw new SignupValidationError(
      `Field ${field} exceeds ${MAX_LEN} characters.`,
    );
  }
  return trimmed;
}

export function parseSignupPayload(input: unknown): ParsedSignupPayload {
  if (input === null || typeof input !== 'object') {
    throw new SignupValidationError('Request body must be a JSON object.');
  }
  const obj = input as Record<string, unknown>;
  const email = requireString(obj.email, 'email', { required: true });
  if (!EMAIL_RE.test(email)) {
    throw new SignupValidationError('Email is not a valid address.');
  }
  const name = requireString(obj.name, 'name', { required: true });
  const company = requireString(obj.company, 'company', { required: true });
  const useCase = requireString(obj.useCase, 'useCase', { required: false });
  const planRaw = requireString(obj.plan, 'plan', { required: true });
  if (!VALID_PLANS.includes(planRaw as SignupPlan)) {
    throw new SignupValidationError(
      `Plan must be one of: ${VALID_PLANS.join(', ')}.`,
    );
  }
  return {
    email,
    name,
    company,
    useCase,
    plan: planRaw as SignupPlan,
  };
}

export function buildSignupRequest(
  parsed: ParsedSignupPayload,
  receivedAt: string,
): SignupRequestRecord {
  return { ...parsed, receivedAt };
}

import {
  appendSignup,
  clearFunnelMemoryForTest,
  readSignups,
  _resolvedPathsForTest,
} from '../../../../lib/storage/funnelStore';
import { notifyFunnelWebhook } from '../../../../lib/storage/funnelWebhook';

export async function recordSignupRequest(
  record: SignupRequestRecord,
): Promise<void> {
  await appendSignup(record);
  // eslint-disable-next-line no-console
  console.log('[signup] received', {
    plan: record.plan,
    email: record.email,
    company: record.company,
    receivedAt: record.receivedAt,
  });
  await notifyFunnelWebhook('signup', record);
}

export async function readSignupRequests(): Promise<
  ReadonlyArray<SignupRequestRecord>
> {
  return readSignups();
}

export async function clearSignupRequestsForTest(): Promise<void> {
  clearFunnelMemoryForTest();
  const { signup } = _resolvedPathsForTest();
  const { unlink } = await import('node:fs/promises');
  try {
    await unlink(signup);
  } catch {
    // Missing file — nothing to clear.
  }
}
