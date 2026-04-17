import {
  ApiEndpointCard,
  FeatureCard,
  HeroHeadline,
  PageContainer,
  PipelineStep,
  ProvenanceField,
  SectionHeader,
  StatCard,
  colorTokens,
  radiusTokens,
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

const sampleProvenance = {
  source_url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019323000106/0000320193-23-000106-index.htm',
  accession: '0000320193-23-000106',
  fetch_ts: '2024-11-02T08:14:32Z',
  sha256: 'a1b2c3d4e5f6…7890',
  parser: 'xbrl-parse v2.4.1',
  job_id: 'ingest-7f3a9c'
} as const;

export default function MarketingPage() {
  return (
    <PageContainer>
      <main className={styles.pageMain}>

        {/* Section 1: Trust Signal (Hero) */}
        <section className={styles.heroSection}>
          <HeroHeadline
            title="SEC filings → verified financial facts"
            subtitle="Every fact traced to source URL, accession number, fetch timestamp, checksum, parser version, and job ID."
          />
          <div className={styles.statsGrid}>
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

        <hr className={styles.sectionDivider} />

        {/* Section 2: Filings to Facts */}
        <section>
          <SectionHeader
            title="From raw filing to structured fact"
            subtitle="Deterministic extraction, not LLM guesswork."
          />
          <div className={styles.statsGrid}>
            {pipelineSteps.map((s) => (
              <PipelineStep
                key={s.step}
                step={s.step}
                title={s.title}
                description={s.description}
              />
            ))}
          </div>

          {/* Real-data provenance example */}
          <div className={styles.provenanceExample}>
            <p className={styles.provenanceExampleLabel}>
              Sample provenance record — Apple Inc. 10-K (FY 2023)
            </p>
            <pre className={styles.provenanceExamplePre}>
{`{
  "source_url": "${sampleProvenance.source_url}",
  "accession":  "${sampleProvenance.accession}",
  "fetched_at": "${sampleProvenance.fetch_ts}",
  "sha256":     "${sampleProvenance.sha256}",
  "parser":     "${sampleProvenance.parser}",
  "job_id":     "${sampleProvenance.job_id}"
}`}
            </pre>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 3: Compensation & Insider Modules */}
        <section>
          <SectionHeader
            title="Executive compensation and insider activity"
            subtitle="Pay and trading data traced directly to SEC filings."
          />
          <div className={styles.twoColGrid}>
            <FeatureCard
              title="Compensation"
              description="Named executive officer pay extracted from DEF 14A proxy filings. Each compensation fact is source-linked to the specific proxy disclosure section."
            />
            <FeatureCard
              title="Insiders"
              description="Forms 3, 4, and 5 transaction summaries with filing-level provenance. Every insider transaction links back to its SEC source filing."
            />
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 4: Provenance Story */}
        <section>
          <SectionHeader
            title="Every number has a receipt"
            subtitle="Full audit trail, restatement-aware, reproducible."
          />
          <div className={styles.provenanceGrid}>
            {provenanceFields.map((field) => (
              <ProvenanceField
                key={field.label}
                label={field.label}
                detail={field.detail}
              />
            ))}
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 5: API Story */}
        <section>
          <SectionHeader
            title="Programmatic access to filing-derived data"
            subtitle="Every API response includes provenance metadata."
          />
          <div className={styles.apiGrid}>
            {apiEndpoints.map((ep) => (
              <ApiEndpointCard
                key={ep.path}
                path={ep.path}
                description={ep.description}
              />
            ))}
          </div>
        </section>

        <hr className={styles.sectionDivider} />

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
              className={styles.ctaPrimary}
              style={{
                display: 'inline-block',
                padding: `${spacingTokens['3']} ${spacingTokens['6']}`,
                backgroundColor: colorTokens.surface.inverse,
                color: colorTokens.text.inverse,
                borderRadius: radiusTokens.md,
                fontSize: typographyTokens.fontSize.md,
                fontWeight: typographyTokens.fontWeight.semibold,
                textDecoration: 'none',
                transition: 'opacity 0.15s ease'
              }}
            >
              Explore the terminal
            </a>
            <a
              href="/docs/api"
              className={styles.ctaSecondary}
              style={{
                display: 'inline-block',
                padding: `${spacingTokens['3']} ${spacingTokens['6']}`,
                backgroundColor: colorTokens.surface.card,
                color: colorTokens.text.primary,
                border: `1px solid ${colorTokens.border.default}`,
                borderRadius: radiusTokens.md,
                fontSize: typographyTokens.fontSize.md,
                fontWeight: typographyTokens.fontWeight.semibold,
                textDecoration: 'none',
                transition: 'border-color 0.15s ease'
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
