import type { JSX } from 'react';

import { getProvenanceLedgerRows } from '../../../lib/db/provenance';

export const metadata = {
  title: 'Admin Artifacts',
};

function isAdminRequest(): boolean {
  return process.env.ADMIN_ENABLED === 'true';
}

export default async function AdminArtifactsPage(): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Artifacts</h1>
        <p style={{ color: '#556070' }}>Admin access required.</p>
      </main>
    );
  }

  const rows = await getProvenanceLedgerRows();

  return (
    <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Admin Artifacts</h1>
      <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '900px' }}>
          <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Source URL</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Accession</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Fetch timestamp</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Checksum</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Parser version</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Job id</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.checksum}-${row.jobId}`}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', wordBreak: 'break-all', maxWidth: '260px' }}>{row.sourceUrl}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{row.accession}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{row.fetchTimestamp}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px' }}>{row.checksum}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{row.parserVersion}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{row.jobId}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
