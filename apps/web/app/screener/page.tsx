import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../../../packages/ui/src/styles/tokens';
import { filterScreenerRows } from '../../lib/api/screener';
import type { ScreenerFilters, ScreenerRow } from '../../lib/api/screener';
import { ScreenerFilterChips } from '../../../../packages/ui/src/components/screener';
import { ScreenerQuerySummary } from '../../../../packages/ui/src/components/screener';
import { ScreenerResultsTable } from '../../../../packages/ui/src/components/screener';
import type { ScreenerFilterCategory } from '../../../../packages/ui/src/components/screener';

// ---------------------------------------------------------------------------
// Static sample data (same as test fixtures, reflecting real pipeline shape)
// ---------------------------------------------------------------------------

const SAMPLE_ROWS: ScreenerRow[] = [
  {
    companyId: '320193',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    marketCap: 3_000_000_000_000,
    revenue: 380_000_000_000,
    assets: 350_000_000_000,
    revenueGrowth: 0.08,
    earningsGrowth: 0.10,
    grossMargin: 0.44,
    operatingMargin: 0.30,
    netMargin: 0.25,
    liabilitiesToEquity: 1.8,
    liabilitiesToAssets: 0.65,
    currentRatio: 1.0,
    quickRatio: 0.85,
  },
  {
    companyId: '789019',
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    marketCap: 2_800_000_000_000,
    revenue: 220_000_000_000,
    assets: 410_000_000_000,
    revenueGrowth: 0.15,
    earningsGrowth: 0.18,
    grossMargin: 0.69,
    operatingMargin: 0.42,
    netMargin: 0.34,
    liabilitiesToEquity: 0.9,
    liabilitiesToAssets: 0.47,
    currentRatio: 1.8,
    quickRatio: 1.6,
  },
  {
    companyId: '1018724',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    marketCap: 1_600_000_000_000,
    revenue: 570_000_000_000,
    assets: 520_000_000_000,
    revenueGrowth: 0.12,
    earningsGrowth: 0.50,
    grossMargin: 0.47,
    operatingMargin: 0.06,
    netMargin: 0.04,
    liabilitiesToEquity: 2.2,
    liabilitiesToAssets: 0.69,
    currentRatio: 1.1,
    quickRatio: 0.8,
  },
  {
    companyId: '1652044',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    marketCap: 2_000_000_000_000,
    revenue: 310_000_000_000,
    assets: 400_000_000_000,
    revenueGrowth: 0.13,
    earningsGrowth: 0.22,
    grossMargin: 0.57,
    operatingMargin: 0.28,
    netMargin: 0.24,
    liabilitiesToEquity: 0.5,
    liabilitiesToAssets: 0.34,
    currentRatio: 2.1,
    quickRatio: 2.0,
  },
  {
    companyId: '1326801',
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    marketCap: 1_200_000_000_000,
    revenue: 135_000_000_000,
    assets: 190_000_000_000,
    revenueGrowth: 0.22,
    earningsGrowth: 0.35,
    grossMargin: 0.81,
    operatingMargin: 0.35,
    netMargin: 0.29,
    liabilitiesToEquity: 0.6,
    liabilitiesToAssets: 0.38,
    currentRatio: 2.7,
    quickRatio: 2.5,
  },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: colorTokens.surface.page,
  color: colorTokens.text.primary,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['5'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  background: colorTokens.surface.card,
  padding: spacingTokens['4'],
};

// ---------------------------------------------------------------------------
// Filter resolution from search params
// ---------------------------------------------------------------------------

type ScreenerPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}

