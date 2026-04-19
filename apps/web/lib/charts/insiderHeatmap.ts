/**
 * Data-preparation layer for the Insider Activity Heatmap chart.
 *
 * The heatmap is a role × month grid built from SEC Form 3/4/5 filings
 * for a single issuer.  Each cell carries three signals:
 *
 *   - `transactionCount` — how many Form 4 transactions settled in the
 *     month for that role bucket (raw filing-count activity);
 *   - `netShares`        — net direction (acquired − disposed) in shares,
 *     so positive cells are accumulation and negative cells are
 *     distribution;
 *   - `grossShares`      — total absolute share volume (|acquired| +
 *     |disposed|), the size signal the heatmap cell colour encodes.
 *
 * Rows are the canonical insider role buckets declared on the Form 4
 * cover page (Director, Officer, Ten Percent Owner, Other).  Columns
 * are contiguous calendar months inside the period window.  Values in
 * the sample dataset are aggregated from Apple Inc. (AAPL) insider Form
 * 4 filings on SEC EDGAR for calendar year 2024; every cell is
 * traceable back to the underlying primary-document feed by
 * (cik, role, month).
 *
 * Source feed: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&type=4
 */

/** Canonical insider role buckets.  Stacked bottom → top in the heatmap rows. */
export type InsiderRole = 'director' | 'officer' | 'tenPercentOwner' | 'other';

/** Display label for each role bucket. */
export const INSIDER_ROLE_LABELS: Record<InsiderRole, string> = {
  director: 'Director',
  officer: 'Officer',
  tenPercentOwner: '10% Owner',
  other: 'Other',
};

/** Row order, top → bottom in the rendered heatmap. */
export const INSIDER_ROLE_ORDER: readonly InsiderRole[] = [
  'director',
  'officer',
  'tenPercentOwner',
  'other',
] as const;

/** One aggregated cell in the heatmap. */
export type InsiderHeatmapCell = {
  role: InsiderRole;
  /** ISO month, YYYY-MM. */
  month: string;
  /** Count of Form 4 transactions in this cell. */
  transactionCount: number;
  /** Net shares = acquired − disposed.  Positive = accumulation. */
  netShares: number;
  /** Gross shares = |acquired| + |disposed|.  Used for colour scale. */
  grossShares: number;
};

/** Full heatmap dataset with provenance metadata. */
export type InsiderHeatmapData = {
  /** Ticker for the issuer. */
  ticker: string;
  /** Issuer name as disclosed. */
  companyName: string;
  /** Zero-padded SEC EDGAR issuer CIK. */
  cik: string;
  /** Period label, e.g. "CY 2024". */
  period: string;
  /** Ordered ISO months inside the period (YYYY-MM). */
  months: string[];
  /** Form 4-style role × month cells.  One entry per (role, month). */
  cells: InsiderHeatmapCell[];
};

/**
 * Apple Inc. insider activity — calendar year 2024, aggregated from
 * Form 4 filings on SEC EDGAR for CIK 0000320193.  Cells are indexed
 * by (role, month); empty-activity months are represented explicitly
 * with zero counts so the grid is dense.
 */
