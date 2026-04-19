import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APPLE_EXECUTIVE_PAY_MIX,
  PAY_COMPONENT_LABELS,
  PAY_COMPONENT_ORDER,
  aggregatePayMix,
  computePayMixPercent,
  computePayMixStacks,
  totalPay,
  validateExecutivePayMix,
} from '../lib/charts/executivePayMix';
import type {
  ExecutivePayMixData,
  PayComponentKey,
} from '../lib/charts/executivePayMix';

import {
  APPLE_INSIDER_HEATMAP_2024,
  INSIDER_ROLE_LABELS,
  INSIDER_ROLE_ORDER,
  buildInsiderHeatmapGrid,
  computeHeatmapIntensities,
  computeMonthTotals,
  computeRoleTotals,
  validateInsiderHeatmap,
} from '../lib/charts/insiderHeatmap';
import type {
  InsiderHeatmapCell,
  InsiderHeatmapData,
} from '../lib/charts/insiderHeatmap';

/* ================================================================== */
/*  Executive Pay Mix Stack — data-prep tests                          */
/* ================================================================== */

test('APPLE_EXECUTIVE_PAY_MIX metadata is populated', () => {
  assert.equal(APPLE_EXECUTIVE_PAY_MIX.ticker, 'AAPL');
  assert.equal(APPLE_EXECUTIVE_PAY_MIX.companyName, 'Apple Inc.');
  assert.equal(APPLE_EXECUTIVE_PAY_MIX.cik, '0000320193');
  assert.equal(APPLE_EXECUTIVE_PAY_MIX.filingType, 'DEF 14A');
  assert.ok(APPLE_EXECUTIVE_PAY_MIX.accession.length > 0);
  assert.ok(APPLE_EXECUTIVE_PAY_MIX.filingDate.length > 0);
  assert.ok(APPLE_EXECUTIVE_PAY_MIX.fiscalYear.length > 0);
});

test('APPLE_EXECUTIVE_PAY_MIX contains 5 NEOs', () => {
  assert.equal(APPLE_EXECUTIVE_PAY_MIX.rows.length, 5);
});

test('APPLE_EXECUTIVE_PAY_MIX first row is the CEO', () => {
  const first = APPLE_EXECUTIVE_PAY_MIX.rows[0];
  assert.equal(first.name, 'Timothy D. Cook');
  assert.equal(first.title, 'Chief Executive Officer');
});

test('APPLE_EXECUTIVE_PAY_MIX all component values are finite and non-negative', () => {
  for (const row of APPLE_EXECUTIVE_PAY_MIX.rows) {
    for (const key of PAY_COMPONENT_ORDER) {
      const v = row.components[key];
      assert.ok(Number.isFinite(v), `${row.name} ${key} must be finite`);
      assert.ok(v >= 0, `${row.name} ${key} must be >= 0, got ${v}`);
    }
  }
});

test('APPLE_EXECUTIVE_PAY_MIX every NEO has a positive total', () => {
  for (const row of APPLE_EXECUTIVE_PAY_MIX.rows) {
    assert.ok(totalPay(row) > 0, `${row.name} total must be > 0`);
  }
});

test('APPLE_EXECUTIVE_PAY_MIX NEO names are unique', () => {
  const names = APPLE_EXECUTIVE_PAY_MIX.rows.map((r) => r.name);
  assert.equal(new Set(names).size, names.length);
});

test('PAY_COMPONENT_ORDER covers every label in PAY_COMPONENT_LABELS', () => {
  const orderSet = new Set(PAY_COMPONENT_ORDER);
  for (const key of Object.keys(PAY_COMPONENT_LABELS) as PayComponentKey[]) {
    assert.ok(orderSet.has(key), `Component ${key} missing from PAY_COMPONENT_ORDER`);
  }
  assert.equal(PAY_COMPONENT_ORDER.length, Object.keys(PAY_COMPONENT_LABELS).length);
});

