import { NextResponse } from 'next/server';

import { buildHealthStatus } from '../../lib/observability';

export function GET(): NextResponse {
  return NextResponse.json(buildHealthStatus(), { status: 200 });
}
