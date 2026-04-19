import assert from 'node:assert/strict';
import test from 'node:test';

import {
  METRICS,
  buildInsights,
  buildRadarData,
  deriveMetricsFromFacts,
  formatMetric,
  median,
  percentile,
} from '../lib/api/peer-benchmark-metrics';
import type {
  CompanyFactsShape,
  CompanyRecord,
} from '../lib/api/peer-benchmark-metrics';
import { PEER_UNIVERSE, findPeers } from '../lib/api/peer-benchmark';

// ---------------------------------------------------------------------------
// percentile / median
// ---------------------------------------------------------------------------

test('percentile returns 50 for degenerate single-value universe', () => {
  assert.equal(percentile([10], 10, true), 50);
});

test('percentile ranks higher-is-better correctly', () => {
  const vals = [10, 20, 30, 40, 50];
  assert.equal(percentile(vals, 50, true), 100);
  assert.equal(percentile(vals, 10, true), 0);
  assert.equal(percentile(vals, 30, true), 50);
});

test('percentile inverts ranking when lower-is-better', () => {
  const vals = [1, 2, 3, 4, 5];
  // value 5 is the WORST in a lower-is-better universe -> 0
  assert.equal(percentile(vals, 5, false), 0);
  assert.equal(percentile(vals, 1, false), 100);
});

test('percentile handles tied values with averaged rank', () => {
  const vals = [10, 20, 20, 30];
  // val=20 has 1 below, 2 equal. rank = 1 + (2-1)/2 = 1.5; pct = 1.5/3 = 50
  assert.equal(percentile(vals, 20, true), 50);
});

test('median returns null for empty array', () => {
  assert.equal(median([]), null);
});

