import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKETING_PAGE_PATH = join(__dirname, '..', 'app', '(marketing)', 'page.tsx');
const MARKETING_CSS_PATH = join(__dirname, '..', 'app', '(marketing)', 'page.module.css');
const STAT_CARD_PATH = join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'ui', 'StatCard.tsx');
const PIPELINE_STEP_PATH = join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'marketing', 'PipelineStep.tsx');

const pageSource = readFileSync(MARKETING_PAGE_PATH, 'utf-8');
const cssSource = readFileSync(MARKETING_CSS_PATH, 'utf-8');
const statCardSource = readFileSync(STAT_CARD_PATH, 'utf-8');
const pipelineStepSource = readFileSync(PIPELINE_STEP_PATH, 'utf-8');

test('marketing page exposes a skip link targeting main content', () => {
  assert.ok(pageSource.includes('Skip to main content'), 'skip link text is required for keyboard users');
  assert.ok(pageSource.includes('href="#main-content"'), 'skip link should target the main landmark');
  assert.ok(pageSource.includes('id="main-content"'), 'main landmark id must exist');
});

test('CTA controls include an explicit group label for assistive tech', () => {
  assert.ok(pageSource.includes('role="group"'), 'CTA container should be grouped');
  assert.ok(pageSource.includes('aria-label="Primary actions"'), 'CTA group needs an accessible label');
});

test('interactive elements define visible focus states', () => {
  assert.ok(cssSource.includes('.skipLink:focus-visible'), 'skip link focus-visible style is required');
  assert.ok(cssSource.includes('.ctaPrimary:focus-visible'), 'primary CTA focus-visible style is required');
  assert.ok(cssSource.includes('.ctaSecondary:focus-visible'), 'secondary CTA focus-visible style is required');
  assert.ok(cssSource.includes('outline: 3px solid #475467'), 'CTA focus outline should be clearly visible');
});

test('marketing provenance label uses higher-contrast text color', () => {
  assert.ok(cssSource.includes('color: #344054;'), 'provenance label should use higher contrast color');
  assert.ok(!cssSource.includes('color: #7C8BA8;'), 'lower-contrast color should not be used for label text');
});

test('StatCard avoids muted low-contrast body copy colors', () => {
  assert.ok(statCardSource.includes('colorTokens.text.secondary'), 'StatCard label/delta should use secondary text color');
  assert.ok(!statCardSource.includes('colorTokens.text.muted'), 'StatCard should avoid muted text color for key copy');
  assert.ok(!statCardSource.includes('colorTokens.accent.muted'), 'StatCard should avoid accent-muted color for key copy');
});

test('PipelineStep uses readable contrast for step label', () => {
  assert.ok(pipelineStepSource.includes('color: colorTokens.text.secondary'), 'PipelineStep step label should use secondary text color');
  assert.ok(!pipelineStepSource.includes('color: colorTokens.accent.muted'), 'PipelineStep should avoid accent-muted color for step label');
});
