import type { CSSProperties, JSX } from 'react';

type FinancialsPageProps = {
  params: Promise<{ companyId: string }>;
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
  id: 'income' | 'balance' | 'cashflow';
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
  years: number[];
  statements: Array<{
    title: string;
    id: 'income' | 'balance' | 'cashflow';
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
  background: 'linear-gradient(145deg, #0f172a 0%, #111827 45%, #1f2937 100%)',
  color: '#e2e8f0',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '28px',
};

const cardStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.30)',
  borderRadius: '14px',
  background: 'rgba(15, 23, 42, 0.78)',
  padding: '18px',
};

const premiumTableWrapStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(99, 102, 241, 0.45)',
  background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
  overflowX: 'auto',
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
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SEC companyfacts request failed (${response.status}) for CIK ${cikPadded}`);
  }

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
    years,
    statements,
    consistency: summarizeConsistency(statements, years),
  };
}

function formatMoney(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function CompanyAnnualFinancialsPage({ params }: FinancialsPageProps): Promise<JSX.Element> {
  const { companyId } = await params;

  try {
    const view = await getAnnualStatements(companyId);

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '16px' }}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b5fd' }}>Premium table UX</p>
            <h1 style={{ margin: '10px 0 4px', fontSize: '30px' }}>Annual financials</h1>
            <p style={{ margin: 0, color: '#cbd5e1' }}>
              {view.companyName} · CIK {view.cik}
            </p>
            <p style={{ margin: '8px 0 0', color: view.consistency.balanceCheck === 'mismatch' ? '#fca5a5' : '#a5b4fc', fontSize: '13px' }}>
              Balance consistency: {view.consistency.message}
            </p>
          </section>

          {view.statements.map((statement) => (
            <section key={statement.id} style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>{statement.title}</h2>
              <div style={premiumTableWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.35)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Metric</th>
                      {view.years.map((year) => (
                        <th key={year} style={{ textAlign: 'right', padding: '10px 12px' }}>
                          FY {year}
                        </th>
                      ))}
                      <th style={{ textAlign: 'left', padding: '10px 12px' }}>Source concept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.rows.map((row) => (
                      <tr key={row.label} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>{row.label}</th>
                        {view.years.map((year) => (
                          <td key={year} style={{ textAlign: 'right', padding: '10px 12px', color: '#e2e8f0' }}>
                            {formatMoney(row.valuesByYear[year])}
                          </td>
                        ))}
                        <td style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{row.conceptUsed ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Annual financials unavailable</h1>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Real annual statement data could not be loaded for company id <strong>{companyId}</strong>.
          </p>
          <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
