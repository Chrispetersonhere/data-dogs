import type { CSSProperties, JSX } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../../packages/ui/src/styles/tokens';
import { FinancialsTableShell, PeriodToggle, stickyTheadStyle } from '../../../../../../packages/ui/src/components/financials';
import { TrendSparkline } from '../../../../../../packages/ui/src/components/charts';
import { NotesPanel } from '../../../../../../packages/ui/src/components/notes';
import { getNotesForConcept } from '../../../../lib/api/notes';
import type { NoteItem } from '../../../../../../packages/ui/src/components/notes';
import {
  buildTrendSeries,
  computeCommonSize,
  computeYoYDeltas,
  parseFinancialsView,
  COMMON_SIZE_DENOMINATOR,
  type CommonSizeRow,
  type FinancialsView,
  type StatementId,
  type TrendSeries,
  type YoYDeltasByRow,
} from '../../../../lib/financials/analytics';

type FinancialsPageProps = {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ note?: string; view?: string }>;
};

type FactPoint = {
  end: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  val?: number;
};

type ConceptUnits = Record<string, FactPoint[]>;

type CompanyFactsResponse = {
  cik?: string;
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<
      string,
      {
        units?: ConceptUnits;
      }
    >;
  };
};

type MetricSpec = {
  label: string;
  concepts: string[];
  units: string[];
};

type StatementSpec = {
  title: string;
  id: StatementId;
  metrics: MetricSpec[];
};

type StatementMetricRow = {
  label: string;
  conceptUsed: string | null;
  valuesByYear: Record<number, number>;
};

type AnnualStatementsView = {
  companyName: string;
  cik: string;
  sourceUrl: string;
  fetchedAt: string;
  years: number[];
  statements: Array<{
    title: string;
    id: StatementId;
    rows: StatementMetricRow[];
  }>;
  consistency: {
    balanceCheck: 'ok' | 'incomplete' | 'mismatch';
    message: string;
  };
};

const ANNUAL_FORMS = new Set(['10-K', '10-K/A', '20-F', '20-F/A', '40-F', '40-F/A']);

const STATEMENT_SPECS: StatementSpec[] = [
  {
    title: 'Income statement',
    id: 'income',
    metrics: [
      {
        label: 'Revenue',
        concepts: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'],
        units: ['USD'],
      },
      {
        label: 'Gross profit',
        concepts: ['GrossProfit'],
        units: ['USD'],
      },
      {
        label: 'Operating income',
        concepts: ['OperatingIncomeLoss'],
        units: ['USD'],
      },
      {
        label: 'Net income',
        concepts: ['NetIncomeLoss', 'ProfitLoss'],
        units: ['USD'],
      },
    ],
  },
  {
    title: 'Balance sheet',
    id: 'balance',
    metrics: [
      {
        label: 'Cash & equivalents',
        concepts: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
        units: ['USD'],
      },
      {
        label: 'Total assets',
        concepts: ['Assets'],
        units: ['USD'],
      },
      {
        label: 'Total liabilities',
        concepts: ['Liabilities'],
        units: ['USD'],
      },
      {
        label: "Shareholders' equity",
        concepts: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
        units: ['USD'],
      },
    ],
  },
  {
    title: 'Cash flow',
    id: 'cashflow',
    metrics: [
      {
        label: 'Cash from operations',
        concepts: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
        units: ['USD'],
      },
      {
        label: 'Cash from investing',
        concepts: ['NetCashProvidedByUsedInInvestingActivities', 'NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'],
        units: ['USD'],
      },
      {
        label: 'Cash from financing',
        concepts: ['NetCashProvidedByUsedInFinancingActivities', 'NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'],
        units: ['USD'],
      },
      {
        label: 'Capital expenditures',
        concepts: ['PaymentsToAcquirePropertyPlantAndEquipment'],
        units: ['USD'],
      },
    ],
  },
];

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(145deg, ${colorTokens.surface.inverse} 0%, #111827 45%, #1f2937 100%)`,
  color: colorTokens.text.inverse,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.lg,
  background: 'rgba(15, 23, 42, 0.78)',
  padding: spacingTokens['5'],
};

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function normalizeCompanyId(companyId: string): string {
  const digits = companyId.replace(/\D/g, '');
  if (!digits) {
    throw new Error('companyId must contain at least one digit');
  }
  return digits;
}

