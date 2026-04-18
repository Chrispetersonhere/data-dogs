import type { JSX } from 'react';

import { getCompQaView } from '../../../lib/api/comp-qa';

export const metadata = {
  title: 'Admin Compensation QA',
};

type AdminQaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function isAdminRequest(): boolean {
  return process.env.ADMIN_ENABLED === 'true';
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const layoutStyles = {
  main: { padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', display: 'grid', gap: '16px' },
  muted: { color: '#556070' },
  panel: { border: '1px solid #d7dce2', borderRadius: '8px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' },
  heading: { fontSize: '20px', marginBottom: '8px' },
  subheading: { fontSize: '16px', marginBottom: '8px' },
} as const;

export default async function AdminQaPage({ searchParams }: AdminQaPageProps): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={layoutStyles.heading}>Admin Compensation QA</h1>
        <p style={layoutStyles.muted}>Admin access required.</p>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  const cik = firstValue(params.cik)?.trim() || '0000320193';

  try {
    const view = await getCompQaView(cik);
    const discrepancyRowIds = new Set(view.discrepancies.map((item) => item.rowId));

    return (
      <main style={layoutStyles.main}>
        <h1 style={layoutStyles.heading}>Admin Compensation QA</h1>
        <p style={layoutStyles.muted}>Internal-only QA interface for comparing raw proxy compensation rows against parsed structured output.</p>

        <section>
          <form action="/admin/qa" method="get" style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#556070' }}>Issuer CIK</span>
              <input name="cik" defaultValue={cik} placeholder="0000320193" />
            </label>
            <button type="submit">Load compensation QA</button>
          </form>
        </section>

        <section>
          <h2 style={layoutStyles.subheading}>Raw vs parsed comparison (side-by-side)</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '16px',
              alignItems: 'start',
            }}
          >
            <article>
              <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>Raw proxy table</h3>
              <div style={layoutStyles.panel}>
                <table style={layoutStyles.table}>
                  <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Executive</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Role</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Salary</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Bonus</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Equity</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Total</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Source URL</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Trace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.rawProxyRows.map((row) => {
                      const isDiscrepant = discrepancyRowIds.has(row.rowId);
                      return (
                        <tr
                          key={row.rowId}
                          data-discrepancy-row={isDiscrepant ? 'true' : 'false'}
                          style={isDiscrepant ? { background: '#fff3f2' } : undefined}
                        >
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.executiveName}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.role}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.salaryUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.bonusUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.equityUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.totalUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', maxWidth: '180px', wordBreak: 'break-all' }}>
                            {row.sourceUrl}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', fontSize: '12px' }}>
                            Accession: {row.accession}
                            <br />
                            Fetch timestamp: {row.fetchTimestamp}
                            <br />
                            Checksum: {row.checksum}
                            <br />
                            Parser version: {row.parserVersion}
                            <br />
                            Job id: {row.jobId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>

            <article>
              <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>Parsed structured output</h3>
              <div style={layoutStyles.panel}>
                <table style={layoutStyles.table}>
                  <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Executive</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Fiscal year</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Salary</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Bonus</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Equity</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Total</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>traceSourceRowId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.parsedRows.map((row) => {
                      const isDiscrepant = discrepancyRowIds.has(row.rowId);
                      return (
                        <tr
                          key={row.rowId}
                          data-discrepancy-row={isDiscrepant ? 'true' : 'false'}
                          style={isDiscrepant ? { background: '#fff3f2' } : undefined}
                        >
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.executiveName}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.fiscalYear}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.salaryUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.bonusUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.equityUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.totalUsd}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.traceSourceRowId}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section>
          <h2 style={layoutStyles.subheading}>Discrepancy highlights</h2>
          <p style={layoutStyles.muted}>Rows with mismatches are emphasized in both tables and listed below for fast triage.</p>
          <div style={layoutStyles.panel}>
            <table style={{ ...layoutStyles.table, minWidth: '560px' }}>
              <thead style={{ background: '#fff7ed', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Executive</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Issue</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {view.discrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '10px' }}>
                      No discrepancies detected.
                    </td>
                  </tr>
                ) : null}
                {view.discrepancies.map((item) => (
                  <tr key={`${item.rowId}-${item.issue}`} style={{ background: '#fff3f2' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.executiveName}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.issue}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 style={layoutStyles.subheading}>Provenance and traceability</h2>
          <p style={layoutStyles.muted}>
            CIK {view.issuerCik}. Raw table visibly preserves source URL, accession, fetch timestamp, checksum, parser version, and job id.
            Parsed rows include traceSourceRowId back to raw rows.
          </p>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={layoutStyles.heading}>Admin Compensation QA</h1>
        <p style={{ color: '#8a1c1c' }}>Compensation QA fetch failed for CIK {cik}.</p>
        <p style={{ color: '#556070', fontSize: '12px' }}>{String(error)}</p>
      </main>
    );
  }
}
