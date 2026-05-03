import type { JSX } from 'react';

import { readContactRequests } from '../../api/v1/contact/helpers';

export const metadata = {
  title: 'Admin · Sales inquiries',
};

function isAdminRequest(): boolean {
  return process.env.ADMIN_ENABLED === 'true';
}

const cellStyle = {
  padding: '10px',
  borderBottom: '1px solid #d7dce2',
  whiteSpace: 'nowrap' as const,
};

const headerCellStyle = {
  ...cellStyle,
  fontWeight: 600,
};

export default async function AdminContactPage(): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin · Contact</h1>
        <p style={{ color: '#556070' }}>Admin access required.</p>
      </main>
    );
  }

  const rows = await readContactRequests();
  const recent = [...rows]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, 200);

  return (
    <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ marginBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Admin · Sales inquiries</h1>
        <p style={{ color: '#556070', marginTop: '4px', fontSize: '13px' }}>
          {rows.length} total · showing most recent {recent.length}.
        </p>
      </header>
      {recent.length === 0 ? (
        <p style={{ color: '#556070' }}>No contact requests yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              minWidth: '900px',
            }}
          >
            <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
              <tr>
                <th style={headerCellStyle}>Received</th>
                <th style={headerCellStyle}>Topic</th>
                <th style={headerCellStyle}>Email</th>
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Company</th>
                <th style={headerCellStyle}>Message</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={`${r.receivedAt}-${i}`}>
                  <td
                    style={{ ...cellStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                  >
                    {r.receivedAt}
                  </td>
                  <td style={cellStyle}>{r.topic}</td>
                  <td style={cellStyle}>{r.email}</td>
                  <td style={cellStyle}>{r.name}</td>
                  <td style={cellStyle}>{r.company}</td>
                  <td style={{ ...cellStyle, whiteSpace: 'normal', maxWidth: '40ch' }}>
                    {r.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
