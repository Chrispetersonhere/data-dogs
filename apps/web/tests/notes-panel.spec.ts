import assert from 'node:assert/strict';
import test from 'node:test';

/*
 * Notes panel acceptance tests.
 *
 * Validates:
 * 1. The notes API layer correctly maps concepts to disclosures
 * 2. The NotesPanel component produces correct markup
 * 3. The financials page includes note-icon links
 * 4. Panel content is secondary to the primary financial table
 */

/* ------------------------------------------------------------------ */
/*  notes.ts API layer tests                                          */
/* ------------------------------------------------------------------ */

import { getNotesForConcept, getNotesForConcepts } from '../lib/api/notes';
import type { NoteDisclosure, NoteDisclosureResult } from '../lib/api/notes';

test('getNotesForConcept returns disclosures for Revenues', () => {
  const result: NoteDisclosureResult = getNotesForConcept('Revenues');
  assert.equal(result.queryConcept, 'Revenues');
  assert.equal(result.found, true);
  assert.ok(result.disclosures.length > 0, 'should have at least one disclosure');
  assert.equal(result.disclosures[0].concept, 'RevenueFromContractWithCustomerTextBlock');
  assert.equal(result.disclosures[0].title, 'Revenue recognition');
  assert.ok(result.disclosures[0].summary.length > 0, 'summary should not be empty');
  assert.ok(result.disclosures[0].taxonomySection.length > 0, 'taxonomySection should not be empty');
});

test('getNotesForConcept returns disclosures for NetIncomeLoss with multiple notes', () => {
  const result = getNotesForConcept('NetIncomeLoss');
  assert.equal(result.found, true);
  assert.ok(result.disclosures.length >= 2, 'NetIncomeLoss should link to at least 2 notes');
  const concepts = result.disclosures.map((d: NoteDisclosure) => d.concept);
  assert.ok(concepts.includes('IncomeTaxDisclosureTextBlock'));
  assert.ok(concepts.includes('EarningsPerShareTextBlock'));
});

test('getNotesForConcept returns disclosures for Liabilities with multiple notes', () => {
  const result = getNotesForConcept('Liabilities');
  assert.equal(result.found, true);
  assert.ok(result.disclosures.length >= 2);
  const concepts = result.disclosures.map((d: NoteDisclosure) => d.concept);
  assert.ok(concepts.includes('DebtDisclosureTextBlock'));
  assert.ok(concepts.includes('CommitmentsAndContingenciesDisclosureTextBlock'));
});

test('getNotesForConcept returns found=false for unknown concept', () => {
  const result = getNotesForConcept('NonExistentConcept');
  assert.equal(result.queryConcept, 'NonExistentConcept');
  assert.equal(result.found, false);
  assert.equal(result.disclosures.length, 0);
});

test('getNotesForConcept maps all revenue concept variants', () => {
  const variants = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'];
  for (const concept of variants) {
    const result = getNotesForConcept(concept);
    assert.equal(result.found, true, `${concept} should have linked notes`);
    assert.equal(result.disclosures[0].concept, 'RevenueFromContractWithCustomerTextBlock');
  }
});

test('getNotesForConcept maps balance sheet concepts', () => {
  const balanceConcepts = ['Assets', 'StockholdersEquity', 'CashAndCashEquivalentsAtCarryingValue'];
  for (const concept of balanceConcepts) {
    const result = getNotesForConcept(concept);
    assert.equal(result.found, true, `${concept} should have linked notes`);
    assert.ok(result.disclosures[0].title.length > 0);
  }
});

test('getNotesForConcept maps cash-flow concepts', () => {
  const cfConcepts = [
    'NetCashProvidedByUsedInOperatingActivities',
    'NetCashProvidedByUsedInInvestingActivities',
    'NetCashProvidedByUsedInFinancingActivities',
    'PaymentsToAcquirePropertyPlantAndEquipment',
  ];
  for (const concept of cfConcepts) {
    const result = getNotesForConcept(concept);
    assert.equal(result.found, true, `${concept} should have linked notes`);
  }
});

