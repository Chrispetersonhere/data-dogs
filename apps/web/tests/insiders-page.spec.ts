import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  INSIDER_ROLE_FILTERS,
  compareInsiderRowsChronologically,
  filterInsiderActivityRows,
  normalizeInsiderRoleFilter,
  parseInsiderActivityForTest,
  rolesMatchFilter,
  type InsiderActivityRow,
} from '../lib/api/insiders';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_PATH = join(__dirname, '..', 'app', 'company', '[companyId]', 'insiders', 'page.tsx');
const pageSrc = readFileSync(PAGE_PATH, 'utf-8');

const REQUIRED_TEXT = [
  'Premium layout',
  'Insider activity',
  'Role filter',
  'Latest activity',
  'Filing drilldown',
  'Transaction date',
  'Reporter',
  'Role',
  'Form',
  'Source',
  'source link',
  'filing index',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon', 'TODO'] as const;

export function assertInsidersPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required insiders page text: ${fragment}`);
    }
  }
  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden placeholder text: ${fragment}`);
    }
  }
}

test('assertInsidersPageMarkup accepts a complete insiders page', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h1>Insider activity</h1>
      <h2>Role filter</h2>
      <h2>Latest activity</h2>
      <h2>Filing drilldown</h2>
      <table>
        <tr>
          <th>Transaction date</th>
          <th>Reporter</th>
          <th>Role</th>
          <th>Form</th>
          <th>Source</th>
        </tr>
      </table>
      <a>source link</a>
      <a>filing index</a>
    </main>
  `;
  assert.doesNotThrow(() => assertInsidersPageMarkup(markup));
});

test('assertInsidersPageMarkup rejects markup missing Filing drilldown', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h1>Insider activity</h1>
      <h2>Role filter</h2>
      <h2>Latest activity</h2>
      <table>
        <tr>
          <th>Transaction date</th>
          <th>Reporter</th>
          <th>Role</th>
          <th>Form</th>
          <th>Source</th>
        </tr>
      </table>
      <a>source link</a>
      <a>filing index</a>
    </main>
  `;
  assert.throws(() => assertInsidersPageMarkup(markup), /Filing drilldown/);
});

