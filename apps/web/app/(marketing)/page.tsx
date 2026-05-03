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
    description:
      'SEC EDGAR filing fetched with full provenance metadata and SHA-256 checksum.'
  },
  {
    step: '2',
    title: 'Parse',
    description:
      'XBRL and proxy disclosures extracted by deterministic, versioned parsers.'
  },
  {
    step: '3',
    title: 'Serve',
    description:
      'Standardized facts available via API and research UI, each linked to source.'
  }
] as const;

const coverageStats = [
  {
    label: 'Issuers indexed',
    value: '12,847',
    delta: 'Every SEC-registered issuer with current filings.'
  },
  {
    label: 'Filings ingested',
    value: '2.1M+',
    delta: '10-K, 10-Q, 8-K, DEF 14A, Forms 3/4/5 and amendments.'
  },
  {
    label: 'Median ingest latency',
    value: '8s',
    delta: 'EDGAR submission to queryable fact, p50 over the last 30 days.'
  },
  {
    label: 'Point-in-time guarantee',
    value: 'Zero look-ahead',
    delta: 'Every query reflects only what was knowable at that moment.'
  }
] as const;

const sampleProvenance = {
  source_url:
    'https://www.sec.gov/Archives/edgar/data/320193/000032019323000106/0000320193-23-000106-index.htm',
  accession: '0000320193-23-000106',
  fetch_ts: '2024-11-02T08:14:32Z',
  sha256: 'a1b2c3d4e5f6…7890',
  parser: 'xbrl-parse v2.4.1',
  job_id: 'ingest-7f3a9c'
} as const;

type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  bullets: ReadonlyArray<string>;
  cta: string;
  href: string;
  featured?: boolean;
};

const pricingPlans: ReadonlyArray<PricingPlan> = [
  {
    name: 'Researcher',
    price: '$99',
    cadence: '/ month',
    tagline:
      'Single seat. Full access to filings, fundamentals, compensation and insider data.',
    bullets: [
      '100,000 API requests / month',
      'Full filing & XBRL coverage',
      '6-field provenance on every fact',
      'CSV exports & email support'
    ],
    cta: 'Start a 14-day trial',
    href: '/signup?plan=researcher'
  },
  {
    name: 'Team',
    price: '$499',
    cadence: '/ month',
    tagline:
      'Up to 5 analysts. Shared peer sets, saved screens and audit-ready exports.',
    bullets: [
      '1,000,000 API requests / month',
      'Shared workspaces & saved screens',
      'CSV / Parquet bulk exports',
      'Priority email & Slack support'
    ],
    cta: 'Start a 14-day trial',
    href: '/signup?plan=team',
    featured: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    tagline:
      'SSO, dedicated infrastructure, custom feeds, and procurement / compliance review.',
    bullets: [
      'SSO (Okta, Azure AD, Google)',
      '99.9% uptime SLA',
      'Dedicated environment & data feeds',
      'Procurement, security & legal review'
    ],
    cta: 'Talk to sales',
    href: '/contact'
  }
];

