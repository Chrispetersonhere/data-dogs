import type { CSSProperties, JSX } from 'react';

import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '../../styles/tokens';

export type GovernanceFiling = {
  form: string;
  filingDate: string;
  accessionNumber: string;
};

export type GovernanceCardsProps = {
  companyName: string;
  stateOfIncorporation: string | null;
  fiscalYearEnd: string | null;
  sampleSize: number;
  latestProxyFiling: GovernanceFiling | null;
  proxyFilingCount: number;
  latestInsiderFiling: GovernanceFiling | null;
  insiderFilingCount: number;
};

export type GovernanceOverviewInput = {
  issuerMetadata: {
    name: string;
    stateOfIncorporation: string | null;
    fiscalYearEnd: string | null;
  };
  latestFilingsSummary: ReadonlyArray<{
    accessionNumber: string;
    filingDate: string;
    form: string;
  }>;
};

export const PROXY_FORMS: ReadonlyArray<string> = ['DEF 14A', 'DEFA14A', 'PRE 14A'];

export const INSIDER_FORMS: ReadonlyArray<string> = [
  '3',
  '3/A',
  '4',
  '4/A',
  '5',
  '5/A',
  'SC 13D',
  'SC 13D/A',
  'SC 13G',
  'SC 13G/A',
];

export function summarizeGovernance(overview: GovernanceOverviewInput): GovernanceCardsProps {
  const proxyMatches = overview.latestFilingsSummary.filter((filing) =>
    PROXY_FORMS.includes(filing.form),
  );
  const insiderMatches = overview.latestFilingsSummary.filter((filing) =>
    INSIDER_FORMS.includes(filing.form),
  );

  return {
    companyName: overview.issuerMetadata.name,
    stateOfIncorporation: overview.issuerMetadata.stateOfIncorporation,
    fiscalYearEnd: overview.issuerMetadata.fiscalYearEnd,
    sampleSize: overview.latestFilingsSummary.length,
    latestProxyFiling: proxyMatches[0]
      ? {
          form: proxyMatches[0].form,
          filingDate: proxyMatches[0].filingDate,
          accessionNumber: proxyMatches[0].accessionNumber,
        }
      : null,
    proxyFilingCount: proxyMatches.length,
    latestInsiderFiling: insiderMatches[0]
      ? {
          form: insiderMatches[0].form,
          filingDate: insiderMatches[0].filingDate,
          accessionNumber: insiderMatches[0].accessionNumber,
        }
      : null,
    insiderFilingCount: insiderMatches.length,
  };
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.xl,
  padding: spacingTokens['5'],
  background: 'rgba(15, 23, 42, 0.72)',
  color: colorTokens.text.inverse,
  display: 'flex',
  flexDirection: 'column',
  gap: spacingTokens['3'],
};

const kickerStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.xs,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colorTokens.accent.muted,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.lg,
  fontWeight: typographyTokens.fontWeight.semibold,
};

const leadStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.sm,
  color: colorTokens.text.inverse,
};

const factListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: spacingTokens['2'],
};

const factLabelStyle: CSSProperties = {
  color: colorTokens.accent.muted,
  fontSize: typographyTokens.fontSize.xs,
};

const factValueStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.sm,
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize['2xl'],
};

const provenanceStyle: CSSProperties = {
  margin: `${spacingTokens['1']} 0 ${spacingTokens['3']}`,
  fontSize: typographyTokens.fontSize.xs,
  color: colorTokens.accent.muted,
};

function valueOrDash(value: string | null): string {
  return value && value.trim().length > 0 ? value : '—';
}

function filingLine(filing: GovernanceFiling | null): string {
  if (!filing) {
    return '—';
  }
  return `${filing.form} · ${filing.filingDate} · ${filing.accessionNumber}`;
}

type CardContent = {
  kicker: string;
  title: string;
  lead: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
};

function buildCards(props: GovernanceCardsProps): ReadonlyArray<CardContent> {
  const sampleLabel =
    props.sampleSize > 0 ? `latest ${props.sampleSize} sampled filings` : 'the sampled filings';

  return [
    {
      kicker: 'Governance',
      title: 'CEO and board chair structure',
      lead: 'Management roster and board chair designation are disclosed annually in the DEF 14A proxy statement.',
      facts: [
        { label: 'Registered issuer', value: props.companyName },
        { label: 'State of incorporation', value: valueOrDash(props.stateOfIncorporation) },
        { label: 'Fiscal year end', value: valueOrDash(props.fiscalYearEnd) },
        { label: 'Latest DEF 14A on file', value: filingLine(props.latestProxyFiling) },
      ],
    },
    {
      kicker: 'Ownership',
      title: 'Recent insider activity',
      lead: 'Insider transactions are reported on Forms 3, 4 and 5; beneficial ownership above 5% is reported on Schedules 13D and 13G.',
      facts: [
        {
          label: `Insider and ownership filings in ${sampleLabel}`,
          value: String(props.insiderFilingCount),
        },
        { label: 'Most recent insider filing', value: filingLine(props.latestInsiderFiling) },
      ],
    },
    {
      kicker: 'Compensation',
      title: 'Compensation highlights',
      lead: 'Named executive officer pay is disclosed in the Summary Compensation Table of the DEF 14A proxy statement.',
      facts: [
        {
          label: `Proxy filings in ${sampleLabel}`,
          value: String(props.proxyFilingCount),
        },
        { label: 'Most recent proxy filing', value: filingLine(props.latestProxyFiling) },
      ],
    },
  ];
}

export function GovernanceCards(props: GovernanceCardsProps): JSX.Element {
  const cards = buildCards(props);

  return (
    <section data-testid="governance-cards" aria-label="Governance and ownership">
      <h2 style={headingStyle}>Governance and ownership</h2>
      <p style={provenanceStyle}>
        Derived from SEC submissions metadata for {props.companyName}. Cards summarise filings
        already listed above; deeper data is served by the compensation and insiders pages.
      </p>
      <div style={gridStyle}>
        {cards.map((card) => (
          <article key={card.title} data-testid="governance-card" style={cardStyle}>
            <p style={kickerStyle}>{card.kicker}</p>
            <h3 style={titleStyle}>{card.title}</h3>
            <p style={leadStyle}>{card.lead}</p>
            <dl style={factListStyle}>
              {card.facts.map((fact) => (
                <div key={fact.label}>
                  <dt style={factLabelStyle}>{fact.label}</dt>
                  <dd style={factValueStyle}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