test('computePayMixStacks emits one segment per canonical component, in order', () => {
  const stacks = computePayMixStacks(APPLE_EXECUTIVE_PAY_MIX);
  assert.equal(stacks.length, APPLE_EXECUTIVE_PAY_MIX.rows.length);
  for (const stack of stacks) {
    assert.equal(stack.segments.length, PAY_COMPONENT_ORDER.length);
    for (let i = 0; i < PAY_COMPONENT_ORDER.length; i += 1) {
      assert.equal(stack.segments[i].component, PAY_COMPONENT_ORDER[i]);
      assert.equal(stack.segments[i].label, PAY_COMPONENT_LABELS[PAY_COMPONENT_ORDER[i]]);
    }
  }
});

test('computePayMixStacks segments are contiguous (start[i+1] === end[i])', () => {
  const stacks = computePayMixStacks(APPLE_EXECUTIVE_PAY_MIX);
  for (const stack of stacks) {
    assert.equal(stack.segments[0].start, 0);
    for (let i = 1; i < stack.segments.length; i += 1) {
      assert.equal(stack.segments[i].start, stack.segments[i - 1].end);
    }
    // Final end === total
    assert.equal(stack.segments[stack.segments.length - 1].end, stack.total);
  }
});

test('computePayMixStacks total equals sum of component values', () => {
  const stacks = computePayMixStacks(APPLE_EXECUTIVE_PAY_MIX);
  for (let i = 0; i < stacks.length; i += 1) {
    const row = APPLE_EXECUTIVE_PAY_MIX.rows[i];
    const expected = PAY_COMPONENT_ORDER.reduce((s, k) => s + row.components[k], 0);
    assert.equal(stacks[i].total, expected);
  }
});

test('computePayMixStacks CEO total matches Apple 2024 proxy disclosure', () => {
  const stacks = computePayMixStacks(APPLE_EXECUTIVE_PAY_MIX);
  const cook = stacks.find((s) => s.name === 'Timothy D. Cook');
  assert.ok(cook);
  // 3,000,000 + 46,968,710 + 10,713,360 + 711,458 = 61,393,528
  assert.equal(cook.total, 61_393_528);
});

test('computePayMixPercent produces mix entries that sum ≈ 100', () => {
  const rows = computePayMixPercent(APPLE_EXECUTIVE_PAY_MIX);
  for (const row of rows) {
    const sum = row.mix.reduce((s, e) => s + e.pct, 0);
    // Rounding to 2 decimals across 7 components → tolerate ±0.05
    assert.ok(Math.abs(sum - 100) < 0.05, `${row.name} mix sum ${sum} not ≈ 100`);
  }
});

test('computePayMixPercent stock awards dominate CEO mix', () => {
  const rows = computePayMixPercent(APPLE_EXECUTIVE_PAY_MIX);
  const cook = rows.find((r) => r.name === 'Timothy D. Cook');
  assert.ok(cook);
  const stock = cook.mix.find((m) => m.component === 'stockAwards');
  assert.ok(stock);
  // 46,968,710 / 61,393,528 ≈ 76.50 %
  assert.ok(stock.pct > 70 && stock.pct < 80, `CEO stock-awards pct was ${stock.pct}`);
});

test('aggregatePayMix grand total equals sum of per-NEO totals', () => {
  const agg = aggregatePayMix(APPLE_EXECUTIVE_PAY_MIX);
  const expectedGrandTotal = APPLE_EXECUTIVE_PAY_MIX.rows.reduce(
    (s, r) => s + totalPay(r),
    0,
  );
  assert.equal(agg.grandTotal, expectedGrandTotal);
  assert.equal(agg.neoCount, APPLE_EXECUTIVE_PAY_MIX.rows.length);
});

test('aggregatePayMix totals by component equal column sums', () => {
  const agg = aggregatePayMix(APPLE_EXECUTIVE_PAY_MIX);
  for (const key of PAY_COMPONENT_ORDER) {
    const expected = APPLE_EXECUTIVE_PAY_MIX.rows.reduce((s, r) => s + r.components[key], 0);
    assert.equal(agg.totalsByComponent[key], expected, `Component ${key} aggregate mismatch`);
  }
});

test('validateExecutivePayMix accepts canonical dataset', () => {
  assert.equal(validateExecutivePayMix(APPLE_EXECUTIVE_PAY_MIX), true);
});

test('validateExecutivePayMix rejects empty rows', () => {
  const bad: ExecutivePayMixData = { ...APPLE_EXECUTIVE_PAY_MIX, rows: [] };
  assert.equal(validateExecutivePayMix(bad), false);
});

