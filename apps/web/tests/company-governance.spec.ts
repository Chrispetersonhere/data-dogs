import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  INSIDER_FORMS,
  PROXY_FORMS,
  summarizeGovernance,
  type GovernanceCardsProps,
  type GovernanceOverviewInput,
} from '../../../packages/ui/src/components/company/governanceCards';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENT_PATH = resolve(
  __dirname,
  '../../../packages/ui/src/components/company/governanceCards.tsx',
);
const PAGE_PATH = resolve(__dirname, '../app/company/[companyId]/page.tsx');

const REQUIRED_CARD_TEXT = [
  'Governance and ownership',
  'CEO and board chair structure',
  'Recent insider activity',
  'Compensation highlights',
  'DEF 14A',
  'Forms 3, 4 and 5',
  'Schedules 13D and 13G',
  'Summary Compensation Table',
  'data-testid="governance-cards"',
  'data-testid="governance-card"',
] as const;

const FORBIDDEN_CARD_TEXT = ['TODO', 'Coming soon', 'Placeholder', 'lorem'] as const;

export function assertGovernanceCardsSource(source: string): void {
  for (const fragment of REQUIRED_CARD_TEXT) {
    if (!source.includes(fragment)) {
      throw new Error(`Missing required governance cards fragment: ${fragment}`);
    }
  }
  for (const fragment of FORBIDDEN_CARD_TEXT) {
    if (source.includes(fragment)) {
      throw new Error(`Found forbidden fragment in governance cards: ${fragment}`);
    }
  }
}

const SAMPLE_OVERVIEW: GovernanceOverviewInput = {
  issuerMetadata: {
    name: 'Apple Inc.',
    stateOfIncorporation: 'CA',
    fiscalYearEnd: '0930',
  },
  latestFilingsSummary: [
    { accessionNumber: '0000320193-24-000123', filingDate: '2024-11-01', form: '10-K' },
    { accessionNumber: '0000320193-24-000124', filingDate: '2024-10-15', form: '4' },
    { accessionNumber: '0000320193-24-000125', filingDate: '2024-08-02', form: '10-Q' },
    { accessionNumber: '0000320193-24-000126', filingDate: '2024-07-18', form: '4' },
    { accessionNumber: '0000320193-24-000127', filingDate: '2024-06-30', form: '8-K' },
    { accessionNumber: '0000320193-24-000128', filingDate: '2024-02-02', form: 'DEF 14A' },
    { accessionNumber: '0000320193-24-000129', filingDate: '2024-01-31', form: 'DEFA14A' },
    { accessionNumber: '0000320193-24-000130', filingDate: '2024-01-20', form: 'SC 13G/A' },
  ],
};

/* ------------------------------------------------------------------ */
/*  summarizeGovernance unit tests                                    */
/* ------------------------------------------------------------------ */

test('PROXY_FORMS covers the three proxy statement variants', () => {
  assert.deepEqual([...PROXY_FORMS].sort(), ['DEF 14A', 'DEFA14A', 'PRE 14A'].sort());
});

test('INSIDER_FORMS covers Forms 3/4/5 and Schedules 13D/13G with amendments', () => {
  for (const expected of ['3', '4', '5', 'SC 13D', 'SC 13G', 'SC 13D/A', 'SC 13G/A']) {
    assert.ok(INSIDER_FORMS.includes(expected), `${expected} should be classified as insider`);
  }
});

test('summarizeGovernance copies issuer metadata verbatim', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.equal(summary.companyName, 'Apple Inc.');
  assert.equal(summary.stateOfIncorporation, 'CA');
  assert.equal(summary.fiscalYearEnd, '0930');
});

test('summarizeGovernance reports sampleSize equal to filing count', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.equal(summary.sampleSize, SAMPLE_OVERVIEW.latestFilingsSummary.length);
});

test('summarizeGovernance counts insider filings including SC 13G/A', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.equal(summary.insiderFilingCount, 3);
});

test('summarizeGovernance counts proxy filings including DEFA14A', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.equal(summary.proxyFilingCount, 2);
});

test('summarizeGovernance picks the first insider filing as latest (feed order)', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.ok(summary.latestInsiderFiling);
  assert.equal(summary.latestInsiderFiling?.form, '4');
  assert.equal(summary.latestInsiderFiling?.filingDate, '2024-10-15');
  assert.equal(summary.latestInsiderFiling?.accessionNumber, '0000320193-24-000124');
});

test('summarizeGovernance picks the first proxy filing as latest (feed order)', () => {
  const summary = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.ok(summary.latestProxyFiling);
  assert.equal(summary.latestProxyFiling?.form, 'DEF 14A');
  assert.equal(summary.latestProxyFiling?.filingDate, '2024-02-02');
  assert.equal(summary.latestProxyFiling?.accessionNumber, '0000320193-24-000128');
});

