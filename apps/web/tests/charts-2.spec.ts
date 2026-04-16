import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TECH_PEER_VALUATION,
  computePeerStats,
  computeValuationDistances,
  validatePeerValuationData,
} from '../lib/charts/peerValuationScatter';
import type { PeerValuationScatterData, PeerValuationPoint } from '../lib/charts/peerValuationScatter';

import {
  GE_RESTATEMENT_FY2017,
  computeRestatementDiffs,
  computeRestatementSummary,
  getMaterialDiffs,
  validateRestatementEvent,
} from '../lib/charts/restatementDiffViewer';
import type { RestatementEvent } from '../lib/charts/restatementDiffViewer';

/* ================================================================== */
/*  Peer Valuation Scatter — data-prep tests                           */
/* ================================================================== */

test('TECH_PEER_VALUATION contains 6 companies', () => {
  assert.equal(TECH_PEER_VALUATION.points.length, 6);
});

test('TECH_PEER_VALUATION has exactly one subject (AAPL)', () => {
  const subjects = TECH_PEER_VALUATION.points.filter((p) => p.role === 'subject');
  assert.equal(subjects.length, 1);
  assert.equal(subjects[0].ticker, 'AAPL');
});

test('TECH_PEER_VALUATION has 5 peers', () => {
  const peers = TECH_PEER_VALUATION.points.filter((p) => p.role === 'peer');
  assert.equal(peers.length, 5);
});

test('TECH_PEER_VALUATION all tickers are unique', () => {
  const tickers = TECH_PEER_VALUATION.points.map((p) => p.ticker);
  assert.equal(new Set(tickers).size, tickers.length);
});

test('TECH_PEER_VALUATION all values are positive', () => {
  for (const p of TECH_PEER_VALUATION.points) {
    assert.ok(p.forwardPE > 0, `${p.ticker} forwardPE must be > 0`);
    assert.ok(p.evToEbitda > 0, `${p.ticker} evToEbitda must be > 0`);
    assert.ok(p.marketCapBn > 0, `${p.ticker} marketCapBn must be > 0`);
  }
});

test('TECH_PEER_VALUATION metadata labels are populated', () => {
  assert.ok(TECH_PEER_VALUATION.period.length > 0);
  assert.ok(TECH_PEER_VALUATION.xMetric.length > 0);
  assert.ok(TECH_PEER_VALUATION.yMetric.length > 0);
  assert.ok(TECH_PEER_VALUATION.sizeMetric.length > 0);
});

test('computePeerStats returns correct mean for peer forwardPE', () => {
  const stats = computePeerStats(TECH_PEER_VALUATION);
  const peers = TECH_PEER_VALUATION.points.filter((p) => p.role === 'peer');
  const expectedMean =
    Math.round((peers.reduce((s, p) => s + p.forwardPE, 0) / peers.length) * 100) / 100;
  assert.equal(stats.meanForwardPE, expectedMean);
});

test('computePeerStats returns correct median for peer evToEbitda', () => {
  const stats = computePeerStats(TECH_PEER_VALUATION);
  const peers = TECH_PEER_VALUATION.points.filter((p) => p.role === 'peer');
  const sorted = [...peers.map((p) => p.evToEbitda)].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const expectedMedian = sorted[mid]; // 5 items → index 2
  assert.equal(stats.medianEvToEbitda, expectedMedian);
});

test('computeValuationDistances returns one entry per company', () => {
  const distances = computeValuationDistances(TECH_PEER_VALUATION);
  assert.equal(distances.length, TECH_PEER_VALUATION.points.length);
});

test('computeValuationDistances all distances are non-negative', () => {
  const distances = computeValuationDistances(TECH_PEER_VALUATION);
  for (const d of distances) {
    assert.ok(d.distance >= 0, `${d.ticker} distance must be >= 0, got ${d.distance}`);
  }
});

test('validatePeerValuationData accepts valid data', () => {
  assert.equal(validatePeerValuationData(TECH_PEER_VALUATION), true);
});

test('validatePeerValuationData rejects no subject', () => {
  const bad: PeerValuationScatterData = {
    ...TECH_PEER_VALUATION,
    points: TECH_PEER_VALUATION.points.map((p) => ({ ...p, role: 'peer' as const })),
  };
  assert.equal(validatePeerValuationData(bad), false);
});

test('validatePeerValuationData rejects duplicate tickers', () => {
  const dupe: PeerValuationPoint = { ...TECH_PEER_VALUATION.points[0] };
  const bad: PeerValuationScatterData = {
    ...TECH_PEER_VALUATION,
    points: [...TECH_PEER_VALUATION.points, dupe],
  };
  assert.equal(validatePeerValuationData(bad), false);
});

test('validatePeerValuationData rejects too few points', () => {
  const bad: PeerValuationScatterData = {
    ...TECH_PEER_VALUATION,
    points: [TECH_PEER_VALUATION.points[0]],
  };
  assert.equal(validatePeerValuationData(bad), false);
});

/* ================================================================== */
/*  Restatement Diff Viewer — data-prep tests                          */
/* ================================================================== */

test('GE_RESTATEMENT_FY2017 has 8 line items', () => {
  assert.equal(GE_RESTATEMENT_FY2017.items.length, 8);
});

test('GE_RESTATEMENT_FY2017 metadata is complete', () => {
  assert.equal(GE_RESTATEMENT_FY2017.ticker, 'GE');
  assert.equal(GE_RESTATEMENT_FY2017.restatedPeriod, 'FY 2017');
  assert.equal(GE_RESTATEMENT_FY2017.filingType, '10-K/A');
  assert.ok(GE_RESTATEMENT_FY2017.accession.length > 0);
  assert.ok(GE_RESTATEMENT_FY2017.cik.length > 0);
});

