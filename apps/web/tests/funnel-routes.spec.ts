import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, '..', 'app');
const HOMEPAGE = readFileSync(
  join(APP_DIR, '(marketing)', 'page.tsx'),
  'utf-8',
);
const PLANS = readFileSync(
  join(__dirname, '..', 'lib', 'marketing', 'plans.ts'),
  'utf-8',
);

/* ── Funnel pages exist ─────────────────────────────── */

const FUNNEL_PAGES = [
  '(marketing)/page.tsx',
  'overview/page.tsx',
  'overview/page.module.css',
  'pricing/page.tsx',
  'pricing/page.module.css',
  'signup/page.tsx',
  'signup/SignupForm.tsx',
  'signup/page.module.css',
  'contact/page.tsx',
  'contact/ContactForm.tsx',
  'contact/page.module.css',
  'api/v1/signup/route.ts',
  'api/v1/signup/helpers.ts',
  'api/v1/contact/route.ts',
  'api/v1/contact/helpers.ts',
] as const;

for (const file of FUNNEL_PAGES) {
  test(`funnel file exists: ${file}`, () => {
    const filePath = join(APP_DIR, file);
    assert.ok(existsSync(filePath), `${file} should exist at ${filePath}`);
    assert.ok(readFileSync(filePath, 'utf-8').length > 0, `${file} not empty`);
  });
}

/* ── Homepage CTAs map to real routes ───────────────── */

const HOMEPAGE_CTAS = [
  '/overview',
  '/docs/api',
  '/signup?plan=researcher',
  '/signup?plan=team',
  '/contact?plan=enterprise',
] as const;

for (const target of HOMEPAGE_CTAS) {
  test(`homepage references CTA target: ${target}`, () => {
    assert.ok(
      HOMEPAGE.includes(target) || PLANS.includes(target),
      `Expected homepage or plans module to reference ${target}`,
    );
  });
}

test('homepage no longer references fabricated coverage counts', () => {
  assert.ok(
    !HOMEPAGE.includes('12,847'),
    'placeholder issuer count must not appear',
  );
  assert.ok(
    !HOMEPAGE.includes('2.1M+'),
    'placeholder filing count must not appear',
  );
  assert.ok(
    !HOMEPAGE.includes('SOC 2 Type II in progress'),
    'unverified compliance claim must not appear',
  );
});

test('homepage imports shared pricingPlans module', () => {
  assert.ok(
    HOMEPAGE.includes("from '../../lib/marketing/plans'"),
    'homepage should import plans from shared module',
  );
});

/* ── Pricing plan data is single source of truth ────── */

test('pricing plans module exposes researcher / team / enterprise', () => {
  for (const slug of ['researcher', 'team', 'enterprise']) {
    assert.ok(PLANS.includes(`slug: '${slug}'`), `missing slug: ${slug}`);
  }
});

test('pricing plans CTAs point at funnel routes', () => {
  assert.ok(PLANS.includes('/signup?plan=researcher'));
  assert.ok(PLANS.includes('/signup?plan=team'));
  assert.ok(PLANS.includes('/contact?plan=enterprise'));
});

/* ── SEO foundations ────────────────────────────────── */

test('app/layout.tsx declares openGraph + twitter + metadataBase', () => {
  const layout = readFileSync(join(APP_DIR, 'layout.tsx'), 'utf-8');
  assert.ok(layout.includes('metadataBase'), 'metadataBase required');
  assert.ok(layout.includes('openGraph'), 'openGraph metadata required');
  assert.ok(layout.includes('twitter'), 'twitter metadata required');
  assert.ok(layout.includes('canonical'), 'canonical alternate required');
});

test('app/sitemap.ts and app/robots.ts exist', () => {
  assert.ok(existsSync(join(APP_DIR, 'sitemap.ts')));
  assert.ok(existsSync(join(APP_DIR, 'robots.ts')));
});

test('app/opengraph-image.tsx exists', () => {
  assert.ok(existsSync(join(APP_DIR, 'opengraph-image.tsx')));
});

test('app/icon.svg exists', () => {
  assert.ok(existsSync(join(APP_DIR, 'icon.svg')));
});

test('sitemap covers funnel routes', () => {
  const sitemap = readFileSync(join(APP_DIR, 'sitemap.ts'), 'utf-8');
  for (const path of ['/overview', '/pricing', '/signup', '/contact']) {
    assert.ok(sitemap.includes(`'${path}'`), `sitemap missing ${path}`);
  }
});

test('robots.ts disallows /admin and /api/', () => {
  const robots = readFileSync(join(APP_DIR, 'robots.ts'), 'utf-8');
  assert.ok(robots.includes('/admin'));
  assert.ok(robots.includes('/api/'));
});