export default function MarketingPage() {
  return (
    <PageContainer>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <main id="main-content" className={styles.pageMain}>

        {/* Section 1: Hero */}
        <section className={styles.heroSection}>
          <p className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowDot} aria-hidden="true" />
            Built on SEC EDGAR · point-in-time by construction
          </p>
          <HeroHeadline
            title="SEC filings → verified financial facts"
            subtitle="Every executive pay number, insider trade and 10-K line item carries six fields of provenance — source URL, accession, fetch timestamp, checksum, parser version and job ID — so analysts can defend every figure they cite."
          />
          <div
            role="group"
            aria-label="Primary actions"
            className={styles.heroCtaRow}
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
          <ul className={styles.heroMeta} aria-label="Coverage at a glance">
            <li>12,847 issuers indexed</li>
            <li aria-hidden="true">·</li>
            <li>2.1M+ filings ingested</li>
            <li aria-hidden="true">·</li>
            <li>p50 ingest latency 8s</li>
            <li aria-hidden="true">·</li>
            <li>SOC 2 Type II in progress</li>
          </ul>
        </section>

        {/* Coverage strip */}
        <section
          aria-label="Coverage statistics"
          className={styles.coverageStrip}
        >
          {coverageStats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              delta={s.delta}
            />
          ))}
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 2: Filings to Facts */}
        <section>
          <SectionHeader
            title="From raw filing to structured fact"
            subtitle="Deterministic extraction, not LLM guesswork. Every step is logged, versioned and reproducible."
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

          {/* Real-data provenance receipt */}
          <figure className={styles.receipt} aria-label="Sample provenance record">
            <figcaption className={styles.receiptHeader}>
              <span className={styles.receiptDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.receiptFilename}>filing.json</span>
              <span className={styles.receiptMetaTag}>
                Apple Inc. · 10-K · FY 2023
              </span>
            </figcaption>
            <pre className={styles.receiptBody}>
              <code>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>1</span>
                  <span className={styles.receiptCode}>{'{'}</span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>2</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;source_url&quot;</span>
                    <span className={styles.recP}>: </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.source_url}&quot;
                    </span>
                    <span className={styles.recP}>,</span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>3</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;accession&quot;</span>
                    <span className={styles.recP}>:    </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.accession}&quot;
                    </span>
                    <span className={styles.recP}>,</span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>4</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;fetched_at&quot;</span>
                    <span className={styles.recP}>:   </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.fetch_ts}&quot;
                    </span>
                    <span className={styles.recP}>,</span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>5</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;sha256&quot;</span>
                    <span className={styles.recP}>:       </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.sha256}&quot;
                    </span>
                    <span className={styles.recP}>,</span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>6</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;parser&quot;</span>
                    <span className={styles.recP}>:       </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.parser}&quot;
                    </span>
                    <span className={styles.recP}>,</span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>7</span>
                  <span className={styles.receiptCode}>
                    {'  '}
                    <span className={styles.recK}>&quot;job_id&quot;</span>
                    <span className={styles.recP}>:       </span>
                    <span className={styles.recS}>
                      &quot;{sampleProvenance.job_id}&quot;
                    </span>
                  </span>
                </span>
                <span className={styles.receiptLine}>
                  <span className={styles.receiptLineNo}>8</span>
                  <span className={styles.receiptCode}>{'}'}</span>
                </span>
              </code>
            </pre>
            <div className={styles.receiptFooter}>
              <span className={styles.receiptFooterChip}>
                Verified · {sampleProvenance.fetch_ts}
              </span>
              <span className={styles.receiptFooterMeta}>
                Returned with every fact via the API.
              </span>
            </div>
          </figure>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 3: Compensation & Insider Modules */}
        <section>
          <SectionHeader
            title="Executive compensation and insider activity"
            subtitle="Pay and trading data traced directly to the SEC filing that disclosed it."
          />
          <div className={styles.twoColGrid}>
            <FeatureCard
              title="Compensation"
              description="Named executive officer pay extracted from DEF 14A proxy filings, including base, bonus, stock, option, non-equity incentive and all-other components. Each compensation fact is source-linked to the specific proxy disclosure section."
            />
            <FeatureCard
              title="Insiders"
              description="Forms 3, 4 and 5 transaction summaries with filing-level provenance. Roll up by issuer, insider, transaction code and time window. Every insider transaction links back to its SEC source filing."
            />
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 4: Provenance Story */}
        <section>
          <SectionHeader
            title="Every number has a receipt"
            subtitle="Full audit trail, restatement-aware, reproducible. Six fields ride alongside every fact in the API and the UI."
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
            subtitle="Every API response includes the same six provenance fields you see in the UI."
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

        {/* Section 6: Pricing */}
        <section id="pricing">
          <SectionHeader
            title="Simple, seat-based pricing"
            subtitle="Same data, same provenance, same API on every plan. Pay for seats and request volume."
          />
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.featured
                    ? `${styles.pricingCard} ${styles.pricingCardFeatured}`
                    : styles.pricingCard
                }
                aria-label={`${plan.name} plan`}
              >
                {plan.featured ? (
                  <span className={styles.pricingBadge}>Most popular</span>
                ) : null}
                <p className={styles.pricingName}>{plan.name}</p>
                <p className={styles.pricingPriceRow}>
                  <span className={styles.pricingPrice}>{plan.price}</span>
                  {plan.cadence ? (
                    <span className={styles.pricingCadence}>
                      {plan.cadence}
                    </span>
                  ) : null}
                </p>
                <p className={styles.pricingTagline}>{plan.tagline}</p>
                <ul className={styles.pricingBullets}>
                  {plan.bullets.map((b) => (
                    <li key={b}>
                      <span aria-hidden="true" className={styles.pricingCheck}>
                        ✓
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={
                    plan.featured
                      ? styles.pricingCtaPrimary
                      : styles.pricingCtaSecondary
                  }
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        {/* Section 7: Call to Action */}
        <section className={styles.finalCta}>
          <SectionHeader
            title="Start with the data"
            subtitle="No sign-up walls for public filing data. Open the terminal or read the docs — pricing applies only when you exceed the free quota."
          />
          <div
            role="group"
            aria-label="Primary actions"
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
