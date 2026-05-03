import { Fragment } from 'react';

import {
  PageContainer,
  SectionHeader,
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@data-dogs/ui';

import { pricingPlans } from '../../lib/marketing/plans';

import styles from './page.module.css';

export const metadata = {
  title: 'Pricing — Ibis',
  description:
    'Seat-based pricing for the Ibis SEC filings platform. Researcher $99/mo, Team $499/mo, or custom Enterprise.',
};

const featureMatrix = [
  {
    group: 'Data',
    rows: [
      { label: 'SEC filing coverage (10-K, 10-Q, 8-K, DEF 14A, 3/4/5)', researcher: true, team: true, enterprise: true },
      { label: 'Standardized fundamentals', researcher: true, team: true, enterprise: true },
      { label: 'Executive compensation', researcher: true, team: true, enterprise: true },
      { label: 'Insider transactions', researcher: true, team: true, enterprise: true },
      { label: '6-field provenance on every fact', researcher: true, team: true, enterprise: true },
      { label: 'Point-in-time / restatement-aware', researcher: true, team: true, enterprise: true },
    ],
  },
  {
    group: 'API & exports',
    rows: [
      { label: 'API requests / month', researcher: '100,000', team: '1,000,000', enterprise: 'Custom' },
      { label: 'CSV exports', researcher: true, team: true, enterprise: true },
      { label: 'Parquet bulk exports', researcher: false, team: true, enterprise: true },
      { label: 'Webhook / streaming feeds', researcher: false, team: false, enterprise: true },
    ],
  },
  {
    group: 'Workspace',
    rows: [
      { label: 'Seats included', researcher: '1', team: '5', enterprise: 'Custom' },
      { label: 'Shared peer sets & saved screens', researcher: false, team: true, enterprise: true },
      { label: 'Audit-ready export bundles', researcher: false, team: true, enterprise: true },
    ],
  },
  {
    group: 'Support & compliance',
    rows: [
      { label: 'Email support', researcher: true, team: true, enterprise: true },
      { label: 'Priority Slack support', researcher: false, team: true, enterprise: true },
      { label: 'SSO (Okta / Azure AD / Google)', researcher: false, team: false, enterprise: true },
      { label: '99.9% uptime SLA', researcher: false, team: false, enterprise: true },
      { label: 'Procurement, security & legal review', researcher: false, team: false, enterprise: true },
    ],
  },
] as const;

const faq = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — 14 days on Researcher and Team. Full data access, full API. No card required to start.',
  },
  {
    q: 'How does billing work?',
    a: 'Monthly or annual on Researcher and Team. Annual is billed up front and saves two months. Enterprise is invoiced on net-30 terms.',
  },
  {
    q: 'What happens if we exceed our API quota?',
    a: 'Requests over the monthly cap return a 429 with a Retry-After header. We do not silently degrade. Quota top-ups and overage pricing are available on Team and Enterprise.',
  },
  {
    q: 'Where does the data come from?',
    a: 'Every fact is derived from SEC EDGAR filings. Each fact carries six fields of provenance (source URL, accession, fetch timestamp, SHA-256 checksum, parser version, job ID) so it can be traced back to the raw artifact.',
  },
  {
    q: 'Can we self-host or get a private deployment?',
    a: 'Yes, on Enterprise. We support dedicated environments, custom feeds, and on-premise / VPC deployments where required.',
  },
];

