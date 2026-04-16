import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APPLE_FUNDAMENTALS,
  validateFundamentalSeries,
} from '../lib/charts/fundamentalsSmallMultiples';
import type { FundamentalSeries } from '../lib/charts/fundamentalsSmallMultiples';

import {
  APPLE_MARGIN_BRIDGE,
  computeWaterfallPositions,
  validateWaterfallSegments,
} from '../lib/charts/marginBridgeWaterfall';
import type { WaterfallSegment } from '../lib/charts/marginBridgeWaterfall';

/* ================================================================== */
/*  Fundamentals Small Multiples — data-prep tests                     */
/* ================================================================== */

test('APPLE_FUNDAMENTALS contains 6 metric series', () => {
  assert.equal(APPLE_FUNDAMENTALS.length, 6);
});

test('APPLE_FUNDAMENTALS series names are correct', () => {
  const names = APPLE_FUNDAMENTALS.map((s) => s.metric);
  assert.deepEqual(names, [
    'Revenue',
    'Net Income',
    'Diluted EPS',
    'Free Cash Flow',
    'Gross Margin',
    'Operating Margin',
  ]);
});

test('APPLE_FUNDAMENTALS each series has 5 annual periods', () => {
  for (const s of APPLE_FUNDAMENTALS) {
    assert.equal(s.data.length, 5, `${s.metric} should have 5 data points`);
  }
});

test('APPLE_FUNDAMENTALS all values are positive', () => {
  for (const s of APPLE_FUNDAMENTALS) {
    for (const d of s.data) {
      assert.ok(d.value > 0, `${s.metric} ${d.period} value must be > 0, got ${d.value}`);
    }
  }
});

test('APPLE_FUNDAMENTALS periods are FY 2020–FY 2024', () => {
  const expected = ['FY 2020', 'FY 2021', 'FY 2022', 'FY 2023', 'FY 2024'];
  for (const s of APPLE_FUNDAMENTALS) {
    const periods = s.data.map((d) => d.period);
    assert.deepEqual(periods, expected, `${s.metric} periods mismatch`);
  }
});

test('validateFundamentalSeries accepts valid series', () => {
  assert.equal(validateFundamentalSeries(APPLE_FUNDAMENTALS), true);
});

test('validateFundamentalSeries rejects empty array', () => {
  assert.equal(validateFundamentalSeries([]), false);
});

test('validateFundamentalSeries rejects mismatched lengths', () => {
  const bad: FundamentalSeries[] = [
    { metric: 'A', unit: '$M', data: [{ period: 'FY 2024', value: 1 }] },
    { metric: 'B', unit: '$M', data: [] },
  ];
  assert.equal(validateFundamentalSeries(bad), false);
});

/* ================================================================== */
/*  Margin Bridge Waterfall — data-prep tests                          */
/* ================================================================== */

test('APPLE_MARGIN_BRIDGE has 8 segments', () => {
  assert.equal(APPLE_MARGIN_BRIDGE.length, 8);
});

test('APPLE_MARGIN_BRIDGE starts with Revenue and ends with Net Income', () => {
  assert.equal(APPLE_MARGIN_BRIDGE[0].label, 'Revenue');
  assert.equal(APPLE_MARGIN_BRIDGE[APPLE_MARGIN_BRIDGE.length - 1].label, 'Net Income');
});

test('APPLE_MARGIN_BRIDGE first and last segments are absolute', () => {
  assert.equal(APPLE_MARGIN_BRIDGE[0].kind, 'absolute');
  assert.equal(APPLE_MARGIN_BRIDGE[APPLE_MARGIN_BRIDGE.length - 1].kind, 'absolute');
});

test('APPLE_MARGIN_BRIDGE delta segments are negative (costs)', () => {
  const deltas = APPLE_MARGIN_BRIDGE.filter((s) => s.kind === 'delta');
  for (const d of deltas) {
    assert.ok(d.value < 0, `Delta segment ${d.label} should be negative, got ${d.value}`);
  }
});