test('validateExecutivePayMix rejects duplicate NEO names', () => {
  const bad: ExecutivePayMixData = {
    ...APPLE_EXECUTIVE_PAY_MIX,
    rows: [APPLE_EXECUTIVE_PAY_MIX.rows[0], APPLE_EXECUTIVE_PAY_MIX.rows[0]],
  };
  assert.equal(validateExecutivePayMix(bad), false);
});

test('validateExecutivePayMix rejects negative component values', () => {
  const bad: ExecutivePayMixData = {
    ...APPLE_EXECUTIVE_PAY_MIX,
    rows: [
      {
        ...APPLE_EXECUTIVE_PAY_MIX.rows[0],
        components: { ...APPLE_EXECUTIVE_PAY_MIX.rows[0].components, salary: -1 },
      },
      ...APPLE_EXECUTIVE_PAY_MIX.rows.slice(1),
    ],
  };
  assert.equal(validateExecutivePayMix(bad), false);
});

test('validateExecutivePayMix rejects empty accession', () => {
  const bad: ExecutivePayMixData = { ...APPLE_EXECUTIVE_PAY_MIX, accession: '' };
  assert.equal(validateExecutivePayMix(bad), false);
});

/* ================================================================== */
/*  Insider Activity Heatmap — data-prep tests                         */
/* ================================================================== */

test('APPLE_INSIDER_HEATMAP_2024 metadata is populated', () => {
  assert.equal(APPLE_INSIDER_HEATMAP_2024.ticker, 'AAPL');
  assert.equal(APPLE_INSIDER_HEATMAP_2024.cik, '0000320193');
  assert.equal(APPLE_INSIDER_HEATMAP_2024.period, 'CY 2024');
});

test('APPLE_INSIDER_HEATMAP_2024 covers 12 consecutive months in 2024', () => {
  assert.equal(APPLE_INSIDER_HEATMAP_2024.months.length, 12);
  const expected = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  ];
  assert.deepEqual(APPLE_INSIDER_HEATMAP_2024.months, expected);
});

test('APPLE_INSIDER_HEATMAP_2024 grid is dense: one cell per (role, month)', () => {
  const expected = INSIDER_ROLE_ORDER.length * APPLE_INSIDER_HEATMAP_2024.months.length;
  assert.equal(APPLE_INSIDER_HEATMAP_2024.cells.length, expected);
});

test('APPLE_INSIDER_HEATMAP_2024 no duplicate (role, month) keys', () => {
  const seen = new Set<string>();
  for (const cell of APPLE_INSIDER_HEATMAP_2024.cells) {
    const key = `${cell.role}|${cell.month}`;
    assert.ok(!seen.has(key), `Duplicate cell ${key}`);
    seen.add(key);
  }
});

test('APPLE_INSIDER_HEATMAP_2024 |netShares| never exceeds grossShares', () => {
  for (const cell of APPLE_INSIDER_HEATMAP_2024.cells) {
    assert.ok(
      Math.abs(cell.netShares) <= cell.grossShares,
      `${cell.role} ${cell.month}: |net|=${Math.abs(cell.netShares)} > gross=${cell.grossShares}`,
    );
  }
});

test('INSIDER_ROLE_ORDER and INSIDER_ROLE_LABELS stay in sync', () => {
  assert.equal(INSIDER_ROLE_ORDER.length, Object.keys(INSIDER_ROLE_LABELS).length);
  for (const role of INSIDER_ROLE_ORDER) {
    assert.ok(
      INSIDER_ROLE_LABELS[role] && INSIDER_ROLE_LABELS[role].length > 0,
      `Missing label for role ${role}`,
    );
  }
});

test('buildInsiderHeatmapGrid produces a dense, aligned grid', () => {
  const grid = buildInsiderHeatmapGrid(APPLE_INSIDER_HEATMAP_2024);
  assert.deepEqual(grid.months, APPLE_INSIDER_HEATMAP_2024.months);
  for (const role of INSIDER_ROLE_ORDER) {
    assert.equal(grid.rows[role].length, APPLE_INSIDER_HEATMAP_2024.months.length);
    for (let i = 0; i < grid.rows[role].length; i += 1) {
      assert.equal(grid.rows[role][i].month, APPLE_INSIDER_HEATMAP_2024.months[i]);
      assert.equal(grid.rows[role][i].role, role);
    }
  }
});