test('getNotesForConcepts de-duplicates disclosures', () => {
  const notes = getNotesForConcepts(['Revenues', 'SalesRevenueNet']);
  assert.equal(notes.length, 1, 'should de-duplicate identical note concepts');
  assert.equal(notes[0].concept, 'RevenueFromContractWithCustomerTextBlock');
});

test('getNotesForConcepts returns empty array for unknown concepts', () => {
  const notes = getNotesForConcepts(['FakeConcept1', 'FakeConcept2']);
  assert.equal(notes.length, 0);
});

test('getNotesForConcepts aggregates across different concepts', () => {
  const notes = getNotesForConcepts(['Revenues', 'Assets', 'PaymentsToAcquirePropertyPlantAndEquipment']);
  assert.ok(notes.length >= 3, 'should return disclosures from all three concepts');
  const concepts = notes.map((n: NoteDisclosure) => n.concept);
  assert.ok(concepts.includes('RevenueFromContractWithCustomerTextBlock'));
  assert.ok(concepts.includes('SignificantAccountingPoliciesTextBlock'));
  assert.ok(concepts.includes('PropertyPlantAndEquipmentDisclosureTextBlock'));
});

test('every disclosure has required fields', () => {
  const allConcepts = [
    'Revenues', 'GrossProfit', 'OperatingIncomeLoss', 'NetIncomeLoss',
    'Assets', 'Liabilities', 'StockholdersEquity',
    'NetCashProvidedByUsedInOperatingActivities',
    'PaymentsToAcquirePropertyPlantAndEquipment',
  ];
  for (const concept of allConcepts) {
    const result = getNotesForConcept(concept);
    for (const d of result.disclosures) {
      assert.ok(typeof d.concept === 'string' && d.concept.length > 0, `concept field for ${concept}`);
      assert.ok(typeof d.title === 'string' && d.title.length > 0, `title field for ${concept}`);
      assert.ok(typeof d.summary === 'string' && d.summary.length > 10, `summary field for ${concept}`);
      assert.ok(typeof d.taxonomySection === 'string' && d.taxonomySection.length > 0, `taxonomySection field for ${concept}`);
    }
  }
});

/* ------------------------------------------------------------------ */
/*  NotesPanel markup tests                                           */
/* ------------------------------------------------------------------ */

test('NotesPanel markup contains dialog role when open', () => {
  /*
   * Since we cannot render JSX directly in node:test, we validate by
   * reading the source file and checking structural properties.
   */
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes('role="dialog"'), 'Panel must use role="dialog"');
  assert.ok(panelSource.includes('data-testid="notes-panel"'), 'Panel must have data-testid');
  assert.ok(panelSource.includes('aria-label='), 'Panel must have aria-label');
});

test('NotesPanel returns null when open is false', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes('if (!open)'), 'Panel should check open prop');
  assert.ok(panelSource.includes('return null'), 'Panel should return null when closed');
});

test('NotesPanel renders empty state when no notes provided', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes('data-testid="notes-panel-empty"'), 'Panel must show empty state');
  assert.ok(
    panelSource.includes('No linked note disclosures'),
    'Empty state should have descriptive message'
  );
});

test('NotesPanel renders note cards with data-testid', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes('data-testid="notes-panel-card"'), 'Each note card must have data-testid');
});

test('NotesPanel uses design tokens (not hardcoded colors)', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes("from '../../styles/tokens'"), 'Must import design tokens');
  assert.ok(!panelSource.includes('#6b7280'), 'Must not hardcode gray hex');
  assert.ok(!panelSource.includes('#111827'), 'Must not hardcode dark hex');
});

test('NotesPanel is secondary — panel width is constrained', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes("width: '380px'"), 'Panel width should be constrained');
  assert.ok(panelSource.includes("maxWidth: '90vw'"), 'Panel should respect viewport');
});

test('NotesPanel shows taxonomy section in note cards', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  assert.ok(panelSource.includes('ASC {note.taxonomySection}'), 'Should display taxonomy section');
});

/* ------------------------------------------------------------------ */
/*  Financials page integration tests                                 */
/* ------------------------------------------------------------------ */