test('computeWaterfallPositions produces correct running totals', () => {
  const positions = computeWaterfallPositions(APPLE_MARGIN_BRIDGE);
  assert.equal(positions.length, APPLE_MARGIN_BRIDGE.length);

  // Revenue: absolute, start=0, end=391035
  assert.equal(positions[0].start, 0);
  assert.equal(positions[0].end, 391_035);

  // COGS: delta -210296, start=391035, end=180739
  assert.equal(positions[1].start, 391_035);
  assert.equal(positions[1].end, 391_035 - 210_296);

  // Gross Profit: absolute, start=0, end=180739
  assert.equal(positions[2].start, 0);
  assert.equal(positions[2].end, 180_739);

  // Net Income: absolute, start=0, end=93736
  const last = positions[positions.length - 1];
  assert.equal(last.start, 0);
  assert.equal(last.end, 93_736);
});

test('computeWaterfallPositions handles simple two-step bridge', () => {
  const simple: WaterfallSegment[] = [
    { label: 'Start', value: 100, kind: 'absolute' },
    { label: 'Cost', value: -30, kind: 'delta' },
    { label: 'End', value: 70, kind: 'absolute' },
  ];
  const pos = computeWaterfallPositions(simple);
  assert.equal(pos[0].end, 100);
  assert.equal(pos[1].start, 100);
  assert.equal(pos[1].end, 70);
  assert.equal(pos[2].end, 70);
});

test('validateWaterfallSegments accepts valid segments', () => {
  assert.equal(validateWaterfallSegments(APPLE_MARGIN_BRIDGE), true);
});

test('validateWaterfallSegments rejects too few segments', () => {
  assert.equal(validateWaterfallSegments([{ label: 'Solo', value: 100, kind: 'absolute' }]), false);
});

test('validateWaterfallSegments rejects non-absolute first segment', () => {
  const bad: WaterfallSegment[] = [
    { label: 'Cost', value: -30, kind: 'delta' },
    { label: 'End', value: 70, kind: 'absolute' },
  ];
  assert.equal(validateWaterfallSegments(bad), false);
});

test('validateWaterfallSegments rejects non-absolute last segment', () => {
  const bad: WaterfallSegment[] = [
    { label: 'Start', value: 100, kind: 'absolute' },
    { label: 'Cost', value: -30, kind: 'delta' },
  ];
  assert.equal(validateWaterfallSegments(bad), false);
});

test('validateWaterfallSegments rejects empty labels', () => {
  const bad: WaterfallSegment[] = [
    { label: 'Start', value: 100, kind: 'absolute' },
    { label: '', value: -30, kind: 'delta' },
    { label: 'End', value: 70, kind: 'absolute' },
  ];
  assert.equal(validateWaterfallSegments(bad), false);
});

/* ================================================================== */
/*  Structural assertions for chart markup contracts                   */
/* ================================================================== */

test('FundamentalsSmallMultiples data has precise labels with units', () => {
  for (const s of APPLE_FUNDAMENTALS) {
    assert.ok(s.metric.length > 0, 'metric name must not be empty');
    assert.ok(s.unit.length > 0, 'unit must not be empty');
    assert.ok(['$M', '$/share', '%'].includes(s.unit), `unexpected unit: ${s.unit}`);
  }
});

test('MarginBridgeWaterfall segments sum correctly from Revenue to Net Income', () => {
  const revenue = APPLE_MARGIN_BRIDGE[0].value;
  const netIncome = APPLE_MARGIN_BRIDGE[APPLE_MARGIN_BRIDGE.length - 1].value;
  const deltas = APPLE_MARGIN_BRIDGE.filter((s) => s.kind === 'delta');
  const totalDeltas = deltas.reduce((sum, s) => sum + s.value, 0);

  // Revenue + all deltas should approximately equal Net Income
  // (absolute intermediate totals reset running, but final check is on the data itself)
  assert.equal(revenue + totalDeltas, netIncome, 'Revenue + deltas must equal Net Income');
});