test('summarizeGovernance returns null filings and zero counts when sample has none', () => {
  const summary = summarizeGovernance({
    issuerMetadata: { name: 'NoFilings Co', stateOfIncorporation: null, fiscalYearEnd: null },
    latestFilingsSummary: [
      { accessionNumber: 'a-1', filingDate: '2024-01-01', form: '10-K' },
      { accessionNumber: 'a-2', filingDate: '2024-01-02', form: '10-Q' },
    ],
  });
  assert.equal(summary.insiderFilingCount, 0);
  assert.equal(summary.proxyFilingCount, 0);
  assert.equal(summary.latestInsiderFiling, null);
  assert.equal(summary.latestProxyFiling, null);
});

test('summarizeGovernance preserves null issuer metadata fields', () => {
  const summary = summarizeGovernance({
    issuerMetadata: { name: 'Anon Co', stateOfIncorporation: null, fiscalYearEnd: null },
    latestFilingsSummary: [],
  });
  assert.equal(summary.stateOfIncorporation, null);
  assert.equal(summary.fiscalYearEnd, null);
  assert.equal(summary.sampleSize, 0);
});

test('summarizeGovernance does not misclassify unknown forms as insider or proxy', () => {
  const summary = summarizeGovernance({
    issuerMetadata: { name: 'UnknownForms Co', stateOfIncorporation: 'DE', fiscalYearEnd: '1231' },
    latestFilingsSummary: [
      { accessionNumber: 'x-1', filingDate: '2024-05-05', form: 'S-1' },
      { accessionNumber: 'x-2', filingDate: '2024-05-06', form: '144' },
      { accessionNumber: 'x-3', filingDate: '2024-05-07', form: 'UPLOAD' },
    ],
  });
  assert.equal(summary.insiderFilingCount, 0);
  assert.equal(summary.proxyFilingCount, 0);
});

test('summarizeGovernance output matches GovernanceCardsProps shape', () => {
  const summary: GovernanceCardsProps = summarizeGovernance(SAMPLE_OVERVIEW);
  assert.equal(typeof summary.companyName, 'string');
  assert.equal(typeof summary.sampleSize, 'number');
  assert.equal(typeof summary.proxyFilingCount, 'number');
  assert.equal(typeof summary.insiderFilingCount, 'number');
});

/* ------------------------------------------------------------------ */
/*  Component source structural tests                                 */
/* ------------------------------------------------------------------ */

test('GovernanceCards source contains all required card topics and data hooks', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');
  assert.doesNotThrow(() => assertGovernanceCardsSource(source));
});

test('GovernanceCards source imports design tokens, not hardcoded colors', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');
  assert.ok(
    source.includes("from '../../styles/tokens'"),
    'GovernanceCards must import design tokens',
  );
  assert.ok(!/#[0-9a-f]{6}/i.test(source.replace(/rgba\([^)]*\)/g, '')), 'No raw hex colors outside rgba helpers');
});

test('GovernanceCards source mentions provenance for every card topic', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');
  assert.ok(source.includes('DEF 14A'), 'CEO/chair card must cite DEF 14A');
  assert.ok(source.includes('Summary Compensation Table'), 'Compensation card must cite SCT');
  assert.ok(
    source.includes('Forms 3, 4 and 5') && source.includes('Schedules 13D and 13G'),
    'Insider card must cite Forms 3/4/5 and Schedules 13D/13G',
  );
});

/* ------------------------------------------------------------------ */
/*  Page wiring tests                                                 */
/* ------------------------------------------------------------------ */

test('Company overview page imports GovernanceCards and summarizeGovernance', () => {
  const pageSource = readFileSync(PAGE_PATH, 'utf-8');
  assert.ok(
    pageSource.includes("from '../../../../../packages/ui/src/components/company/governanceCards'"),
    'Page must import from the new governanceCards module',
  );
  assert.ok(pageSource.includes('GovernanceCards'), 'Page must reference GovernanceCards');
  assert.ok(pageSource.includes('summarizeGovernance'), 'Page must call summarizeGovernance');
});

test('Company overview page renders GovernanceCards with summarized props', () => {
  const pageSource = readFileSync(PAGE_PATH, 'utf-8');
  assert.ok(
    pageSource.includes('<GovernanceCards {...summarizeGovernance(overview)} />'),
    'Page must spread summarizeGovernance(overview) into GovernanceCards',
  );
});

test('assertGovernanceCardsSource rejects source missing a required card topic', () => {
  assert.throws(
    () =>
      assertGovernanceCardsSource(
        '<h2>Governance and ownership</h2><p>CEO and board chair structure</p>',
      ),
    /Recent insider activity|Compensation highlights/,
  );
});

test('assertGovernanceCardsSource rejects source containing forbidden placeholder', () => {
  const markup = [
    'Governance and ownership',
    'CEO and board chair structure',
    'Recent insider activity',
    'Compensation highlights',
    'DEF 14A',
    'Forms 3, 4 and 5',
    'Schedules 13D and 13G',
    'Summary Compensation Table',
    'data-testid="governance-cards"',
    'data-testid="governance-card"',
    'TODO: finish later',
  ].join('\n');
  assert.throws(() => assertGovernanceCardsSource(markup), /TODO/);
});
