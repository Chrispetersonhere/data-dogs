import Link from 'next/link';
import type { JSX } from 'react';

import { getAdminJobs } from '../../../lib/api/admin';

export const metadata = {
  title: 'Admin Jobs',
};

function isAdminRequest(): boolean {
  return process.env.ADMIN_ENABLED === 'true';
}

export default async function AdminJobsPage(): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin Jobs</h1>
        <p style={{ color: '#556070' }}>Admin access required.</p>
      </main>
    );
  }

  const jobs = await getAdminJobs();

  return (
    <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Admin Jobs</h1>
      <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '700px' }}>
          <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Job id</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>State</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Parser</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Started</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>Finished</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2', whiteSpace: 'nowrap' }}>QA</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{job.id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{job.state}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{job.parser}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{job.startedAt}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>{job.finishedAt ?? '—'}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4', whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/qa?jobId=${encodeURIComponent(job.id)}`}>Inspect failures</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
