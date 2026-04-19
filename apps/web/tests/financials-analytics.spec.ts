import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMMON_SIZE_DENOMINATOR,
  buildTrendSeries,
  computeCommonSize,
  computeRowYoYDeltas,
  computeYoYDeltas,
  parseFinancialsView,
  type StatementRow,
} from '../lib/financials/analytics';

const INCOME_ROWS: StatementRow[] = [
  {
    label: 'Revenue',
    valuesByYear: {
      2024: 391_035_000_000,
      2023: 383_285_000_000,
      2022: 394_328_000_000,
      2021: 365_817_000_000,
    },
  },
  {
    label: 'Gross profit',
    valuesByYear: {
      2024: 180_683_000_000,
      2023: 169_148_000_000,
      2022: 170_782_000_000,
    },
  },
  {
    label: 'Operating income',
    valuesByYear: {
      2024: 123_216_000_000,
      2023: 114_301_000_000,
    },
  },
  {
    label: 'Net income',
    valuesByYear: {
      2024: 93_736_000_000,
      2023: 96_995_000_000,
      2022: 99_803_000_000,
      2021: 94_680_000_000,
    },
  },
];

const DESCENDING_YEARS = [2024, 2023, 2022, 2021];

test('computeRowYoYDeltas produces deltas for consecutive year pairs only', () => {
  const revenueRow = INCOME_ROWS[0];
  const deltas = computeRowYoYDeltas(revenueRow, DESCENDING_YEARS);

  assert.equal(Object.keys(deltas).length, 3, 'should emit deltas for 3 of 4 years');
  assert.equal(deltas[2024].priorYear, 2023);
  assert.equal(deltas[2024].absoluteChange, 391_035_000_000 - 383_285_000_000);
  assert.ok(deltas[2024].percentChange !== null);
  assert.ok(Math.abs((deltas[2024].percentChange as number) - 0.02022) < 0.001);
  assert.equal(deltas[2021], undefined, 'oldest year has no prior, so no delta');
});

test('computeRowYoYDeltas returns null percentChange when prior value is zero', () => {
  const row: StatementRow = { label: 'Zero prior', valuesByYear: { 2024: 100, 2023: 0 } };
  const deltas = computeRowYoYDeltas(row, [2024, 2023]);
  assert.equal(deltas[2024].priorYear, 2023);
  assert.equal(deltas[2024].absoluteChange, 100);
  assert.equal(deltas[2024].percentChange, null);
});

test('computeRowYoYDeltas skips years with missing values', () => {
  const operatingIncome = INCOME_ROWS[2];
  const deltas = computeRowYoYDeltas(operatingIncome, DESCENDING_YEARS);
  assert.equal(Object.keys(deltas).length, 1, 'only 2024 has both current and prior value');
  assert.equal(deltas[2024].priorYear, 2023);
  assert.equal(deltas[2023], undefined);
});

test('computeYoYDeltas preserves row order and labels', () => {
  const all = computeYoYDeltas(INCOME_ROWS, DESCENDING_YEARS);
  assert.equal(all.length, INCOME_ROWS.length);
  assert.deepEqual(
    all.map((d) => d.label),
    INCOME_ROWS.map((r) => r.label),
  );
});

test('computeCommonSize divides each row by the income-statement denominator (revenue)', () => {
  const result = computeCommonSize('income', INCOME_ROWS);

  const revenue = result.find((r) => r.label === 'Revenue');
  const netIncome = result.find((r) => r.label === 'Net income');
  assert.ok(revenue);
  assert.ok(netIncome);
  assert.equal(revenue.denominatorLabel, 'Revenue');
  assert.equal(revenue.percentByYear[2024], 1);
  assert.ok(netIncome.percentByYear[2024] !== null);
  assert.ok(Math.abs((netIncome.percentByYear[2024] as number) - 0.23971) < 0.001);
});

test('computeCommonSize returns null for years where the denominator is missing', () => {
  const rows: StatementRow[] = [
    { label: 'Total assets', valuesByYear: { 2024: 1000, 2023: 900 } },
    { label: 'Cash & equivalents', valuesByYear: { 2024: 200, 2023: 150, 2022: 120 } },
  ];
  const result = computeCommonSize('balance', rows);
  const cash = result.find((r) => r.label === 'Cash & equivalents');
  assert.ok(cash);
  assert.equal(cash.percentByYear[2022], null, 'no 2022 denominator so cell is null');
  assert.ok(Math.abs((cash.percentByYear[2024] as number) - 0.2) < 1e-6);
});

test('computeCommonSize returns null when the denominator is zero', () => {
  const rows: StatementRow[] = [
    { label: 'Cash from operations', valuesByYear: { 2024: 0 } },
    { label: 'Cash from investing', valuesByYear: { 2024: -500 } },
  ];
  const result = computeCommonSize('cashflow', rows);
  const investing = result.find((r) => r.label === 'Cash from investing');
  assert.ok(investing);
  assert.equal(investing.percentByYear[2024], null);
});

test('computeCommonSize produces empty maps when the denominator row is absent', () => {
  const rows: StatementRow[] = [{ label: 'Operating income', valuesByYear: { 2024: 100 } }];
  const result = computeCommonSize('income', rows);
  assert.equal(result[0].denominatorLabel, 'Revenue');
  assert.deepEqual(result[0].percentByYear, {});
});

test('COMMON_SIZE_DENOMINATOR anchors match the page statement specs', () => {
  assert.equal(COMMON_SIZE_DENOMINATOR.income, 'Revenue');
  assert.equal(COMMON_SIZE_DENOMINATOR.balance, 'Total assets');
  assert.equal(COMMON_SIZE_DENOMINATOR.cashflow, 'Cash from operations');
});

test('buildTrendSeries orders points ascending by year and drops missing cells', () => {
  const series = buildTrendSeries(INCOME_ROWS, DESCENDING_YEARS);
  const operatingIncome = series.find((s) => s.label === 'Operating income');
  assert.ok(operatingIncome);
  assert.deepEqual(
    operatingIncome.points.map((p) => p.year),
    [2023, 2024],
    'points ascending, missing years elided',
  );

  const revenue = series.find((s) => s.label === 'Revenue');
  assert.ok(revenue);
  assert.deepEqual(
    revenue.points.map((p) => p.year),
    [2021, 2022, 2023, 2024],
  );
  assert.equal(revenue.points[0].value, 365_817_000_000);
});

test('buildTrendSeries returns empty points for rows with no numeric values', () => {
  const series = buildTrendSeries([{ label: 'Empty', valuesByYear: {} }], [2024, 2023]);
  assert.equal(series[0].points.length, 0);
});

test('parseFinancialsView defaults to absolute and accepts common-size', () => {
  assert.equal(parseFinancialsView(undefined), 'absolute');
  assert.equal(parseFinancialsView(''), 'absolute');
  assert.equal(parseFinancialsView('absolute'), 'absolute');
  assert.equal(parseFinancialsView('common-size'), 'common-size');
  assert.equal(parseFinancialsView('trend'), 'absolute', 'unknown values fall back to absolute');
});