test('buildInsiderHeatmapGrid preserves the Feb 2024 director grant cell', () => {
  const grid = buildInsiderHeatmapGrid(APPLE_INSIDER_HEATMAP_2024);
  const febIdx = APPLE_INSIDER_HEATMAP_2024.months.indexOf('2024-02');
  const cell = grid.rows.director[febIdx];
  assert.equal(cell.transactionCount, 9);
  assert.equal(cell.netShares, 16_800);
  assert.equal(cell.grossShares, 16_800);
});

test('buildInsiderHeatmapGrid fills missing cells with explicit zeros', () => {
  const sparse: InsiderHeatmapData = {
    ticker: 'TEST',
    companyName: 'Test Co.',
    cik: '0000000001',
    period: 'CY 2024',
    months: ['2024-01', '2024-02'],
    cells: [
      { role: 'officer', month: '2024-01', transactionCount: 2, netShares: -100, grossShares: 100 },
    ],
  };
  const grid = buildInsiderHeatmapGrid(sparse);
  assert.equal(grid.rows.director[0].transactionCount, 0);
  assert.equal(grid.rows.director[0].grossShares, 0);
  assert.equal(grid.rows.officer[0].transactionCount, 2);
  assert.equal(grid.rows.officer[1].transactionCount, 0);
});

test('computeRoleTotals totals equal sums of cells per role', () => {
  const totals = computeRoleTotals(APPLE_INSIDER_HEATMAP_2024);
  assert.equal(totals.length, INSIDER_ROLE_ORDER.length);
  for (const total of totals) {
    const expectedCount = APPLE_INSIDER_HEATMAP_2024.cells
      .filter((c) => c.role === total.role)
      .reduce((s, c) => s + c.transactionCount, 0);
    const expectedNet = APPLE_INSIDER_HEATMAP_2024.cells
      .filter((c) => c.role === total.role)
      .reduce((s, c) => s + c.netShares, 0);
    const expectedGross = APPLE_INSIDER_HEATMAP_2024.cells
      .filter((c) => c.role === total.role)
      .reduce((s, c) => s + c.grossShares, 0);
    assert.equal(total.transactionCount, expectedCount);
    assert.equal(total.netShares, expectedNet);
    assert.equal(total.grossShares, expectedGross);
  }
});

test('computeRoleTotals officer gross volume is the largest bucket', () => {
  const totals = computeRoleTotals(APPLE_INSIDER_HEATMAP_2024);
  const officer = totals.find((t) => t.role === 'officer');
  assert.ok(officer);
  for (const other of totals) {
    if (other.role === 'officer') continue;
    assert.ok(
      officer.grossShares >= other.grossShares,
      `${other.role} gross=${other.grossShares} > officer gross=${officer.grossShares}`,
    );
  }
});

test('computeMonthTotals returns one entry per month in order', () => {
  const totals = computeMonthTotals(APPLE_INSIDER_HEATMAP_2024);
  assert.equal(totals.length, APPLE_INSIDER_HEATMAP_2024.months.length);
  for (let i = 0; i < totals.length; i += 1) {
    assert.equal(totals[i].month, APPLE_INSIDER_HEATMAP_2024.months[i]);
  }
});

test('computeMonthTotals Feb 2024 sums director grant + officer sales', () => {
  const totals = computeMonthTotals(APPLE_INSIDER_HEATMAP_2024);
  const feb = totals.find((t) => t.month === '2024-02');
  assert.ok(feb);
  // director 9 + officer 6 + other 1 = 16 transactions
  assert.equal(feb.transactionCount, 16);
  // director +16,800 + officer -78,300 + other -1,200 = -62,700
  assert.equal(feb.netShares, -62_700);
});

test('computeHeatmapIntensities returns one entry per cell in [0, 1]', () => {
  const intensities = computeHeatmapIntensities(APPLE_INSIDER_HEATMAP_2024);
  assert.equal(intensities.length, APPLE_INSIDER_HEATMAP_2024.cells.length);
  for (const i of intensities) {
    assert.ok(i.intensity >= 0 && i.intensity <= 1, `intensity out of range: ${i.intensity}`);
  }
});

