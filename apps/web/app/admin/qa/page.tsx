import type { JSX } from 'react';

import { getQaFactView } from '../../../lib/api/qa';

export const metadata = {
  title: 'Admin Fact Reconciliation QA',
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

export default async function AdminQaPage({ searchParams }: AdminQaPageProps): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Fact Reconciliation QA</h1>
        <p style={{ color: '#556070' }}>Admin access required.</p>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  const cik = firstValue(params.cik)?.trim() || '0000320193';

  try {
    const view = await getQaFactView(cik);

    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', display: 'grid', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Fact Reconciliation QA</h1>

        <section>
          <form action="/admin/qa" method="get" style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#556070' }}>Issuer CIK</span>
              <input name="cik" defaultValue={cik} placeholder="0000320193" />
            </label>
            <button type="submit">Load facts</button>
          </form>
        </section>

        <section>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Raw fact rows</h2>
          <p style={{ marginTop: 0, color: '#556070' }}>
            Source facts for CIK {view.cik}. This view intentionally preserves source ambiguity.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Source concept</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Unit</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Period end</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {view.rawFactRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '10px' }}>
                      No raw facts returned.
                    </td>
                  </tr>
                ) : null}
                {view.rawFactRows.map((row) => (
                  <tr key={`${row.sourceConcept}-${row.unit}-${row.periodEnd}-${row.value}`}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.sourceConcept}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.unit}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.periodEnd}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Normalized candidates</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px' }}>
            {view.normalizedCandidates.length === 0 ? <li>No candidates generated.</li> : null}
            {view.normalizedCandidates.map((candidate) => (
              <li key={candidate.candidateId}>
                <strong>{candidate.sourceConcept}</strong> → {candidate.normalizedConcept} ({candidate.normalizationStatus})
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Discrepancies (surfaced, not hidden)</h2>
          <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ background: '#fff7ed', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Source concept</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Issue</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {view.discrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '10px' }}>
                      No discrepancies detected for sampled rows.
                    </td>
                  </tr>
                ) : null}
                {view.discrepancies.map((item) => (
                  <tr key={`${item.sourceConcept}-${item.issue}-${item.periodEnd}`} style={{ background: '#fffaf5' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.sourceConcept}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.issue}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Fact Reconciliation QA</h1>
        <p style={{ color: '#8a1c1c' }}>Live fact fetch failed for CIK {cik}.</p>
        <p style={{ color: '#556070', fontSize: '12px' }}>{String(error)}</p>
      </main>
    );
  }
}