function padCik(companyId: string): string {
  return normalizeCompanyId(companyId).padStart(10, '0');
}

function parseAnnualYear(point: FactPoint): number | null {
  if (typeof point.fy === 'number') {
    return point.fy;
  }
  if (!point.end) {
    return null;
  }
  const yearText = point.end.slice(0, 4);
  const year = Number.parseInt(yearText, 10);
  return Number.isFinite(year) ? year : null;
}

function preferMoreRecent(a: FactPoint, b: FactPoint): FactPoint {
  const aFiled = a.filed ?? '';
  const bFiled = b.filed ?? '';
  if (aFiled !== bFiled) {
    return aFiled > bFiled ? a : b;
  }
  return (a.end ?? '') >= (b.end ?? '') ? a : b;
}

function collectMetricValues(usGaap: Record<string, { units?: ConceptUnits }>, metric: MetricSpec): { conceptUsed: string | null; valuesByYear: Record<number, number> } {
  for (const concept of metric.concepts) {
    const conceptNode = usGaap[concept];
    if (!conceptNode?.units) {
      continue;
    }

    for (const unit of metric.units) {
      const points = conceptNode.units[unit] ?? [];
      const annual = points.filter((point) => {
        const year = parseAnnualYear(point);
        return (
          year !== null
          && typeof point.val === 'number'
          && ANNUAL_FORMS.has(point.form ?? '')
          && (point.fp === 'FY' || !point.fp)
        );
      });

      if (annual.length === 0) {
        continue;
      }

      const byYear = new Map<number, FactPoint>();
      for (const point of annual) {
        const year = parseAnnualYear(point);
        if (year === null) {
          continue;
        }
        const existing = byYear.get(year);
        if (!existing) {
          byYear.set(year, point);
          continue;
        }
        byYear.set(year, preferMoreRecent(existing, point));
      }

      const valuesByYear: Record<number, number> = {};
      for (const [year, point] of byYear.entries()) {
        valuesByYear[year] = point.val as number;
      }

      return { conceptUsed: concept, valuesByYear };
    }
  }

  return { conceptUsed: null, valuesByYear: {} };
}

function summarizeConsistency(statements: AnnualStatementsView['statements'], years: number[]): AnnualStatementsView['consistency'] {
  const balance = statements.find((item) => item.id === 'balance');
  if (!balance) {
    return { balanceCheck: 'incomplete', message: 'Balance sheet was unavailable.' };
  }

  const assets = balance.rows.find((row) => row.label === 'Total assets');
  const liabilities = balance.rows.find((row) => row.label === 'Total liabilities');
  const equity = balance.rows.find((row) => row.label === "Shareholders' equity");

  if (!assets || !liabilities || !equity) {
    return { balanceCheck: 'incomplete', message: 'Balance-sheet check could not run.' };
  }

  for (const year of years) {
    const assetValue = assets.valuesByYear[year];
    const liabilityValue = liabilities.valuesByYear[year];
    const equityValue = equity.valuesByYear[year];

    if (assetValue === undefined || liabilityValue === undefined || equityValue === undefined) {
      continue;
    }

    const diff = Math.abs(assetValue - (liabilityValue + equityValue));
    if (diff > Math.max(Math.abs(assetValue), 1) * 0.03) {
      return { balanceCheck: 'mismatch', message: `Potential mismatch in ${year}: assets differ from liabilities + equity.` };
    }
  }

  return { balanceCheck: 'ok', message: 'No obvious annual balance-sheet mismatch detected in available years.' };
}