test('computeRestatementDiffs returns one diff per line item', () => {
  const diffs = computeRestatementDiffs(GE_RESTATEMENT_FY2017);
  assert.equal(diffs.length, GE_RESTATEMENT_FY2017.items.length);
});

test('computeRestatementDiffs computes correct delta for Total Revenue', () => {
  const diffs = computeRestatementDiffs(GE_RESTATEMENT_FY2017);
  const revenueDiff = diffs.find((d) => d.lineItem === 'Total Revenue');
  assert.ok(revenueDiff);
  assert.equal(revenueDiff.delta, 121_615 - 122_092);
  assert.equal(revenueDiff.originalValue, 122_092);
  assert.equal(revenueDiff.restatedValue, 121_615);
});

test('computeRestatementDiffs computes correct delta for Net Income (Loss)', () => {
  const diffs = computeRestatementDiffs(GE_RESTATEMENT_FY2017);
  const niDiff = diffs.find((d) => d.lineItem === 'Net Income (Loss)');
  assert.ok(niDiff);
  assert.equal(niDiff.delta, -8_929 - (-5_786));
  assert.equal(niDiff.delta, -3_143);
});

test('computeRestatementDiffs pctChange is correct for Operating Income', () => {
  const diffs = computeRestatementDiffs(GE_RESTATEMENT_FY2017);
  const oiDiff = diffs.find((d) => d.lineItem === 'Operating Income');
  assert.ok(oiDiff);
  // (1218 - 2649) / |2649| * 100 = -54.02%
  const expected = Math.round(((1_218 - 2_649) / Math.abs(2_649)) * 10000) / 100;
  assert.equal(oiDiff.pctChange, expected);
});

test('computeRestatementDiffs flags material changes correctly at 5%', () => {
  const diffs = computeRestatementDiffs(GE_RESTATEMENT_FY2017, 5);
  // Operating Income dropped ~54% — should be material
  const oiDiff = diffs.find((d) => d.lineItem === 'Operating Income');
  assert.ok(oiDiff);
  assert.equal(oiDiff.isMaterial, true);
  // Total Revenue dropped ~0.39% — should not be material
  const revDiff = diffs.find((d) => d.lineItem === 'Total Revenue');
  assert.ok(revDiff);
  assert.equal(revDiff.isMaterial, false);
});

test('getMaterialDiffs returns only material items', () => {
  const materialDiffs = getMaterialDiffs(GE_RESTATEMENT_FY2017, 5);
  assert.ok(materialDiffs.length > 0);
  assert.ok(materialDiffs.length < GE_RESTATEMENT_FY2017.items.length);
  for (const d of materialDiffs) {
    assert.equal(d.isMaterial, true);
  }
});

test('computeRestatementSummary returns correct counts', () => {
  const summary = computeRestatementSummary(GE_RESTATEMENT_FY2017, 5);
  assert.equal(summary.itemCount, 8);
  assert.ok(summary.materialCount > 0);
  assert.ok(summary.maxAbsPctChange > 0);
  assert.ok(summary.maxAbsPctLineItem.length > 0);
});

test('computeRestatementSummary identifies Diluted EPS or Operating Income as max change', () => {
  const summary = computeRestatementSummary(GE_RESTATEMENT_FY2017, 5);
  // Both Operating Income (~54%) and Diluted EPS (~53.7%) have large changes
  assert.ok(
    ['Operating Income', 'Diluted EPS', 'Net Income (Loss)'].includes(summary.maxAbsPctLineItem),
    `Unexpected max line item: ${summary.maxAbsPctLineItem}`,
  );
});

test('validateRestatementEvent accepts valid event', () => {
  assert.equal(validateRestatementEvent(GE_RESTATEMENT_FY2017), true);
});

test('validateRestatementEvent rejects empty items', () => {
  const bad: RestatementEvent = { ...GE_RESTATEMENT_FY2017, items: [] };
  assert.equal(validateRestatementEvent(bad), false);
});

test('validateRestatementEvent rejects empty ticker', () => {
  const bad: RestatementEvent = { ...GE_RESTATEMENT_FY2017, ticker: '' };
  assert.equal(validateRestatementEvent(bad), false);
});

test('validateRestatementEvent rejects empty line-item name', () => {
  const bad: RestatementEvent = {
    ...GE_RESTATEMENT_FY2017,
    items: [{ lineItem: '', originalValue: 100, restatedValue: 90 }],
  };
  assert.equal(validateRestatementEvent(bad), false);
});

/* ================================================================== */
/*  Cross-chart structural assertions                                  */
/* ================================================================== */

test('peerValuationScatter exports all expected symbols', () => {
  assert.ok(TECH_PEER_VALUATION);
  assert.ok(typeof computePeerStats === 'function');
  assert.ok(typeof computeValuationDistances === 'function');
  assert.ok(typeof validatePeerValuationData === 'function');
});

test('restatementDiffViewer exports all expected symbols', () => {
  assert.ok(GE_RESTATEMENT_FY2017);
  assert.ok(typeof computeRestatementDiffs === 'function');
  assert.ok(typeof getMaterialDiffs === 'function');
  assert.ok(typeof computeRestatementSummary === 'function');
  assert.ok(typeof validateRestatementEvent === 'function');
});
