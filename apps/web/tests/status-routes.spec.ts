import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, '..', 'app');

test('app/status/page.tsx exists and uses the status snapshot', () => {
  const file = join(APP_DIR, 'status', 'page.tsx');
  assert.ok(existsSync(file), 'status page must exist');
  const src = readFileSync(file, 'utf-8');
  assert.ok(
    src.includes("from '../../lib/status/snapshot'"),
    'status page should import from lib/status/snapshot',
  );
  assert.ok(src.includes('getStatusSnapshot'), 'should call getStatusSnapshot');
  assert.ok(src.includes('Form-type freshness'));
  assert.ok(src.includes('Recent jobs'));
});

test('app/status/page.module.css exists', () => {
  assert.ok(existsSync(join(APP_DIR, 'status', 'page.module.css')));
});

test('GET /api/v1/status route exists', () => {
  const file = join(APP_DIR, 'api', 'v1', 'status', 'route.ts');
  assert.ok(existsSync(file), 'status API route must exist');
  const src = readFileSync(file, 'utf-8');
  assert.ok(src.includes('export async function GET'));
  assert.ok(src.includes('getStatusSnapshot'));
});

test('app/layout.tsx wires the topnav to the status snapshot', () => {
  const layout = readFileSync(join(APP_DIR, 'layout.tsx'), 'utf-8');
  assert.ok(layout.includes('getStatusSnapshot'));
  assert.ok(layout.includes('formatLatestIngest'));
  assert.ok(layout.includes('ingestTimestamp='));
  assert.ok(layout.includes('medianLatencySeconds='));
});

test('SiteTopNav freshness badge links to /status', () => {
  const navPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'ui',
    'src',
    'components',
    'layout',
    'SiteTopNav.tsx',
  );
  const src = readFileSync(navPath, 'utf-8');
  assert.ok(
    src.includes('href="/status"'),
    'topnav freshness badge should link to /status',
  );
});

test('sitemap covers /status', () => {
  const sitemap = readFileSync(join(APP_DIR, 'sitemap.ts'), 'utf-8');
  assert.ok(sitemap.includes("'/status'"));
});