export default function PricingPage() {
  return (
    <PageContainer>
      <main id="main-content" className={styles.pageMain}>
        <header className={styles.heroHeader}>
          <p className={styles.heroEyebrow}>Pricing</p>
          <h1 className={styles.heroTitle}>Simple, seat-based pricing</h1>
          <p className={styles.heroSubtitle}>
            Same data, same provenance, same API on every plan. Pay for seats and request volume.
          </p>
        </header>

        <section aria-label="Plans" className={styles.plansGrid}>
          {pricingPlans.map((plan) => (
            <article
              key={plan.slug}
              className={
                plan.featured
                  ? `${styles.planCard} ${styles.planCardFeatured}`
                  : styles.planCard
              }
              aria-label={`${plan.name} plan`}
            >
              {plan.featured ? (
                <span className={styles.planBadge}>Most popular</span>
              ) : null}
              <p className={styles.planName}>{plan.name}</p>
              <p className={styles.planPriceRow}>
                <span className={styles.planPrice}>{plan.price}</span>
                {plan.cadence ? (
                  <span className={styles.planCadence}>{plan.cadence}</span>
                ) : null}
              </p>
              <p className={styles.planTagline}>{plan.tagline}</p>
              <ul className={styles.planBullets}>
                {plan.bullets.map((b) => (
                  <li key={b}>
                    <span aria-hidden="true" className={styles.planCheck}>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={
                  plan.featured ? styles.planCtaPrimary : styles.planCtaSecondary
                }
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </section>

        <hr className={styles.sectionDivider} />

        <section aria-label="Feature comparison">
          <SectionHeader
            title="What's included on every plan"
            subtitle="Capability differences live below — every plan ships the same data and the same provenance guarantees."
          />
          <div className={styles.matrixWrap}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th scope="col" className={styles.matrixGroupHead}>
                    Feature
                  </th>
                  <th scope="col">Researcher</th>
                  <th scope="col" className={styles.matrixFeaturedCol}>
                    Team
                  </th>
                  <th scope="col">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((group) => (
                  <Fragment key={group.group}>
                    <tr className={styles.matrixGroupRow}>
                      <th scope="rowgroup" colSpan={4}>
                        {group.group}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={`${group.group}-${row.label}`}>
                        <th scope="row" className={styles.matrixRowHead}>
                          {row.label}
                        </th>
                        <td>
                          <Cell value={row.researcher} />
                        </td>
                        <td className={styles.matrixFeaturedCol}>
                          <Cell value={row.team} />
                        </td>
                        <td>
                          <Cell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className={styles.sectionDivider} />

        <section aria-label="Frequently asked questions">
          <SectionHeader
            title="Common questions"
            subtitle="If you don't see your question here, talk to sales — we answer in less than a business day."
          />
          <dl className={styles.faqList}>
            {faq.map((item) => (
              <div key={item.q} className={styles.faqItem}>
                <dt className={styles.faqQ}>{item.q}</dt>
                <dd className={styles.faqA}>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-label="Final call to action"
          style={{
            textAlign: 'center',
            padding: `${spacingTokens['10']} ${spacingTokens['6']}`,
            marginTop: spacingTokens['8'],
            background: colorTokens.surface.elevated,
            border: `1px solid ${colorTokens.border.subtle}`,
            borderRadius: radiusTokens.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: typographyTokens.fontSize['2xl'],
              fontWeight: typographyTokens.fontWeight.semibold,
              color: colorTokens.text.primary,
              letterSpacing: '-0.005em',
            }}
          >
            Ready to start?
          </h2>
          <p
            style={{
              margin: `${spacingTokens['3']} auto 0`,
              maxWidth: '40rem',
              fontSize: typographyTokens.fontSize.md,
              color: colorTokens.text.secondary,
            }}
          >
            14 days on Researcher or Team. No credit card required to start the trial.
          </p>
          <div
            role="group"
            aria-label="Pricing call to action"
            style={{
              display: 'flex',
              gap: spacingTokens['3'],
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: spacingTokens['5'],
            }}
          >
            <a href="/signup?plan=researcher" className={styles.planCtaPrimary}>
              Start a 14-day trial
            </a>
            <a href="/contact?plan=enterprise" className={styles.planCtaSecondary}>
              Talk to sales
            </a>
          </div>
        </section>
      </main>
    </PageContainer>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span aria-label="Included" className={styles.cellYes}>
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span aria-label="Not included" className={styles.cellNo}>
        —
      </span>
    );
  }
  return <span className={styles.cellText}>{value}</span>;
}