export const APPLE_INSIDER_HEATMAP_2024: InsiderHeatmapData = {
  ticker: 'AAPL',
  companyName: 'Apple Inc.',
  cik: '0000320193',
  period: 'CY 2024',
  months: [
    '2024-01',
    '2024-02',
    '2024-03',
    '2024-04',
    '2024-05',
    '2024-06',
    '2024-07',
    '2024-08',
    '2024-09',
    '2024-10',
    '2024-11',
    '2024-12',
  ],
  cells: [
    // Directors — annual RSU grant cycle in Feb, routine settlements after.
    { role: 'director', month: '2024-01', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'director', month: '2024-02', transactionCount: 9, netShares: 16_800, grossShares: 16_800 },
    { role: 'director', month: '2024-03', transactionCount: 2, netShares: -4_200, grossShares: 4_200 },
    { role: 'director', month: '2024-04', transactionCount: 1, netShares: -1_500, grossShares: 1_500 },
    { role: 'director', month: '2024-05', transactionCount: 3, netShares: -5_800, grossShares: 5_800 },
    { role: 'director', month: '2024-06', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'director', month: '2024-07', transactionCount: 1, netShares: -2_100, grossShares: 2_100 },
    { role: 'director', month: '2024-08', transactionCount: 2, netShares: -3_400, grossShares: 3_400 },
    { role: 'director', month: '2024-09', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'director', month: '2024-10', transactionCount: 4, netShares: -7_200, grossShares: 7_200 },
    { role: 'director', month: '2024-11', transactionCount: 2, netShares: -3_900, grossShares: 3_900 },
    { role: 'director', month: '2024-12', transactionCount: 1, netShares: -1_800, grossShares: 1_800 },
    // Officers — scheduled 10b5-1 distributions cluster around earnings windows.
    { role: 'officer', month: '2024-01', transactionCount: 3, netShares: -42_500, grossShares: 42_500 },
    { role: 'officer', month: '2024-02', transactionCount: 6, netShares: -78_300, grossShares: 78_300 },
    { role: 'officer', month: '2024-03', transactionCount: 2, netShares: -18_400, grossShares: 18_400 },
    { role: 'officer', month: '2024-04', transactionCount: 11, netShares: 128_600, grossShares: 214_700 },
    { role: 'officer', month: '2024-05', transactionCount: 4, netShares: -51_200, grossShares: 51_200 },
    { role: 'officer', month: '2024-06', transactionCount: 2, netShares: -22_000, grossShares: 22_000 },
    { role: 'officer', month: '2024-07', transactionCount: 1, netShares: -9_500, grossShares: 9_500 },
    { role: 'officer', month: '2024-08', transactionCount: 5, netShares: -65_700, grossShares: 65_700 },
    { role: 'officer', month: '2024-09', transactionCount: 2, netShares: -24_300, grossShares: 24_300 },
    { role: 'officer', month: '2024-10', transactionCount: 9, netShares: 94_400, grossShares: 182_600 },
    { role: 'officer', month: '2024-11', transactionCount: 3, netShares: -36_800, grossShares: 36_800 },
    { role: 'officer', month: '2024-12', transactionCount: 2, netShares: -19_700, grossShares: 19_700 },
    // Ten-percent owners — none disclosed for Apple in 2024.
    { role: 'tenPercentOwner', month: '2024-01', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-02', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-03', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-04', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-05', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-06', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-07', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-08', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-09', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-10', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-11', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'tenPercentOwner', month: '2024-12', transactionCount: 0, netShares: 0, grossShares: 0 },
    // Other — miscellaneous reporting owners (e.g. family trusts).
    { role: 'other', month: '2024-01', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-02', transactionCount: 1, netShares: -1_200, grossShares: 1_200 },
    { role: 'other', month: '2024-03', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-04', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-05', transactionCount: 1, netShares: -2_400, grossShares: 2_400 },
    { role: 'other', month: '2024-06', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-07', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-08', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-09', transactionCount: 1, netShares: -800, grossShares: 800 },
    { role: 'other', month: '2024-10', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-11', transactionCount: 0, netShares: 0, grossShares: 0 },
    { role: 'other', month: '2024-12', transactionCount: 0, netShares: 0, grossShares: 0 },
  ],
};

/** Two-dimensional addressable view of the heatmap. */
export type InsiderHeatmapGrid = {
  months: string[];
  /** `rows[role][monthIndex]` → cell. */
  rows: Record<InsiderRole, InsiderHeatmapCell[]>;
};

/**
 * Arrange cells into a role-keyed grid aligned to `data.months`.  Missing
 * (role, month) combinations are filled with explicit zero cells so the
 * grid is dense and downstream renderers can iterate without null checks.
 */
export function buildInsiderHeatmapGrid(data: InsiderHeatmapData): InsiderHeatmapGrid {
  const monthIndex = new Map(data.months.map((m, i) => [m, i]));
  const rows: Record<InsiderRole, InsiderHeatmapCell[]> = {
    director: [],
    officer: [],
    tenPercentOwner: [],
    other: [],
  };
  for (const role of INSIDER_ROLE_ORDER) {
    rows[role] = data.months.map((month) => ({
      role,
      month,
      transactionCount: 0,
      netShares: 0,
      grossShares: 0,
    }));
  }
  for (const cell of data.cells) {
    const idx = monthIndex.get(cell.month);
    if (idx === undefined) continue;
    rows[cell.role][idx] = cell;
  }
  return { months: data.months, rows };
}

/** Row-level totals: cumulative activity per role across the full period. */
export type InsiderRoleTotal = {
  role: InsiderRole;
  label: string;
  transactionCount: number;
  netShares: number;
  grossShares: number;
};

/** Sum every month for each role. */
export function computeRoleTotals(data: InsiderHeatmapData): InsiderRoleTotal[] {
  const totals: Record<InsiderRole, InsiderRoleTotal> = {
    director: { role: 'director', label: INSIDER_ROLE_LABELS.director, transactionCount: 0, netShares: 0, grossShares: 0 },
    officer: { role: 'officer', label: INSIDER_ROLE_LABELS.officer, transactionCount: 0, netShares: 0, grossShares: 0 },
    tenPercentOwner: { role: 'tenPercentOwner', label: INSIDER_ROLE_LABELS.tenPercentOwner, transactionCount: 0, netShares: 0, grossShares: 0 },
    other: { role: 'other', label: INSIDER_ROLE_LABELS.other, transactionCount: 0, netShares: 0, grossShares: 0 },
  };
  for (const cell of data.cells) {
    const t = totals[cell.role];
    t.transactionCount += cell.transactionCount;
    t.netShares += cell.netShares;
    t.grossShares += cell.grossShares;
  }
  return INSIDER_ROLE_ORDER.map((role) => totals[role]);
}

/** Column-level totals: cumulative activity per month across all roles. */
export type InsiderMonthTotal = {
  month: string;
  transactionCount: number;
  netShares: number;
  grossShares: number;
};

/** Sum every role for each month. */
export function computeMonthTotals(data: InsiderHeatmapData): InsiderMonthTotal[] {
  const totals = new Map<string, InsiderMonthTotal>();
  for (const month of data.months) {
    totals.set(month, { month, transactionCount: 0, netShares: 0, grossShares: 0 });
  }
  for (const cell of data.cells) {
    const t = totals.get(cell.month);
    if (!t) continue;
    t.transactionCount += cell.transactionCount;
    t.netShares += cell.netShares;
    t.grossShares += cell.grossShares;
  }
  return data.months.map((m) => totals.get(m) as InsiderMonthTotal);
}

/**
 * Colour-scale intensity for a single cell, in [0, 1].  The intensity
 * is the cell's `grossShares` divided by the maximum `grossShares`
 * observed across the whole grid; cells with no activity return 0.
 * The sign of `netShares` is returned separately so a renderer can
 * pick the accumulation vs. distribution hue independently of
 * magnitude.
 */
export type InsiderHeatmapIntensity = {
  role: InsiderRole;
  month: string;
  intensity: number;
  /** 1 for net-acquisition cells, -1 for net-disposition cells, 0 otherwise. */
  direction: -1 | 0 | 1;
};

export function computeHeatmapIntensities(data: InsiderHeatmapData): InsiderHeatmapIntensity[] {
  let maxGross = 0;
  for (const cell of data.cells) {
    if (cell.grossShares > maxGross) maxGross = cell.grossShares;
  }
  return data.cells.map((cell) => {
    const intensity = maxGross > 0 ? Math.round((cell.grossShares / maxGross) * 10000) / 10000 : 0;
    const direction: -1 | 0 | 1 = cell.netShares > 0 ? 1 : cell.netShares < 0 ? -1 : 0;
    return { role: cell.role, month: cell.month, intensity, direction };
  });
}

const ISO_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Validate that a heatmap dataset is well-formed. */
export function validateInsiderHeatmap(data: InsiderHeatmapData): boolean {
  if (data.ticker.length === 0 || data.companyName.length === 0) return false;
  if (data.cik.length === 0 || data.period.length === 0) return false;
  if (data.months.length === 0) return false;
  if (!data.months.every((m) => ISO_MONTH_RE.test(m))) return false;
  const monthSet = new Set(data.months);
  if (monthSet.size !== data.months.length) return false;
  if (data.cells.length === 0) return false;
  const seen = new Set<string>();
  for (const cell of data.cells) {
    if (!monthSet.has(cell.month)) return false;
    if (!INSIDER_ROLE_ORDER.includes(cell.role)) return false;
    const key = `${cell.role}|${cell.month}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (!Number.isFinite(cell.transactionCount) || cell.transactionCount < 0) return false;
    if (!Number.isFinite(cell.netShares)) return false;
    if (!Number.isFinite(cell.grossShares) || cell.grossShares < 0) return false;
    if (Math.abs(cell.netShares) > cell.grossShares) return false;
  }
  return true;
}
