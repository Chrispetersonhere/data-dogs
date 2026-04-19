import type { CSSProperties, JSX } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../../packages/ui/src/styles/tokens';
import {
  INSIDER_ROLE_FILTERS,
  getCompanyInsiders,
  normalizeInsiderRoleFilter,
  type InsiderActivityRow,
  type InsiderRoleFilter,
} from '../../../../lib/api/insiders';

type InsidersPageProps = {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ role?: string }>;
};

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(145deg, ${colorTokens.surface.inverse} 0%, #111827 45%, #1e293b 100%)`,
  color: colorTokens.text.inverse,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.xl,
  padding: spacingTokens['5'],
  background: 'rgba(15, 23, 42, 0.72)',
};

const thCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: spacingTokens['2'],
  whiteSpace: 'nowrap',
};

const tdCellStyle: CSSProperties = {
  padding: spacingTokens['2'],
  verticalAlign: 'top',
};

const ROLE_LABELS: Record<InsiderRoleFilter, string> = {
  all: 'All roles',
  director: 'Director',
  officer: 'Officer',
  ten_percent_owner: '10% owner',
  other: 'Other',
};

function formatSigned(value: number | null, acquiredOrDisposed: 'A' | 'D' | null): string {
  if (value === null) {
    return '—';
  }
  const sign = acquiredOrDisposed === 'D' ? '-' : acquiredOrDisposed === 'A' ? '+' : '';
  return `${sign}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value)}`;
}

function formatPrice(value: number | null): string {
  if (value === null || value === 0) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);
}

function roleSummary(row: InsiderActivityRow): string {
  const labels: string[] = [];
  if (row.roles.isDirector) labels.push('Director');
  if (row.roles.isOfficer) labels.push(row.officerTitle ? `Officer (${row.officerTitle})` : 'Officer');
  if (row.roles.isTenPercentOwner) labels.push('10% owner');
  if (row.roles.isOther) labels.push('Other');
  return labels.length > 0 ? labels.join(', ') : '—';
}

function buildRoleHref(companyId: string, role: InsiderRoleFilter): string {
  if (role === 'all') {
    return `/company/${encodeURIComponent(companyId)}/insiders`;
  }
  return `/company/${encodeURIComponent(companyId)}/insiders?role=${encodeURIComponent(role)}`;
}

export default async function CompanyInsidersPage({ params, searchParams }: InsidersPageProps): Promise<JSX.Element> {
  const { companyId } = await params;
  const { role: roleParam } = await searchParams;
  const role = normalizeInsiderRoleFilter(roleParam);

  try {
    const data = await getCompanyInsiders(companyId, role);

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: spacingTokens['5'] }}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: typographyTokens.fontSize.xs, letterSpacing: '0.08em', textTransform: 'uppercase', color: colorTokens.accent.muted }}>
              Premium layout
            </p>
            <h1 style={{ margin: `${spacingTokens['3']} 0 ${spacingTokens['1']}`, fontSize: typographyTokens.fontSize['3xl'] }}>
              Insider activity — {data.companyName}
            </h1>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>
              SEC Form 3/4/5 transactions for CIK {data.cik}. Rows are sorted newest transaction first; every row links back to the source filing.
            </p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Role filter</h2>
            <p style={{ margin: `0 0 ${spacingTokens['3']} 0`, color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.sm }}>
              Filter by the reporting person&apos;s relationship to the issuer, as declared in the reportingOwnerRelationship section of each Form 3, 4, or 5.
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: spacingTokens['2'] }}>
              {INSIDER_ROLE_FILTERS.map((option) => {
                const active = option === data.role;
                return (
                  <li key={option}>
                    <a
                      href={buildRoleHref(companyId, option)}
                      data-active={active ? 'true' : 'false'}
                      style={{
                        display: 'inline-block',
                        padding: `${spacingTokens['2']} ${spacingTokens['3']}`,
                        borderRadius: radiusTokens.pill,
                        border: `1px solid ${active ? colorTokens.accent.soft : colorTokens.border.strong}`,
                        background: active ? colorTokens.accent.soft : 'transparent',
                        color: active ? colorTokens.text.primary : colorTokens.text.inverse,
                        textDecoration: 'none',
                        fontSize: typographyTokens.fontSize.sm,
                      }}
                    >
                      {ROLE_LABELS[option]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest activity</h2>
            {data.rows.length === 0 ? (
              <p style={{ margin: 0 }}>
                No Form 3/4/5 transactions were parseable from recent SEC submissions for the selected role.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                      <th style={thCellStyle}>Transaction date</th>
                      <th style={thCellStyle}>Reporter</th>
                      <th style={thCellStyle}>Role</th>
                      <th style={thCellStyle}>Security</th>
                      <th style={thCellStyle}>Code</th>
                      <th style={thCellStyle}>Shares</th>
                      <th style={thCellStyle}>Price</th>
                      <th style={thCellStyle}>Form</th>
                      <th style={thCellStyle}>Filing date</th>
                      <th style={thCellStyle}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, index) => (
                      <tr
                        key={`${row.accession}-${row.reporterName}-${row.transactionDate}-${row.transactionCode ?? 'none'}-${row.isDerivative ? 'd' : 'n'}-${index}`}
                        style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}
                      >
                        <td style={tdCellStyle}>{row.transactionDate}</td>
                        <td style={tdCellStyle}>{row.reporterName}</td>
                        <td style={tdCellStyle}>{roleSummary(row)}</td>
                        <td style={tdCellStyle}>
                          {row.securityTitle ?? '—'}
                          {row.isDerivative ? ` (derivative)` : ''}
                        </td>
                        <td style={tdCellStyle}>{row.transactionCode ?? '—'}</td>
                        <td style={tdCellStyle}>{formatSigned(row.shares, row.acquiredOrDisposed)}</td>
                        <td style={tdCellStyle}>{formatPrice(row.pricePerShare)}</td>
                        <td style={tdCellStyle}>{row.form}</td>
                        <td style={tdCellStyle}>{row.filingDate}</td>
                        <td style={tdCellStyle}>
                          <a
                            href={row.primaryDocUrl}
                            title={row.accession}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: colorTokens.accent.soft }}
                          >
                            source link
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Filing drilldown</h2>
            {data.sources.length === 0 ? (
              <p style={{ margin: 0 }}>No Form 3/4/5 filings were found in the most recent SEC submissions feed.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: spacingTokens['2'] }}>
                {data.sources.map((source) => (
                  <li key={source.accession}>
                    {source.filingDate} · Form {source.form} ·{' '}
                    <a
                      href={source.primaryDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: colorTokens.accent.soft }}
                    >
                      {source.accession}
                    </a>{' '}
                    (
                    <a
                      href={source.filingIndexUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: colorTokens.accent.soft }}
                    >
                      filing index
                    </a>
                    )
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '860px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Insider activity unavailable</h1>
          <p style={{ margin: 0 }}>
            Live insider transaction data fetch failed for company id <strong>{companyId}</strong>. Please retry once SEC submissions are reachable.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
