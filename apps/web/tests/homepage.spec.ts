import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_PATH = join(__dirname, '..', 'app', '(marketing)', 'page.tsx');
const CSS_PATH = join(__dirname, '..', 'app', '(marketing)', 'page.module.css');
const MARKETING_DIR = join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'marketing');

const pageSrc = readFileSync(PAGE_PATH, 'utf-8');
const cssSrc = readFileSync(CSS_PATH, 'utf-8');

/* ── Section presence ────────────────────────────────────── */

const REQUIRED_SECTIONS = [
  'SEC filings → verified financial facts',
  'From raw filing to structured fact',
  'Executive compensation and insider activity',
  'Every number has a receipt',
  'Programmatic access to filing-derived data',
  'Start with the data'
] as const;

for (const heading of REQUIRED_SECTIONS) {
  test(`homepage contains section: "${heading}"`, () => {
    assert.ok(pageSrc.includes(heading), `Missing section heading: ${heading}`);
  });
}

/* ── Key content fragments ───────────────────────────────── */

const REQUIRED_CONTENT = [
  'HeroHeadline',
  'PipelineStep',
  'ProvenanceField',
  'ApiEndpointCard',
  'FeatureCard',
  'StatCard',
  '/api/v1/companies',
  '/api/v1/filings',
  '/api/v1/financials',
  '/api/v1/compensation',
  '/api/v1/insiders',
  '/api/v1/screener',
  'Source URL',
  'Accession number',
  'Fetch timestamp',
  'SHA-256 checksum',
  'Parser version',
  'Job ID',
  'Explore the terminal',
  'Read the API docs',
  'Zero look-ahead'
] as const;

for (const fragment of REQUIRED_CONTENT) {
  test(`homepage contains content: "${fragment}"`, () => {
    assert.ok(pageSrc.includes(fragment), `Missing content: ${fragment}`);
  });
}

/* ── No forbidden patterns ───────────────────────────────── */

const FORBIDDEN_PATTERNS = [
  'revolutionary',
  'game-changing',
  'AI-powered',
  'trusted by',
  'testimonial'
] as const;

for (const pattern of FORBIDDEN_PATTERNS) {
  test(`homepage does not contain forbidden pattern: "${pattern}"`, () => {
    assert.ok(
      !pageSrc.toLowerCase().includes(pattern.toLowerCase()),
      `Forbidden pattern found: ${pattern}`
    );
  });
}

/* ── Provenance real-data example ────────────────────────── */

test('homepage includes real-data provenance example', () => {
  assert.ok(pageSrc.includes('sampleProvenance'), 'Missing real-data provenance sample');
  assert.ok(pageSrc.includes('0000320193-23-000106'), 'Provenance example should use a real accession number');
});

/* ── Responsiveness: CSS module has breakpoints ──────────── */

test('CSS module contains mobile-first grid (1fr default)', () => {
  assert.ok(cssSrc.includes('grid-template-columns: 1fr'), 'Missing mobile single-column grid');
});

test('CSS module contains tablet breakpoint (768px)', () => {
  assert.ok(cssSrc.includes('min-width: 768px'), 'Missing tablet breakpoint');
});

test('CSS module contains desktop breakpoint (1200px)', () => {
  assert.ok(cssSrc.includes('min-width: 1200px'), 'Missing desktop breakpoint');
});

/* ── Marketing components exist ──────────────────────────── */

const MARKETING_COMPONENTS = [
  'HeroHeadline.tsx',
  'PipelineStep.tsx',
  'ProvenanceField.tsx',
  'ApiEndpointCard.tsx',
  'FeatureCard.tsx',
  'index.ts'
] as const;

for (const file of MARKETING_COMPONENTS) {
  test(`marketing component exists: ${file}`, () => {
    const filePath = join(MARKETING_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    assert.ok(content.length > 0, `${file} should not be empty`);
  });
}

/* ── Marketing components use design tokens ──────────────── */

const TOKEN_COMPONENTS = [
  'HeroHeadline.tsx',
  'PipelineStep.tsx',
  'ProvenanceField.tsx',
  'ApiEndpointCard.tsx',
  'FeatureCard.tsx'
] as const;

for (const file of TOKEN_COMPONENTS) {
  test(`${file} imports design tokens`, () => {
    const content = readFileSync(join(MARKETING_DIR, file), 'utf-8');
    assert.ok(content.includes('tokens'), `${file} should import from design tokens`);
  });
}

/* ── Subtle motion, no flashy effects ────────────────────── */

test('marketing components use subtle transitions', () => {
  let hasTransition = false;
  for (const file of TOKEN_COMPONENTS) {
    const content = readFileSync(join(MARKETING_DIR, file), 'utf-8');
    if (content.includes('transition:')) {
      hasTransition = true;
      assert.ok(
        !content.includes('animation:') && !content.includes('@keyframes'),
        `${file} should not use keyframe animations (subtle motion only)`
      );
    }
  }
  assert.ok(hasTransition, 'At least one marketing component should have a subtle transition');
});

/* ── Section dividers for premium hierarchy ──────────────── */

test('CSS module includes section divider class', () => {
  assert.ok(cssSrc.includes('sectionDivider'), 'Missing .sectionDivider class for visual hierarchy');
});

test('homepage uses section dividers', () => {
  assert.ok(pageSrc.includes('sectionDivider'), 'Homepage should use sectionDivider between sections');
});
