/**
 * POST /api/v1/contact
 *
 * Beta-grade sales-inquiry endpoint. Validates and persists a contact
 * request to the JSONL-backed funnel store (see
 * `apps/web/lib/storage/funnelStore.ts`). Falls back to in-memory if
 * disk writes fail. Swap `appendContact` for an SQL insert when DB
 * wiring is ready and the route handler does not change.
 */

import { NextResponse } from 'next/server';

import {
  buildContactRequest,
  ContactValidationError,
  parseContactPayload,
  recordContactRequest,
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
    const parsed = parseContactPayload(payload);
    const record = buildContactRequest(parsed, new Date().toISOString());
    await recordContactRequest(record);
    return NextResponse.json(
      {
        ok: true,
        receivedAt: record.receivedAt,
        topic: record.topic,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Could not record inquiry. Please try again.' },
      { status: 500 },
    );
  }
}
