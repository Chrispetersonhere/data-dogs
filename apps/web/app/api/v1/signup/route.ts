/**
 * POST /api/v1/signup
 *
 * Beta-grade waitlist endpoint. Validates a trial signup payload and
 * appends it to a JSONL-backed funnel store (see
 * `apps/web/lib/storage/funnelStore.ts`). The store falls back to
 * in-memory if disk writes fail. When runtime DB wiring is ready,
 * swap the implementation of `appendSignup` for an SQL insert and
 * the route handler does not change.
 */

import { NextResponse } from 'next/server';

import {
  buildSignupRequest,
  parseSignupPayload,
  recordSignupRequest,
  SignupValidationError,
} from './helpers';

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  try {
    const parsed = parseSignupPayload(payload);
    const record = buildSignupRequest(parsed, new Date().toISOString());
    await recordSignupRequest(record);
    return NextResponse.json(
      {
        ok: true,
        receivedAt: record.receivedAt,
        plan: record.plan,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SignupValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Could not record signup. Please try again.' },
      { status: 500 },
    );
  }
}