test('median averages two middle values', () => {
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test('median picks middle for odd counts', () => {
  assert.equal(median([3, 1, 2]), 2);
});

test('median ignores non-finite values', () => {
  assert.equal(median([1, Number.NaN, 3]), 2);
});

// ---------------------------------------------------------------------------
// formatMetric
// ---------------------------------------------------------------------------

test('formatMetric renders "—" for null/NaN', () => {
  assert.equal(formatMetric(null, 'percent'), '—');
  assert.equal(formatMetric(Number.NaN, 'ratio'), '—');
});

test('formatMetric formats percent and ratio', () => {
  assert.equal(formatMetric(0.25, 'percent'), '25.0%');
  assert.equal(formatMetric(-0.03, 'percent'), '-3.0%');
  assert.equal(formatMetric(1.456, 'ratio'), '1.46');
});

// ---------------------------------------------------------------------------
// deriveMetricsFromFacts
// ---------------------------------------------------------------------------

function fyPoint(end: string, val: number, fy: number): {
  end: string;
  val: number;
  fy: number;
  fp: 'FY';
  form: '10-K';
} {
  return { end, val, fy, fp: 'FY', form: '10-K' };
}

test('deriveMetricsFromFacts computes all five metrics from a well-formed fixture', () => {
  const facts: CompanyFactsShape = {
    facts: {
      'us-gaap': {
        Revenues: {
          units: {
            USD: [
              fyPoint('2022-12-31', 1000, 2022),
              fyPoint('2023-12-31', 1200, 2023),
            ],
          },
        },
        OperatingIncomeLoss: {
          units: { USD: [fyPoint('2023-12-31', 360, 2023)] },
        },
        NetIncomeLoss: {
          units: { USD: [fyPoint('2023-12-31', 240, 2023)] },
        },
        StockholdersEquity: {
          units: { USD: [fyPoint('2023-12-31', 800, 2023)] },
        },
        LongTermDebt: {
          units: { USD: [fyPoint('2023-12-31', 400, 2023)] },
        },
        LongTermDebtCurrent: {
          units: { USD: [fyPoint('2023-12-31', 100, 2023)] },
        },
      },
    },
  };

  const m = deriveMetricsFromFacts(facts);
  assert.equal(m.revenueGrowth, 0.2);
  assert.equal(m.operatingMargin, 0.3);
  assert.equal(m.netMargin, 0.2);
  assert.equal(m.roe, 0.3);
  assert.equal(m.debtToEquity, 0.625);
});

test('deriveMetricsFromFacts returns nulls when concepts are missing', () => {
  const empty: CompanyFactsShape = { facts: { 'us-gaap': {} } };
  const m = deriveMetricsFromFacts(empty);
  assert.equal(m.revenueGrowth, null);
  assert.equal(m.operatingMargin, null);
  assert.equal(m.netMargin, null);
  assert.equal(m.roe, null);
  assert.equal(m.debtToEquity, null);
});

test('deriveMetricsFromFacts falls back through revenue concept candidates', () => {
  const facts: CompanyFactsShape = {
    facts: {
      'us-gaap': {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          units: {
            USD: [
              fyPoint('2022-12-31', 100, 2022),
              fyPoint('2023-12-31', 110, 2023),
            ],
          },
        },
      },
    },
  };
  const m = deriveMetricsFromFacts(facts);
  assert.ok(m.revenueGrowth != null);
  assert.equal(Math.round((m.revenueGrowth as number) * 1000), 100); // 0.1 = 10%
});

test('deriveMetricsFromFacts falls back to Liabilities when no debt concepts', () => {
  const facts: CompanyFactsShape = {
    facts: {
      'us-gaap': {
        Revenues: { units: { USD: [fyPoint('2023-12-31', 1000, 2023)] } },
        StockholdersEquity: { units: { USD: [fyPoint('2023-12-31', 500, 2023)] } },
        Liabilities: { units: { USD: [fyPoint('2023-12-31', 1500, 2023)] } },
      },
    },
  };
  const m = deriveMetricsFromFacts(facts);
  assert.equal(m.debtToEquity, 3);
});

// ---------------------------------------------------------------------------
// buildRadarData / buildInsights
// ---------------------------------------------------------------------------

function rec(ticker: string, metrics: Partial<CompanyRecord['metrics']>): CompanyRecord {
  return {
    ticker,
    cik: '0000000000',
    name: `${ticker} Co.`,
    sic: '7372',
    sicDescription: 'Prepackaged Software',
    metrics: {
      revenueGrowth: null,
      operatingMargin: null,
      netMargin: null,
      roe: null,
      debtToEquity: null,
      ...metrics,
    },
  };
}

test('buildRadarData emits one entry per metric with target/median/peers', () => {
  const target = rec('AAA', { revenueGrowth: 0.2, operatingMargin: 0.3, roe: 0.2, debtToEquity: 0.5, netMargin: 0.15 });
  const peers = [
    rec('BBB', { revenueGrowth: 0.1, operatingMargin: 0.2, roe: 0.1, debtToEquity: 0.7, netMargin: 0.1 }),
    rec('CCC', { revenueGrowth: 0.15, operatingMargin: 0.25, roe: 0.15, debtToEquity: 0.6, netMargin: 0.12 }),
  ];

  const rad = buildRadarData(target, peers);
  assert.equal(rad.length, METRICS.length);
  const growth = rad.find((r) => r.metricKey === 'revenueGrowth');
  assert.ok(growth);
  assert.equal(growth!.target, 100); // top of universe
  assert.ok('BBB' in growth!.peers && 'CCC' in growth!.peers);
});

test('buildInsights flags best-in-peer on high percentile', () => {
  const target = rec('AAA', { operatingMargin: 0.8 });
  const peers = [
    rec('BBB', { operatingMargin: 0.1 }),
    rec('CCC', { operatingMargin: 0.15 }),
    rec('DDD', { operatingMargin: 0.2 }),
  ];
  const ins = buildInsights(target, peers);
  const op = ins.find((i) => i.metric === 'Operating margin');
  assert.ok(op);
  assert.equal(op!.tone, 'pos');
});

test('buildInsights flags lag on low percentile', () => {
  const target = rec('AAA', { operatingMargin: 0.01 });
  const peers = [
    rec('BBB', { operatingMargin: 0.30 }),
    rec('CCC', { operatingMargin: 0.35 }),
    rec('DDD', { operatingMargin: 0.40 }),
  ];
  const ins = buildInsights(target, peers);
  const op = ins.find((i) => i.metric === 'Operating margin');
  assert.ok(op);
  assert.equal(op!.tone, 'neg');
});

test('buildInsights returns empty array when no peers provided', () => {
  const target = rec('AAA', { operatingMargin: 0.5 });
  assert.deepEqual(buildInsights(target, []), []);
});

// ---------------------------------------------------------------------------
// findPeers / universe
// ---------------------------------------------------------------------------

test('findPeers filters by SIC and excludes target CIK', () => {
  // MSFT has SIC 7372, CIK 0000789019; several software peers share that SIC.
  const peers = findPeers('7372', '0000789019', 10);
  assert.ok(peers.length > 0);
  assert.ok(peers.every((p) => p.sic === '7372'));
  assert.ok(peers.every((p) => p.cik !== '0000789019'));
});

test('findPeers respects max limit', () => {
  const peers = findPeers('7372', '0000789019', 3);
  assert.equal(peers.length, 3);
});

test('findPeers returns empty array when SIC is null', () => {
  assert.deepEqual(findPeers(null, '0000789019'), []);
});

test('PEER_UNIVERSE is non-empty and well-formed', () => {
  assert.ok(PEER_UNIVERSE.length > 50);
  for (const e of PEER_UNIVERSE) {
    assert.equal(typeof e.ticker, 'string');
    assert.match(e.cik, /^\d{10}$/);
    assert.equal(typeof e.sic, 'string');
    assert.ok(e.sic.length >= 3);
  }
});