function parseActiveFilters(resolved: Record<string, string | string[] | undefined>): {
  filters: ScreenerFilters;
  active: ScreenerFilterCategory[];
  labels: { category: string; field: string; label: string }[];
} {
  const filters: ScreenerFilters = {};
  const active: ScreenerFilterCategory[] = [];
  const labels: { category: string; field: string; label: string }[] = [];

  const minMarketCap = firstValue(resolved.minMarketCap);
  const minRevenue = firstValue(resolved.minRevenue);
  if (minMarketCap || minRevenue) {
    active.push('size');
    filters.size = {};
    if (minMarketCap) {
      filters.size.marketCap = { min: Number(minMarketCap) };
      labels.push({ category: 'size', field: 'marketCap', label: `Market cap ≥ ${formatFilterValue(Number(minMarketCap))}` });
    }
    if (minRevenue) {
      filters.size.revenue = { min: Number(minRevenue) };
      labels.push({ category: 'size', field: 'revenue', label: `Revenue ≥ ${formatFilterValue(Number(minRevenue))}` });
    }
  }

  const minRevenueGrowth = firstValue(resolved.minRevenueGrowth);
  if (minRevenueGrowth) {
    active.push('growth');
    filters.growth = { revenueGrowth: { min: Number(minRevenueGrowth) } };
    labels.push({ category: 'growth', field: 'revenueGrowth', label: `Rev growth ≥ ${(Number(minRevenueGrowth) * 100).toFixed(0)}%` });
  }

  const minGrossMargin = firstValue(resolved.minGrossMargin);
  const minNetMargin = firstValue(resolved.minNetMargin);
  if (minGrossMargin || minNetMargin) {
    active.push('margin');
    filters.margin = {};
    if (minGrossMargin) {
      filters.margin.grossMargin = { min: Number(minGrossMargin) };
      labels.push({ category: 'margin', field: 'grossMargin', label: `Gross margin ≥ ${(Number(minGrossMargin) * 100).toFixed(0)}%` });
    }
    if (minNetMargin) {
      filters.margin.netMargin = { min: Number(minNetMargin) };
      labels.push({ category: 'margin', field: 'netMargin', label: `Net margin ≥ ${(Number(minNetMargin) * 100).toFixed(0)}%` });
    }
  }

  const maxLiabilitiesToEquity = firstValue(resolved.maxLiabilitiesToEquity);
  if (maxLiabilitiesToEquity) {
    active.push('leverage');
    filters.leverage = { liabilitiesToEquity: { max: Number(maxLiabilitiesToEquity) } };
    labels.push({ category: 'leverage', field: 'liabilitiesToEquity', label: `L/E ≤ ${Number(maxLiabilitiesToEquity).toFixed(1)}` });
  }

  const minCurrentRatio = firstValue(resolved.minCurrentRatio);
  if (minCurrentRatio) {
    active.push('liquidity');
    filters.liquidity = { currentRatio: { min: Number(minCurrentRatio) } };
    labels.push({ category: 'liquidity', field: 'currentRatio', label: `Current ratio ≥ ${Number(minCurrentRatio).toFixed(1)}` });
  }

  return { filters, active, labels };
}

function formatFilterValue(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ScreenerPage({ searchParams }: ScreenerPageProps) {
  const resolved = (await searchParams) ?? {};
  const { filters, active, labels } = parseActiveFilters(resolved);
  const result = filterScreenerRows(SAMPLE_ROWS, filters);

  const tableRows = result.rows.map((row) => ({
    companyId: row.companyId,
    ticker: row.ticker,
    name: row.name,
    marketCap: row.marketCap,
    revenue: row.revenue,
    grossMargin: row.grossMargin,
    netMargin: row.netMargin,
    revenueGrowth: row.revenueGrowth,
    currentRatio: row.currentRatio,
  }));

  return (
    <main style={shellStyle}>
      <section style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
        <header style={cardStyle}>
          <p style={{ margin: 0, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>
            Premium layout • stock screener
          </p>
          <h1 style={{ margin: `${spacingTokens['2']} 0 ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize['3xl'] }}>
            Stock screener
          </h1>
          <p style={{ margin: 0, color: colorTokens.text.secondary, maxWidth: '68ch' }}>
            Filter companies by size, growth, margin, leverage, and liquidity. Results update from the screener query layer.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Filter chips</h2>
          <ScreenerFilterChips active={active} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Query summary</h2>
          <ScreenerQuerySummary filters={labels} totalMatched={result.totalMatched} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Premium results table</h2>
          <ScreenerResultsTable rows={tableRows} totalMatched={result.totalMatched} />
        </section>

        <section style={{ ...cardStyle, color: colorTokens.text.muted }}>
          <h2 style={{ marginTop: 0, color: colorTokens.text.primary }}>Responsive layout</h2>
          <p style={{ margin: 0 }}>
            Filter chips wrap on narrow viewports. The results table scrolls horizontally to preserve data density on mobile screens.
          </p>
        </section>
      </section>
    </main>
  );
}