test('assertInsidersPageMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h1>Insider activity</h1>
      <h2>Role filter</h2>
      <h2>Latest activity</h2>
      <h2>Filing drilldown</h2>
      <p>TODO: fill in</p>
      <table>
        <tr>
          <th>Transaction date</th>
          <th>Reporter</th>
          <th>Role</th>
          <th>Form</th>
          <th>Source</th>
        </tr>
      </table>
      <a>source link</a>
      <a>filing index</a>
    </main>
  `;
  assert.throws(() => assertInsidersPageMarkup(markup), /forbidden placeholder text/);
});

test('insiders page source contains every required section, column, and source link', () => {
  assert.doesNotThrow(() => assertInsidersPageMarkup(pageSrc));
});

test('insiders page source sorts rows using the chronological comparator', () => {
  assert.ok(
    pageSrc.includes('compareInsiderRowsChronologically') || pageSrc.includes('getCompanyInsiders'),
    'Page should rely on the chronological ordering provided by the insiders API',
  );
  assert.ok(
    pageSrc.includes('getCompanyInsiders'),
    'Page should fetch its data via getCompanyInsiders (which applies chronological sort)',
  );
});

test('insiders page source renders premium layout and a filing drilldown section', () => {
  assert.ok(pageSrc.includes('Premium layout'), 'page should flag itself as premium layout');
  assert.ok(pageSrc.includes('Filing drilldown'), 'page should render a filing drilldown section');
  assert.ok(pageSrc.includes('primaryDocUrl'), 'page should expose the SEC primary-document URL per row');
  assert.ok(pageSrc.includes('filingIndexUrl'), 'page should expose the SEC filing index URL per source');
});

test('normalizeInsiderRoleFilter returns "all" for unknown, empty, or missing values', () => {
  assert.equal(normalizeInsiderRoleFilter(undefined), 'all');
  assert.equal(normalizeInsiderRoleFilter(null), 'all');
  assert.equal(normalizeInsiderRoleFilter(''), 'all');
  assert.equal(normalizeInsiderRoleFilter('everyone'), 'all');
});

test('normalizeInsiderRoleFilter accepts every canonical role keyword', () => {
  for (const role of INSIDER_ROLE_FILTERS) {
    assert.equal(normalizeInsiderRoleFilter(role), role);
    assert.equal(normalizeInsiderRoleFilter(role.toUpperCase()), role);
  }
});

test('rolesMatchFilter matches on the specific role flag only', () => {
  const directorOnly = {
    isDirector: true,
    isOfficer: false,
    isTenPercentOwner: false,
    isOther: false,
  };
  assert.equal(rolesMatchFilter(directorOnly, 'all'), true);
  assert.equal(rolesMatchFilter(directorOnly, 'director'), true);
  assert.equal(rolesMatchFilter(directorOnly, 'officer'), false);
  assert.equal(rolesMatchFilter(directorOnly, 'ten_percent_owner'), false);
  assert.equal(rolesMatchFilter(directorOnly, 'other'), false);
});

const SAMPLE_FORM4_XML = `
<?xml version="1.0"?>
<ownershipDocument>
  <reportingOwner>
    <reportingOwnerId>
      <rptOwnerCik>0001214156</rptOwnerCik>
      <rptOwnerName>Cook Timothy D</rptOwnerName>
    </reportingOwnerId>
    <reportingOwnerRelationship>
      <isDirector>0</isDirector>
      <isOfficer>1</isOfficer>
      <isTenPercentOwner>0</isTenPercentOwner>
      <isOther>0</isOther>
      <officerTitle>Chief Executive Officer</officerTitle>
    </reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2026-04-02</value></transactionDate>
      <transactionCoding>
        <transactionFormType>4</transactionFormType>
        <transactionCode>S</transactionCode>
      </transactionCoding>
      <transactionAmounts>
        <transactionShares><value>511000</value></transactionShares>
        <transactionPricePerShare><value>226.8755</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
      <postTransactionAmounts>
        <sharesOwnedFollowingTransaction><value>3280000</value></sharesOwnedFollowingTransaction>
      </postTransactionAmounts>
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2026-04-01</value></transactionDate>
      <transactionCoding>
        <transactionFormType>4</transactionFormType>
        <transactionCode>A</transactionCode>
      </transactionCoding>
      <transactionAmounts>
        <transactionShares><value>1000</value></transactionShares>
        <transactionPricePerShare><value>0</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
      <postTransactionAmounts>
        <sharesOwnedFollowingTransaction><value>3281000</value></sharesOwnedFollowingTransaction>
      </postTransactionAmounts>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
</ownershipDocument>
`;

test('parseInsiderActivityForTest extracts reporter, roles, and transactions with source provenance', () => {
  const rows = parseInsiderActivityForTest({
    xml: SAMPLE_FORM4_XML,
    accession: '0001234567-26-000042',
    filingDate: '2026-04-03',
    form: '4',
    primaryDocument: 'wf-form4.xml',
    issuerCik: '320193',
  });

  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.reporterName, 'Cook Timothy D');
    assert.equal(row.reporterCik, '0001214156');
    assert.equal(row.officerTitle, 'Chief Executive Officer');
    assert.equal(row.roles.isOfficer, true);
    assert.equal(row.roles.isDirector, false);
    assert.equal(row.roles.isTenPercentOwner, false);
    assert.equal(row.roles.isOther, false);
    assert.equal(row.accession, '0001234567-26-000042');
    assert.equal(row.filingDate, '2026-04-03');
    assert.equal(row.form, '4');
    assert.equal(row.issuerCik, '0000320193');
    assert.ok(row.primaryDocUrl.includes('wf-form4.xml'), 'primaryDocUrl should include the primary document');
    assert.ok(row.primaryDocUrl.includes('000123456726000042'), 'primaryDocUrl should include the accession path');
    assert.ok(row.filingIndexUrl.endsWith('000123456726000042/'), 'filingIndexUrl should point to the filing directory');
  }

  const sale = rows.find((r) => r.transactionCode === 'S');
  assert.ok(sale, 'sale row should be present');
  assert.equal(sale!.acquiredOrDisposed, 'D');
  assert.equal(sale!.shares, 511000);
  assert.equal(sale!.pricePerShare, 226.8755);
  assert.equal(sale!.sharesOwnedAfter, 3280000);
  assert.equal(sale!.transactionDate, '2026-04-02');
  assert.equal(sale!.isDerivative, false);
});

test('parseInsiderActivityForTest marks derivative-table transactions isDerivative=true', () => {
  const xml = `
    <ownershipDocument>
      <reportingOwner>
        <reportingOwnerId>
          <rptOwnerCik>0000001111</rptOwnerCik>
          <rptOwnerName>Director Jane</rptOwnerName>
        </reportingOwnerId>
        <reportingOwnerRelationship>
          <isDirector>1</isDirector>
          <isOfficer>0</isOfficer>
          <isTenPercentOwner>0</isTenPercentOwner>
          <isOther>0</isOther>
        </reportingOwnerRelationship>
      </reportingOwner>
      <derivativeTable>
        <derivativeTransaction>
          <securityTitle><value>Stock Option (Right to Buy)</value></securityTitle>
          <transactionDate><value>2026-03-15</value></transactionDate>
          <transactionCoding>
            <transactionCode>M</transactionCode>
          </transactionCoding>
          <transactionAmounts>
            <transactionShares><value>10000</value></transactionShares>
            <transactionPricePerShare><value>125.50</value></transactionPricePerShare>
            <transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode>
          </transactionAmounts>
        </derivativeTransaction>
      </derivativeTable>
    </ownershipDocument>
  `;

  const rows = parseInsiderActivityForTest({
    xml,
    accession: '0000999999-26-000001',
    filingDate: '2026-03-16',
    form: '4',
    primaryDocument: 'form4.xml',
    issuerCik: '0000320193',
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].isDerivative, true);
  assert.equal(rows[0].transactionCode, 'M');
  assert.equal(rows[0].shares, 10000);
  assert.equal(rows[0].acquiredOrDisposed, 'A');
  assert.equal(rows[0].roles.isDirector, true);
});

test('parseInsiderActivityForTest emits one placeholder row for a transactionless Form 3', () => {
  const xml = `
    <ownershipDocument>
      <reportingOwner>
        <reportingOwnerId>
          <rptOwnerCik>0002222222</rptOwnerCik>
          <rptOwnerName>Ten Percent Holder LLC</rptOwnerName>
        </reportingOwnerId>
        <reportingOwnerRelationship>
          <isDirector>0</isDirector>
          <isOfficer>0</isOfficer>
          <isTenPercentOwner>1</isTenPercentOwner>
          <isOther>0</isOther>
        </reportingOwnerRelationship>
      </reportingOwner>
    </ownershipDocument>
  `;

  const rows = parseInsiderActivityForTest({
    xml,
    accession: '0000000000-26-000002',
    filingDate: '2026-02-02',
    form: '3',
    primaryDocument: 'ownership.xml',
    issuerCik: '320193',
  });

  assert.equal(rows.length, 1);
  const [row] = rows;
  assert.equal(row.reporterName, 'Ten Percent Holder LLC');
  assert.equal(row.roles.isTenPercentOwner, true);
  assert.equal(row.transactionDate, '2026-02-02');
  assert.equal(row.transactionCode, null);
  assert.equal(row.shares, null);
  assert.equal(row.acquiredOrDisposed, null);
});

test('parseInsiderActivityForTest returns empty when no reportingOwner is present', () => {
  const rows = parseInsiderActivityForTest({
    xml: '<ownershipDocument></ownershipDocument>',
    accession: 'A',
    filingDate: '2026-01-01',
    form: '4',
    primaryDocument: 'x.xml',
    issuerCik: '320193',
  });
  assert.deepEqual(rows, []);
});

test('filterInsiderActivityRows keeps only rows whose role flag matches', () => {
  const baseRow: InsiderActivityRow = {
    reporterName: '',
    reporterCik: null,
    officerTitle: null,
    roles: { isDirector: false, isOfficer: false, isTenPercentOwner: false, isOther: false },
    securityTitle: 'Common Stock',
    transactionDate: '2026-01-01',
    transactionCode: 'P',
    acquiredOrDisposed: 'A',
    shares: 1,
    pricePerShare: 1,
    sharesOwnedAfter: 1,
    isDerivative: false,
    form: '4',
    accession: '0000000000-26-000001',
    filingDate: '2026-01-01',
    primaryDocument: 'x.xml',
    primaryDocUrl: 'https://example.test/x.xml',
    filingIndexUrl: 'https://example.test/',
    issuerCik: '0000320193',
  };

  const rows: InsiderActivityRow[] = [
    { ...baseRow, reporterName: 'D', roles: { ...baseRow.roles, isDirector: true } },
    { ...baseRow, reporterName: 'O', roles: { ...baseRow.roles, isOfficer: true } },
    { ...baseRow, reporterName: 'T', roles: { ...baseRow.roles, isTenPercentOwner: true } },
    { ...baseRow, reporterName: 'X', roles: { ...baseRow.roles, isOther: true } },
  ];

  assert.deepEqual(
    filterInsiderActivityRows(rows, 'director').map((r) => r.reporterName),
    ['D'],
  );
  assert.deepEqual(
    filterInsiderActivityRows(rows, 'officer').map((r) => r.reporterName),
    ['O'],
  );
  assert.deepEqual(
    filterInsiderActivityRows(rows, 'ten_percent_owner').map((r) => r.reporterName),
    ['T'],
  );
  assert.deepEqual(
    filterInsiderActivityRows(rows, 'other').map((r) => r.reporterName),
    ['X'],
  );
  assert.equal(filterInsiderActivityRows(rows, 'all').length, 4);
});

test('compareInsiderRowsChronologically sorts newest transaction first, breaking ties by filingDate then accession', () => {
  const base: InsiderActivityRow = {
    reporterName: 'x',
    reporterCik: null,
    officerTitle: null,
    roles: { isDirector: false, isOfficer: false, isTenPercentOwner: false, isOther: false },
    securityTitle: null,
    transactionDate: '2026-01-01',
    transactionCode: null,
    acquiredOrDisposed: null,
    shares: null,
    pricePerShare: null,
    sharesOwnedAfter: null,
    isDerivative: false,
    form: '4',
    accession: '0',
    filingDate: '2026-01-01',
    primaryDocument: 'x.xml',
    primaryDocUrl: 'https://example.test/',
    filingIndexUrl: 'https://example.test/',
    issuerCik: '0000320193',
  };

  const rows: InsiderActivityRow[] = [
    { ...base, transactionDate: '2026-01-01', filingDate: '2026-01-02', accession: '1' },
    { ...base, transactionDate: '2026-03-15', filingDate: '2026-03-15', accession: '2' },
    { ...base, transactionDate: '2026-02-01', filingDate: '2026-02-10', accession: '3' },
    { ...base, transactionDate: '2026-03-15', filingDate: '2026-03-16', accession: '4' },
  ];

  const sorted = [...rows].sort(compareInsiderRowsChronologically).map((r) => r.accession);
  assert.deepEqual(sorted, ['4', '2', '3', '1']);
});
