import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPeerComparison,
  formatPeerMetric,
  PEER_METRICS,
} from '../lib/api/peers';
import type { PeerCompanyRow } from '../lib/api/peers';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SUBJECT: PeerCompanyRow = {
  companyId: '320193',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  marketCap: 3_000_000_000_000,
  revenue: 380_000_000_000,
  grossMargin: 0.44,
  operatingMargin: 0.30,
  netMargin: 0.25,
  revenueGrowth: 0.08,
  currentRatio: 1.0,
  liabilitiesToEquity: 1.8,
};

const PEER_MSFT: PeerCompanyRow = {
  companyId: '789019',
  ticker: 'MSFT',
  name: 'Microsoft Corp.',
  marketCap: 2_800_000_000_000,
  revenue: 220_000_000_000,
  grossMargin: 0.69,
  operatingMargin: 0.42,
  netMargin: 0.34,
  revenueGrowth: 0.15,
  currentRatio: 1.8,
  liabilitiesToEquity: 0.9,
};

const PEER_GOOGL: PeerCompanyRow = {
  companyId: '1652044',
  ticker: 'GOOGL',
  name: 'Alphabet Inc.',
  marketCap: 2_000_000_000_000,
  revenue: 310_000_000_000,
  grossMargin: 0.57,
  operatingMargin: 0.28,
  netMargin: 0.24,
  revenueGrowth: 0.13,
  currentRatio: 2.1,
  liabilitiesToEquity: 0.5,
};

// ---------------------------------------------------------------------------
// buildPeerComparison tests
// ---------------------------------------------------------------------------

test('buildPeerComparison returns subject and peers with correct structure', () => {
  const result = buildPeerComparison(SUBJECT, [PEER_MSFT, PEER_GOOGL]);

  assert.equal(result.subject.companyId, '320193');
  assert.equal(result.peerCount, 2);
  assert.equal(result.entries.length, 3);
  assert.equal(result.entries[0].role, 'subject');
  assert.equal(result.entries[1].role, 'peer');
  assert.equal(result.entries[2].role, 'peer');
});

test('buildPeerComparison deduplicates subject from peer list', () => {
  const result = buildPeerComparison(SUBJECT, [PEER_MSFT, SUBJECT, PEER_GOOGL]);

  assert.equal(result.peerCount, 2);
  assert.equal(result.entries.length, 3);
  assert.equal(result.peers.every((p) => p.companyId !== SUBJECT.companyId), true);
});

test('buildPeerComparison handles empty peer list', () => {
  const result = buildPeerComparison(SUBJECT, []);

  assert.equal(result.peerCount, 0);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].role, 'subject');
});

test('buildPeerComparison preserves peer order', () => {
  const result = buildPeerComparison(SUBJECT, [PEER_GOOGL, PEER_MSFT]);

  assert.equal(result.entries[1].ticker, 'GOOGL');
  assert.equal(result.entries[2].ticker, 'MSFT');
});

// ---------------------------------------------------------------------------
// formatPeerMetric tests
// ---------------------------------------------------------------------------

test('formatPeerMetric formats trillions correctly', () => {
  assert.equal(formatPeerMetric(3_000_000_000_000, 'currency'), '$3.0T');
});

test('formatPeerMetric formats billions correctly', () => {
  assert.equal(formatPeerMetric(380_000_000_000, 'currency'), '$380B');
});

test('formatPeerMetric formats millions correctly', () => {
  assert.equal(formatPeerMetric(50_000_000, 'currency'), '$50M');
});

test('formatPeerMetric formats percent correctly', () => {
  assert.equal(formatPeerMetric(0.44, 'percent'), '44.0%');
  assert.equal(formatPeerMetric(0.081, 'percent'), '8.1%');
});

test('formatPeerMetric formats ratio correctly', () => {
  assert.equal(formatPeerMetric(1.8, 'ratio'), '1.80');
  assert.equal(formatPeerMetric(0.5, 'ratio'), '0.50');
});

// ---------------------------------------------------------------------------
// PEER_METRICS curated set
// ---------------------------------------------------------------------------

test('PEER_METRICS contains exactly 8 curated metrics', () => {
  assert.equal(PEER_METRICS.length, 8);
});

test('PEER_METRICS includes market cap, revenue, margins, growth, and ratios', () => {
  const keys = PEER_METRICS.map((m) => m.key);
  assert.ok(keys.includes('marketCap'));
  assert.ok(keys.includes('revenue'));
  assert.ok(keys.includes('grossMargin'));
  assert.ok(keys.includes('operatingMargin'));
  assert.ok(keys.includes('netMargin'));
  assert.ok(keys.includes('revenueGrowth'));
  assert.ok(keys.includes('currentRatio'));
  assert.ok(keys.includes('liabilitiesToEquity'));
});

// ---------------------------------------------------------------------------
// Markup acceptance: required text fragments
// ---------------------------------------------------------------------------

