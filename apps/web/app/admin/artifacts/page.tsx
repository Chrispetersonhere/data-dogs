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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Source URL</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Accession</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Fetch timestamp</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Checksum</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Parser version</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Job id</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.checksum}-${row.jobId}`}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.sourceUrl}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.accession}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.fetchTimestamp}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.checksum}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.parserVersion}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.jobId}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
