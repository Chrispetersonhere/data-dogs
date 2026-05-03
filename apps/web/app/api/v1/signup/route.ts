/**
 * POST /api/v1/signup
 *
 * Beta-grade waitlist endpoint. Validates a trial signup payload and
 * appends it to an in-memory store. The store is intentionally
 * process-local — when a runtime database is wired, swap
 * `recordSignupRequest` for a real insert without touching the route.
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
    recordSignupRequest(record);
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
