/**
 * GET /api/v1/status
 *
 * Public ingest status endpoint. Returns the same snapshot the
 * `/status` page and the topnav freshness badge consume — useful for
 * external monitoring (Datadog, Slack-bot, status checks, etc.).
 *
 * Provenance posture: exposes only roll-up counts and timestamps, no
 * issuer or filing identifiers, no internal job names that aren't
 * already shown on the public `/status` page.
 */

import { NextResponse } from 'next/server';

import { getStatusSnapshot } from '../../../../lib/status/snapshot';

export async function GET(): Promise<NextResponse> {
  const snapshot = await getStatusSnapshot();
  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      // Mirror the 60s in-memory cache so CDNs / clients respect the
      // same TTL.
      'cache-control': 'public, max-age=30, s-maxage=60',
    },
  });
}