const REQUIRED_TEXT = [
  'Peer comparison',
  'Peer set',
  'Curated metrics',
  'Comparison table',
  'Ticker',
  'Company',
  'Role',
  'Market cap',
  'Revenue',
  'Gross margin',
  'Operating margin',
  'Net margin',
  'Rev growth',
  'Current ratio',
  'L/E ratio',
  'Subject',
  'Peer',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon', 'TODO'] as const;

export function assertPeersPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required peers page text: "${fragment}"`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden placeholder text: "${fragment}"`);
    }
  }
}

test('assertPeersPageMarkup accepts page with peer set, curated metrics, and comparison table', () => {
  const markup = `
    <main>
      <h1>Peer comparison</h1>
      <h2>Peer set</h2>
      <p>Subject: AAPL — Apple Inc. Peers: MSFT, GOOGL, META, AMZN.</p>
      <h2>Curated metrics</h2>
      <p>Market cap · Revenue · Gross margin · Operating margin · Net margin · Rev growth · Current ratio · L/E ratio</p>
      <h2>Comparison table</h2>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Company</th>
            <th>Role</th>
            <th>Market cap</th>
            <th>Revenue</th>
            <th>Gross margin</th>
            <th>Operating margin</th>
            <th>Net margin</th>
            <th>Rev growth</th>
            <th>Current ratio</th>
            <th>L/E ratio</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>AAPL</td><td>Apple Inc.</td><td>Subject</td></tr>
          <tr><td>MSFT</td><td>Microsoft Corp.</td><td>Peer</td></tr>
        </tbody>
      </table>
    </main>
  `;

  assert.doesNotThrow(() => assertPeersPageMarkup(markup));
});

test('assertPeersPageMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <h1>Peer comparison</h1>
      <h2>Peer set</h2>
      <h2>Curated metrics</h2>
      <h2>Comparison table</h2>
      <th>Ticker</th><th>Company</th><th>Role</th>
      <th>Market cap</th><th>Revenue</th><th>Gross margin</th>
      <th>Operating margin</th><th>Net margin</th><th>Rev growth</th>
      <th>Current ratio</th><th>L/E ratio</th>
      <td>Subject</td><td>Peer</td>
      <p>Placeholder data</p>
    </main>
  `;

  assert.throws(() => assertPeersPageMarkup(markup), /forbidden placeholder text/);
});

test('assertPeersPageMarkup rejects missing peer set section', () => {
  const markup = `
    <main>
      <h1>Peer comparison</h1>
      <h2>Curated metrics</h2>
      <h2>Comparison table</h2>
      <th>Ticker</th><th>Company</th><th>Role</th>
      <th>Market cap</th><th>Revenue</th><th>Gross margin</th>
      <th>Operating margin</th><th>Net margin</th><th>Rev growth</th>
      <th>Current ratio</th><th>L/E ratio</th>
      <td>Subject</td><td>Peer</td>
    </main>
  `;

  assert.throws(() => assertPeersPageMarkup(markup), /Missing required peers page text.*Peer set/);
});

test('assertPeersPageMarkup rejects missing comparison table section', () => {
  const markup = `
    <main>
      <h1>Peer comparison</h1>
      <h2>Peer set</h2>
      <h2>Curated metrics</h2>
      <th>Ticker</th><th>Company</th><th>Role</th>
      <th>Market cap</th><th>Revenue</th><th>Gross margin</th>
      <th>Operating margin</th><th>Net margin</th><th>Rev growth</th>
      <th>Current ratio</th><th>L/E ratio</th>
      <td>Subject</td><td>Peer</td>
    </main>
  `;

  assert.throws(() => assertPeersPageMarkup(markup), /Missing required peers page text.*Comparison table/);
});

test('assertPeersPageMarkup rejects missing curated metrics section', () => {
  const markup = `
    <main>
      <h1>Peer comparison</h1>
      <h2>Peer set</h2>
      <h2>Comparison table</h2>
      <th>Ticker</th><th>Company</th><th>Role</th>
      <th>Market cap</th><th>Revenue</th><th>Gross margin</th>
      <th>Operating margin</th><th>Net margin</th><th>Rev growth</th>
      <th>Current ratio</th><th>L/E ratio</th>
      <td>Subject</td><td>Peer</td>
    </main>
  `;

  assert.throws(() => assertPeersPageMarkup(markup), /Missing required peers page text.*Curated metrics/);
});

// ---------------------------------------------------------------------------
// File structure: peers API module exists and exports expected symbols
// ---------------------------------------------------------------------------

test('peers API module exports buildPeerComparison function', () => {
  assert.equal(typeof buildPeerComparison, 'function');
});

test('peers API module exports formatPeerMetric function', () => {
  assert.equal(typeof formatPeerMetric, 'function');
});

test('peers API module exports PEER_METRICS array', () => {
  assert.ok(Array.isArray(PEER_METRICS));
});