async function getAnnualStatements(companyId: string): Promise<AnnualStatementsView> {
  const cikPadded = padCik(companyId);
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikPadded}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`SEC companyfacts request failed (${response.status}) for CIK ${cikPadded}`);
  }

  const fetchedAt = new Date().toISOString();
  const payload = (await response.json()) as CompanyFactsResponse;
  const usGaap = payload.facts?.['us-gaap'];
  if (!usGaap) {
    throw new Error(`No us-gaap facts found for CIK ${cikPadded}`);
  }

  const statements = STATEMENT_SPECS.map((spec) => ({
    title: spec.title,
    id: spec.id,
    rows: spec.metrics.map((metric) => {
      const row = collectMetricValues(usGaap, metric);
      return {
        label: metric.label,
        conceptUsed: row.conceptUsed,
        valuesByYear: row.valuesByYear,
      };
    }),
  }));

  const yearSet = new Set<number>();
  for (const statement of statements) {
    for (const row of statement.rows) {
      for (const yearText of Object.keys(row.valuesByYear)) {
        yearSet.add(Number(yearText));
      }
    }
  }

  const years = [...yearSet].filter((year) => Number.isFinite(year)).sort((a, b) => b - a).slice(0, 4);
  if (years.length === 0) {
    throw new Error(`No annual facts were available for CIK ${cikPadded}`);
  }

  return {
    companyName: payload.entityName ?? `CIK ${cikPadded}`,
    cik: payload.cik ?? cikPadded,
    sourceUrl: url,
    fetchedAt,
    years,
    statements,
    consistency: summarizeConsistency(statements, years),
  };
}

function formatMoney(value: number | undefined): string {
  if (value === undefined) {
    return '\u2014';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCommonSizePercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '\u2014';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatYoyDelta(percentChange: number | null | undefined): string | null {
  if (percentChange === null || percentChange === undefined || !Number.isFinite(percentChange)) {
    return null;
  }
  const sign = percentChange > 0 ? '+' : percentChange < 0 ? '\u2212' : '';
  const magnitude = Math.abs(percentChange) * 100;
  return `${sign}${magnitude.toFixed(1)}% Y/Y`;
}

function yoyDeltaColor(percentChange: number | null | undefined): string {
  if (percentChange === null || percentChange === undefined || !Number.isFinite(percentChange)) {
    return colorTokens.accent.muted;
  }
  if (percentChange > 0) return colorTokens.signal.up;
  if (percentChange < 0) return colorTokens.signal.down;
  return colorTokens.signal.flat;
}

function buildLinkHref(params: { view: FinancialsView; note?: string }): string {
  const search = new URLSearchParams();
  if (params.view === 'common-size') {
    search.set('view', 'common-size');
  }
  if (params.note) {
    search.set('note', params.note);
  }
  const query = search.toString();
  return query ? `?${query}` : '?';
}

const PERIOD_OPTIONS = [
  { id: 'annual', label: 'Annual' },
  { id: 'quarterly', label: 'Quarterly' },
];

const responsiveGridStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'grid',
  gap: spacingTokens['4'],
  width: '100%',
  boxSizing: 'border-box',
};

const thStyle: CSSProperties = {
  textAlign: 'right',
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
};

const tdStyle: CSSProperties = {
  textAlign: 'right',
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
  color: colorTokens.text.inverse,
};

const conceptCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
  color: colorTokens.accent.muted,
  fontSize: typographyTokens.fontSize.xs,
};

const trendCellStyle: CSSProperties = {
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
  verticalAlign: 'middle',
};

const yoyLineStyle: CSSProperties = {
  display: 'block',
  fontSize: typographyTokens.fontSize.xs,
  fontWeight: typographyTokens.fontWeight.medium,
  marginTop: spacingTokens['1'],
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '720px',
};

const noteIconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.sm,
  background: 'transparent',
  cursor: 'pointer',
  color: colorTokens.accent.muted,
  fontSize: typographyTokens.fontSize.xs,
  padding: 0,
  verticalAlign: 'middle',
  marginLeft: spacingTokens['2'],
};

const viewToggleContainerStyle: CSSProperties = {
  display: 'inline-flex',
  gap: spacingTokens['1'],
  padding: spacingTokens['1'],
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  borderRadius: radiusTokens.lg,
  border: `1px solid ${colorTokens.border.strong}`,
};

function viewToggleButtonStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-block',
    padding: `${spacingTokens['2']} ${spacingTokens['5']}`,
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: active ? typographyTokens.fontWeight.semibold : typographyTokens.fontWeight.medium,
    borderRadius: radiusTokens.md,
    background: active ? colorTokens.surface.dark4 : 'transparent',
    color: active ? colorTokens.text.inverse : colorTokens.accent.muted,
    textDecoration: 'none',
    border: 'none',
  };
}

const INFO_ICON = '\u2139';

export default async function CompanyAnnualFinancialsPage({ params, searchParams }: FinancialsPageProps): Promise<JSX.Element> {
  const { companyId } = await params;
  const { note: activeNoteLabel, view: rawView } = await searchParams;
  const view = parseFinancialsView(rawView);

  try {
    const statementsView = await getAnnualStatements(companyId);

    const analyticsByStatement = new Map<
      StatementId,
      { yoy: YoYDeltasByRow[]; commonSize: CommonSizeRow[]; trend: TrendSeries[] }
    >();
    for (const statement of statementsView.statements) {
      analyticsByStatement.set(statement.id, {
        yoy: computeYoYDeltas(statement.rows, statementsView.years),
        commonSize: computeCommonSize(statement.id, statement.rows),
        trend: buildTrendSeries(statement.rows, statementsView.years),
      });
    }

    /* Resolve note panel data when a row label is selected via ?note= param */
    let notePanelData: { label: string; conceptUsed: string | null; notes: NoteItem[] } | null = null;
    if (activeNoteLabel) {
      const decodedLabel = decodeURIComponent(activeNoteLabel);
      for (const statement of statementsView.statements) {
        const matchedRow = statement.rows.find((r) => r.label === decodedLabel);
        if (matchedRow) {
          const result = matchedRow.conceptUsed ? getNotesForConcept(matchedRow.conceptUsed) : null;
          notePanelData = {
            label: matchedRow.label,
            conceptUsed: matchedRow.conceptUsed,
            notes: result?.disclosures ?? [],
          };
          break;
        }
      }
    }

    return (
      <main style={shellStyle}>
        <div style={responsiveGridStyle}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: typographyTokens.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: colorTokens.accent.muted }}>Premium table UX</p>
            <h1 style={{ margin: `${spacingTokens['3']} 0 ${spacingTokens['1']}`, fontSize: typographyTokens.fontSize['3xl'] }}>Annual financials</h1>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>
              {statementsView.companyName} · CIK {statementsView.cik}
            </p>
            <p style={{ margin: `${spacingTokens['2']} 0 0`, color: statementsView.consistency.balanceCheck === 'mismatch' ? colorTokens.semantic.danger : colorTokens.accent.muted, fontSize: typographyTokens.fontSize.sm }}>
              Balance consistency: {statementsView.consistency.message}
            </p>
            <p style={{ margin: `${spacingTokens['2']} 0 0`, color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>
              Source: <a href={statementsView.sourceUrl} style={{ color: colorTokens.accent.muted }}>SEC XBRL companyfacts</a> · fetched {statementsView.fetchedAt}
            </p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Period toggle</h2>
            <PeriodToggle periods={PERIOD_OPTIONS} activePeriodId="annual" />
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>View</h2>
            <div role="group" aria-label="View toggle" style={viewToggleContainerStyle}>
              <a
                href={buildLinkHref({ view: 'absolute' })}
                aria-current={view === 'absolute' ? 'page' : undefined}
                data-testid="view-toggle-absolute"
                style={viewToggleButtonStyle(view === 'absolute')}
              >
                Absolute
              </a>
              <a
                href={buildLinkHref({ view: 'common-size' })}
                aria-current={view === 'common-size' ? 'page' : undefined}
                data-testid="view-toggle-common-size"
                style={viewToggleButtonStyle(view === 'common-size')}
              >
                Common-size
              </a>
            </div>
            <p style={{ margin: `${spacingTokens['3']} 0 0`, color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>
              Common-size divides each income-statement line by {COMMON_SIZE_DENOMINATOR.income}, each balance-sheet line by {COMMON_SIZE_DENOMINATOR.balance}, and each cash-flow line by {COMMON_SIZE_DENOMINATOR.cashflow} for that fiscal year.
            </p>
          </section>

          {statementsView.statements.map((statement) => {
            const analytics = analyticsByStatement.get(statement.id);
            return (
              <FinancialsTableShell key={statement.id} title={statement.title}>
                <table style={tableStyle} data-export="financials-data">
                  <thead style={stickyTheadStyle}>
                    <tr style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                      <th style={{ textAlign: 'left', padding: `${spacingTokens['3']} ${spacingTokens['3']}` }}>Metric</th>
                      {statementsView.years.map((year) => (
                        <th key={year} style={thStyle}>
                          FY {year}
                        </th>
                      ))}
                      <th style={{ textAlign: 'left', padding: `${spacingTokens['3']} ${spacingTokens['3']}` }}>Trend</th>
                      <th style={{ textAlign: 'left', padding: `${spacingTokens['3']} ${spacingTokens['3']}` }}>Source concept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.rows.map((row) => {
                      const yoyForRow = analytics?.yoy.find((y) => y.label === row.label)?.deltasByYear ?? {};
                      const commonSizeForRow = analytics?.commonSize.find((c) => c.label === row.label)?.percentByYear ?? {};
                      const trendForRow = analytics?.trend.find((t) => t.label === row.label)?.points ?? [];

                      return (
                        <tr key={row.label} style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                          <th style={{ textAlign: 'left', padding: `${spacingTokens['3']} ${spacingTokens['3']}`, fontWeight: typographyTokens.fontWeight.semibold }}>
                            {row.label}
                            {row.conceptUsed && (
                              <a
                                href={
                                  view === 'common-size'
                                    ? `?view=common-size&note=${encodeURIComponent(row.label)}`
                                    : `?note=${encodeURIComponent(row.label)}`
                                }
                                style={noteIconButtonStyle}
                                aria-label={`View notes for ${row.label}`}
                                data-testid={`note-icon-${row.label.replace(/\s+/g, '-').toLowerCase()}`}
                                title={`View note disclosures for ${row.label}`}
                              >
                                {INFO_ICON}
                              </a>
                            )}
                          </th>
                          {statementsView.years.map((year) => {
                            const absoluteValue = row.valuesByYear[year];
                            const displayValue =
                              view === 'common-size'
                                ? formatCommonSizePercent(commonSizeForRow[year])
                                : formatMoney(absoluteValue);
                            const delta = yoyForRow[year];
                            const yoyLine = formatYoyDelta(delta?.percentChange);
                            return (
                              <td key={year} style={tdStyle}>
                                <span>{displayValue}</span>
                                {yoyLine && (
                                  <span
                                    style={{ ...yoyLineStyle, color: yoyDeltaColor(delta?.percentChange) }}
                                    data-testid={`yoy-${row.label.replace(/\s+/g, '-').toLowerCase()}-${year}`}
                                  >
                                    {yoyLine}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td style={trendCellStyle} data-testid={`trend-${row.label.replace(/\s+/g, '-').toLowerCase()}`}>
                            <TrendSparkline label={row.label} points={trendForRow} />
                          </td>
                          <td style={conceptCellStyle}>{row.conceptUsed ?? '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </FinancialsTableShell>
            );
          })}

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Sticky headers</h2>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>
              Table headers remain visible while scrolling through financial data rows.
            </p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Export-friendly layout</h2>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>
              Clean table structure with semantic markup supports copy-to-spreadsheet and print workflows.
            </p>
          </section>

          <section style={{ ...cardStyle, color: colorTokens.text.inverse }}>
            <h2 style={{ marginTop: 0, color: colorTokens.text.inverse }}>Responsive</h2>
            <p style={{ margin: 0 }}>
              Tables scroll horizontally on narrow viewports while the page layout adapts to available width.
            </p>
          </section>
        </div>

        {notePanelData && (
          <NotesPanel
            lineItemLabel={notePanelData.label}
            conceptUsed={notePanelData.conceptUsed}
            notes={notePanelData.notes}
            open={true}
          />
        )}
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Annual financials unavailable</h1>
          <p style={{ margin: 0, color: colorTokens.text.inverse }}>
            Real annual statement data could not be loaded for company id <strong>{companyId}</strong>.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
