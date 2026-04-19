import type { CSSProperties } from 'react';

import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '../../../../packages/ui/src/styles/tokens';
import {
  buildPeerBenchmark,
  TickerNotFoundError,
} from '../../lib/api/peer-benchmark';

import { PeerBenchmarkClient } from './PeerBenchmarkClient';
import { PeerSearchForm } from './PeerSearchForm';

const DEFAULT_TICKER = 'MSFT';

type PageProps = {
  searchParams?: Promise<{ ticker?: string }>;
};

export default async function PeersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const requestedTicker = (params.ticker ?? DEFAULT_TICKER).trim().toUpperCase();

  const shellStyle: CSSProperties = {
    minHeight: '100vh',
    background: colorTokens.surface.page,
    color: colorTokens.text.primary,
    fontFamily: typographyTokens.fontFamily.sans,
    padding: spacingTokens['5'],
  };

  const errorCardStyle: CSSProperties = {
    border: `1px solid ${colorTokens.border.subtle}`,
    borderRadius: radiusTokens.lg,
    background: colorTokens.surface.card,
    padding: spacingTokens['5'],
    maxWidth: '1280px',
    margin: '0 auto',
  };

  let result;
  try {
    result = await buildPeerBenchmark(requestedTicker);
  } catch (err) {
    const unknown = err instanceof TickerNotFoundError;
    return (
      <main style={shellStyle}>
        <section style={errorCardStyle}>
          <p style={{ margin: 0, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>
            Peer benchmarking
          </p>
          <h1 style={{ margin: `${spacingTokens['2']} 0 ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize['2xl'] }}>
            {unknown ? 'Ticker not found' : 'Could not load benchmark'}
          </h1>
          <p style={{ margin: 0, color: colorTokens.text.secondary }}>
            {unknown
              ? `"${requestedTicker}" is not in SEC EDGAR's ticker map. Try a US-listed ticker.`
              : `Failed to fetch benchmark for ${requestedTicker}. Upstream SEC request failed.`}
          </p>
          <div style={{ marginTop: spacingTokens['4'] }}>
            <PeerSearchForm initialValue="" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <PeerBenchmarkClient result={result} initialTicker={requestedTicker} />
    </main>
  );
}
