import {
  PageContainer,
  SectionHeader,
  StatCard,
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from '@data-dogs/ui';

import styles from './page.module.css';

const apiEndpoints = [
  { path: '/api/v1/companies', description: 'Issuer profiles and identifiers' },
  { path: '/api/v1/filings', description: 'Filing metadata and access' },
  { path: '/api/v1/financials', description: 'Standardized financial statements' },
  { path: '/api/v1/compensation', description: 'Executive compensation facts' },
  { path: '/api/v1/insiders', description: 'Insider transaction summaries' },
  { path: '/api/v1/screener', description: 'Fundamental screening queries' }
] as const;

const provenanceFields = [
  { label: 'Source URL', detail: 'SEC EDGAR URL of the raw artifact' },
  { label: 'Accession number', detail: 'SEC-assigned unique filing identifier' },
  { label: 'Fetch timestamp', detail: 'When the artifact was retrieved' },
  { label: 'SHA-256 checksum', detail: 'Integrity proof of the raw artifact' },
  { label: 'Parser version', detail: 'Which parser version extracted the fact' },
  { label: 'Job ID', detail: 'The pipeline run that produced the fact' }
] as const;

const pipelineSteps = [
  {
    step: '1',
    title: 'Ingest',
    description: 'SEC EDGAR filing fetched with full provenance metadata.'
  },
  {
    step: '2',
    title: 'Parse',
    description: 'XBRL and proxy disclosures extracted by deterministic parsers.'
  },
  {
    step: '3',
    title: 'Serve',
    description: 'Standardized facts available via API and research UI, each linked to source.'
  }
] as const;

const cardStyle = {
  backgroundColor: colorTokens.surface.card,
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  boxShadow: shadowTokens.sm,
  padding: spacingTokens['5']
} as const;

export default function MarketingPage() {
  return (
    <PageContainer>
      <main style={{ display: 'flex', flexDirection: 'column', gap: spacingTokens['10'] }}>

        {/* Section 1: Trust Signal (Hero) */}
        <section>
          <SectionHeader
            title="SEC filings → verified financial facts"
            subtitle="Every fact traced to source URL, accession number, fetch timestamp, checksum, parser version, and job ID."
            level={1}
          />
          <div className={styles.statsGrid} style={{ gap: spacingTokens['4'] }}>
            <StatCard
              label="Filing types ingested"
              value="10-K, 10-Q, 8-K, DEF 14A"
              delta="Annual, quarterly, current, and proxy reports"
            />
            <StatCard
              label="Provenance fields per fact"
              value="6"
              delta="Source URL, accession, timestamp, checksum, parser version, job ID"
            />
            <StatCard
              label="Point-in-time guarantee"
              value="Zero look-ahead"
              delta="Every query reflects only what was knowable at that moment"
            />
          </div>
        </section>

        {/* Section 2: Filings to Facts */}
        <section>
          <SectionHeader
            title="From raw filing to structured fact"
            subtitle="Deterministic extraction, not LLM guesswork."
          />
          <div className={styles.statsGrid} style={{ gap: spacingTokens['4'] }}>
            {pipelineSteps.map((s) => (
              <article key={s.step} style={cardStyle}>
                <p
                  style={{
                    margin: 0,
                    fontSize: typographyTokens.fontSize.sm,
                    color: colorTokens.accent.muted,
                    fontWeight: typographyTokens.fontWeight.semibold
                  }}
                >
                  Step {s.step}
                </p>
                <p
                  style={{
                    margin: `${spacingTokens['2']} 0`,
                    fontSize: typographyTokens.fontSize.xl,
                    fontWeight: typographyTokens.fontWeight.semibold,
                    color: colorTokens.text.primary
                  }}
                >
                  {s.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: typographyTokens.fontSize.sm,
                    color: colorTokens.text.secondary,
                    lineHeight: typographyTokens.lineHeight.relaxed
                  }}
                >
                  {s.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Section 3: Compensation & Insider Modules */}
        <section>
          <SectionHeader
            title="Executive compensation and insider activity"
            subtitle="Pay and trading data traced directly to SEC filings."
          />
          <div className={styles.twoColGrid} style={{ gap: spacingTokens['4'] }}>
            <article style={cardStyle}>
              <p
                style={{
                  margin: 0,
                  fontSize: typographyTokens.fontSize.lg,
                  fontWeight: typographyTokens.fontWeight.semibold,
                  color: colorTokens.text.primary
                }}
              >
                Compensation
              </p>
              <p
                style={{
                  margin: `${spacingTokens['2']} 0 0`,
                  fontSize: typographyTokens.fontSize.sm,
                  color: colorTokens.text.secondary,
                  lineHeight: typographyTokens.lineHeight.relaxed
                }}
              >
                Named executive officer pay extracted from DEF 14A proxy filings.
                Each compensation fact is source-linked to the specific proxy disclosure section.
              </p>
            </article>
            <article style={cardStyle}>
              <p
                style={{
                  margin: 0,
                  fontSize: typographyTokens.fontSize.lg,
                  fontWeight: typographyTokens.fontWeight.semibold,
                  color: colorTokens.text.primary
                }}
              >
                Insiders
              </p>
              <p
                style={{
                  margin: `${spacingTokens['2']} 0 0`,
                  fontSize: typographyTokens.fontSize.sm,
                  color: colorTokens.text.secondary,
                  lineHeight: typographyTokens.lineHeight.relaxed
                }}
              >
                Forms 3, 4, and 5 transaction summaries with filing-level provenance.
                Every insider transaction links back to its SEC source filing.
              </p>
            </article>
          </div>
        </section>

        {/* Section 4: Provenance Story */}
        <section>
          <SectionHeader
            title="Every number has a receipt"
            subtitle="Full audit trail, restatement-aware, reproducible."
          />
          <div className={styles.provenanceGrid} style={{ gap: spacingTokens['3'] }}>
            {provenanceFields.map((field) => (
              <article key={field.label} style={cardStyle}>
                <p
                  style={{
                    margin: 0,
                    fontSize: typographyTokens.fontSize.sm,
                    fontWeight: typographyTokens.fontWeight.semibold,
                    color: colorTokens.text.primary
                  }}
                >
                  {field.label}
                </p>
                <p
                  style={{
                    margin: `${spacingTokens['1']} 0 0`,
                    fontSize: typographyTokens.fontSize.sm,
                    color: colorTokens.text.secondary
                  }}
                >
                  {field.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Section 5: API Story */}
        <section>
          <SectionHeader
            title="Programmatic access to filing-derived data"
            subtitle="Every API response includes provenance metadata."
          />
          <div className={styles.apiGrid} style={{ gap: spacingTokens['3'] }}>
            {apiEndpoints.map((ep) => (
              <article key={ep.path} style={cardStyle}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: typographyTokens.fontFamily.mono,
                    fontSize: typographyTokens.fontSize.sm,
                    fontWeight: typographyTokens.fontWeight.medium,
                    color: colorTokens.text.primary
                  }}
                >
                  {ep.path}
                </p>
                <p
                  style={{
                    margin: `${spacingTokens['1']} 0 0`,
                    fontSize: typographyTokens.fontSize.sm,
                    color: colorTokens.text.secondary
                  }}
                >
                  {ep.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Section 6: Call to Action */}
        <section
          style={{
            textAlign: 'center',
            padding: `${spacingTokens['12']} 0`
          }}
        >
          <SectionHeader
            title="Start with the data"
            subtitle="No sign-up walls for public filing data."
          />
          <div
            style={{
              display: 'flex',
              gap: spacingTokens['4'],
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <a
              href="/overview"
              style={{
                display: 'inline-block',
                padding: `${spacingTokens['3']} ${spacingTokens['6']}`,
                backgroundColor: colorTokens.surface.inverse,
                color: colorTokens.text.inverse,
                borderRadius: radiusTokens.md,
                fontSize: typographyTokens.fontSize.md,
                fontWeight: typographyTokens.fontWeight.semibold,
                textDecoration: 'none'
              }}
            >
              Explore the terminal
            </a>
            <a
              href="/docs/api"
              style={{
                display: 'inline-block',
                padding: `${spacingTokens['3']} ${spacingTokens['6']}`,
                backgroundColor: colorTokens.surface.card,
                color: colorTokens.text.primary,
                border: `1px solid ${colorTokens.border.default}`,
                borderRadius: radiusTokens.md,
                fontSize: typographyTokens.fontSize.md,
                fontWeight: typographyTokens.fontWeight.semibold,
                textDecoration: 'none'
              }}
            >
              Read the API docs
            </a>
          </div>
        </section>

      </main>
    </PageContainer>
  );
}