test('financials page includes note icon links', () => {
  const fs = require('node:fs');
  const pageSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../app/company/[companyId]/financials/page.tsx'),
    'utf-8'
  );
  assert.ok(pageSource.includes('note-icon-'), 'Page must render note icon data-testid attributes');
  assert.ok(pageSource.includes('View notes for'), 'Note icon must have descriptive aria-label');
  assert.ok(pageSource.includes('?note='), 'Note link must use ?note= search param');
});

test('financials page conditionally renders NotesPanel', () => {
  const fs = require('node:fs');
  const pageSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../app/company/[companyId]/financials/page.tsx'),
    'utf-8'
  );
  assert.ok(pageSource.includes('<NotesPanel'), 'Page must render NotesPanel component');
  assert.ok(pageSource.includes('notePanelData'), 'Page must check notePanelData before rendering');
});

test('financials page imports notes API', () => {
  const fs = require('node:fs');
  const pageSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../app/company/[companyId]/financials/page.tsx'),
    'utf-8'
  );
  assert.ok(pageSource.includes("from '../../../../lib/api/notes'"), 'Page must import notes API');
});

test('financials page only shows note icons for rows with a concept', () => {
  const fs = require('node:fs');
  const pageSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../app/company/[companyId]/financials/page.tsx'),
    'utf-8'
  );
  assert.ok(pageSource.includes('row.conceptUsed &&'), 'Note icon should only appear when concept exists');
});

test('financials page preserves primary table structure', () => {
  const fs = require('node:fs');
  const pageSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../app/company/[companyId]/financials/page.tsx'),
    'utf-8'
  );
  /* Ensure the core table structure is intact */
  assert.ok(pageSource.includes('data-export="financials-data"'), 'Table data-export attribute must remain');
  assert.ok(pageSource.includes('FinancialsTableShell'), 'FinancialsTableShell must still be used (provides data-export="financials-table")');
  assert.ok(pageSource.includes('PeriodToggle'), 'PeriodToggle must still be used');
  assert.ok(pageSource.includes('stickyTheadStyle'), 'Sticky headers must remain');
});

test('notes panel does not contain forbidden text', () => {
  const fs = require('node:fs');
  const panelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/NotesPanel.tsx'),
    'utf-8'
  );
  const forbidden = ['TODO', 'Placeholder', 'Coming soon', 'screener'];
  for (const text of forbidden) {
    assert.ok(!panelSource.toLowerCase().includes(text.toLowerCase()), `Notes panel must not contain: ${text}`);
  }
});

test('notes API does not contain forbidden text', () => {
  const fs = require('node:fs');
  const apiSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../lib/api/notes.ts'),
    'utf-8'
  );
  const forbidden = ['TODO', 'Placeholder', 'Coming soon', 'screener'];
  for (const text of forbidden) {
    assert.ok(!apiSource.toLowerCase().includes(text.toLowerCase()), `Notes API must not contain: ${text}`);
  }
});

/* ------------------------------------------------------------------ */
/*  UI package export tests                                           */
/* ------------------------------------------------------------------ */

test('notes component is exported from UI package index', () => {
  const fs = require('node:fs');
  const indexSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/index.ts'),
    'utf-8'
  );
  assert.ok(indexSource.includes("'./components/notes'"), 'UI index must re-export notes');
});

test('notes barrel export includes NotesPanel and NoteItem', () => {
  const fs = require('node:fs');
  const barrelSource = fs.readFileSync(
    require('node:path').resolve(__dirname, '../../../packages/ui/src/components/notes/index.ts'),
    'utf-8'
  );
  assert.ok(barrelSource.includes('NotesPanel'), 'Barrel must export NotesPanel');
  assert.ok(barrelSource.includes('NoteItem'), 'Barrel must export NoteItem type');
});

test('UI package.json has notes component export path', () => {
  const fs = require('node:fs');
  const pkgJson = JSON.parse(
    fs.readFileSync(
      require('node:path').resolve(__dirname, '../../../packages/ui/package.json'),
      'utf-8'
    )
  );
  assert.ok(
    pkgJson.exports['./components/notes'] !== undefined,
    'package.json must export ./components/notes'
  );
});