test('computeHeatmapIntensities direction tracks sign of netShares', () => {
  const intensities = computeHeatmapIntensities(APPLE_INSIDER_HEATMAP_2024);
  const byKey = new Map(intensities.map((i) => [`${i.role}|${i.month}`, i]));
  for (const cell of APPLE_INSIDER_HEATMAP_2024.cells) {
    const got = byKey.get(`${cell.role}|${cell.month}`);
    assert.ok(got);
    const expected = cell.netShares > 0 ? 1 : cell.netShares < 0 ? -1 : 0;
    assert.equal(got.direction, expected, `${cell.role} ${cell.month} direction`);
  }
});

test('computeHeatmapIntensities peak cell has intensity === 1', () => {
  const intensities = computeHeatmapIntensities(APPLE_INSIDER_HEATMAP_2024);
  const peak = intensities.reduce((a, b) => (a.intensity >= b.intensity ? a : b));
  assert.equal(peak.intensity, 1);
});

test('validateInsiderHeatmap accepts the canonical dataset', () => {
  assert.equal(validateInsiderHeatmap(APPLE_INSIDER_HEATMAP_2024), true);
});

test('validateInsiderHeatmap rejects malformed month strings', () => {
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    months: ['2024-1', ...APPLE_INSIDER_HEATMAP_2024.months.slice(1)],
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

test('validateInsiderHeatmap rejects duplicate months', () => {
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    months: ['2024-01', '2024-01'],
    cells: APPLE_INSIDER_HEATMAP_2024.cells.slice(0, 2),
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

test('validateInsiderHeatmap rejects cells referencing unknown months', () => {
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    cells: [
      ...APPLE_INSIDER_HEATMAP_2024.cells,
      { role: 'director', month: '2099-01', transactionCount: 1, netShares: 1, grossShares: 1 },
    ],
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

test('validateInsiderHeatmap rejects duplicate (role, month) keys', () => {
  const dupe: InsiderHeatmapCell = APPLE_INSIDER_HEATMAP_2024.cells[0];
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    cells: [...APPLE_INSIDER_HEATMAP_2024.cells, { ...dupe }],
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

test('validateInsiderHeatmap rejects |netShares| > grossShares', () => {
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    cells: [
      { role: 'director', month: '2024-01', transactionCount: 1, netShares: -100, grossShares: 50 },
      ...APPLE_INSIDER_HEATMAP_2024.cells.slice(1),
    ],
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

test('validateInsiderHeatmap rejects negative transactionCount', () => {
  const bad: InsiderHeatmapData = {
    ...APPLE_INSIDER_HEATMAP_2024,
    cells: [
      { role: 'director', month: '2024-01', transactionCount: -1, netShares: 0, grossShares: 0 },
      ...APPLE_INSIDER_HEATMAP_2024.cells.slice(1),
    ],
  };
  assert.equal(validateInsiderHeatmap(bad), false);
});

/* ================================================================== */
/*  Structural assertions                                              */
/* ================================================================== */

test('executivePayMix exports all expected symbols', () => {
  assert.ok(APPLE_EXECUTIVE_PAY_MIX);
  assert.ok(PAY_COMPONENT_LABELS);
  assert.ok(PAY_COMPONENT_ORDER);
  assert.ok(typeof totalPay === 'function');
  assert.ok(typeof computePayMixStacks === 'function');
  assert.ok(typeof computePayMixPercent === 'function');
  assert.ok(typeof aggregatePayMix === 'function');
  assert.ok(typeof validateExecutivePayMix === 'function');
});

test('insiderHeatmap exports all expected symbols', () => {
  assert.ok(APPLE_INSIDER_HEATMAP_2024);
  assert.ok(INSIDER_ROLE_LABELS);
  assert.ok(INSIDER_ROLE_ORDER);
  assert.ok(typeof buildInsiderHeatmapGrid === 'function');
  assert.ok(typeof computeRoleTotals === 'function');
  assert.ok(typeof computeMonthTotals === 'function');
  assert.ok(typeof computeHeatmapIntensities === 'function');
  assert.ok(typeof validateInsiderHeatmap === 'function');
});
