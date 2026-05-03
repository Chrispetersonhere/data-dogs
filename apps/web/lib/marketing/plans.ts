/**
 * Pricing-plan data shared by the homepage pricing section and the
 * dedicated /pricing page. Single source of truth so both surfaces
 * cannot drift.
 */

export type PricingPlanSlug = 'researcher' | 'team' | 'enterprise';

export type PricingPlan = {
  slug: PricingPlanSlug;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  bullets: ReadonlyArray<string>;
  cta: string;
  href: string;
  featured?: boolean;
};

export const pricingPlans: ReadonlyArray<PricingPlan> = [
  {
    slug: 'researcher',
    name: 'Researcher',
    price: '$99',
    cadence: '/ month',
    tagline:
      'Single seat. Full access to filings, fundamentals, compensation and insider data.',
    bullets: [
      '100,000 API requests / month',
      'Full filing & XBRL coverage',
      '6-field provenance on every fact',
      'CSV exports & email support',
    ],
    cta: 'Start a 14-day trial',
    href: '/signup?plan=researcher',
  },
  {
    slug: 'team',
    name: 'Team',
    price: '$499',
    cadence: '/ month',
    tagline:
      'Up to 5 analysts. Shared peer sets, saved screens and audit-ready exports.',
    bullets: [
      '1,000,000 API requests / month',
      'Shared workspaces & saved screens',
      'CSV / Parquet bulk exports',
      'Priority email & Slack support',
    ],
    cta: 'Start a 14-day trial',
    href: '/signup?plan=team',
    featured: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    tagline:
      'SSO, dedicated infrastructure, custom feeds, and procurement / compliance review.',
    bullets: [
      'SSO (Okta, Azure AD, Google)',
      '99.9% uptime SLA',
      'Dedicated environment & data feeds',
      'Procurement, security & legal review',
    ],
    cta: 'Talk to sales',
    href: '/contact?plan=enterprise',
  },
];

export function getPlanBySlug(slug: string): PricingPlan | null {
  const found = pricingPlans.find((p) => p.slug === slug);
  return found ?? null;
}
