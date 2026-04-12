import Link from 'next/link';
import type { JSX } from 'react';

import {
  getFailedArtifacts,
  getParserFailureSummary,
  type AdminParser,
} from '../../../lib/api/admin';

export const metadata = {
  title: 'Admin QA',
};

type AdminQaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}



function parseParserFilter(value: string | undefined): AdminParser | undefined {
  if (value === 'xbrl' || value === 'proxy' || value === 'sec') {
    return value;
  }
  return undefined;
}

function isAdminRequest(): boolean {
  return process.env.ADMIN_ENABLED === 'true';
}

export default async function AdminQaPage({ searchParams }: AdminQaPageProps): Promise<JSX.Element> {
  if (!isAdminRequest()) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Admin QA Dashboard</h1>
        <p style={{ color: '#556070' }}>Admin access required.</p>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  const jobId = firstValue(params.jobId)?.trim() || undefined;
  const parser = parseParserFilter(firstValue(params.parser)?.trim());

  const failedArtifacts = await getFailedArtifacts({ jobId, parser });
  const parserSummary = await getParserFailureSummary({ jobId, parser });

  return (
    <main style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>Admin QA Dashboard</h1>

      <section style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Filters</h2>
        <form action="/admin/qa" method="get" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ display: 'grid', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#556070' }}>Job id</span>
            <input name="jobId" defaultValue={jobId ?? ''} placeholder="job-..." />
          </label>
          <label style={{ display: 'grid', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#556070' }}>Parser</span>
            <select name="parser" defaultValue={parser ?? ''}>
              <option value="">All</option>
              <option value="xbrl">xbrl</option>
              <option value="proxy">proxy</option>
              <option value="sec">sec</option>
            </select>
          </label>
          <button type="submit">Apply</button>
          <Link href="/admin/qa">Reset</Link>
        </form>
      </section>

      <section style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Parser failure summary</h2>
        <ul>
          {parserSummary.length === 0 ? <li>No parser failures match filters.</li> : null}
          {parserSummary.map((entry) => (
            <li key={entry.parser}>
              {entry.parser}: {entry.failures}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Failed artifacts</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #d7dce2', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ background: '#f7f8fa', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Job id</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Parser</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Accession</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Error</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #d7dce2' }}>Artifact path</th>
              </tr>
            </thead>
            <tbody>
              {failedArtifacts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>
                    No failed artifacts match filters.
                  </td>
                </tr>
              ) : null}
              {failedArtifacts.map((artifact) => (
                <tr key={`${artifact.jobId}-${artifact.checksum}`}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{artifact.jobId}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{artifact.parser}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>{artifact.accession}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>
                    <strong>{artifact.errorCode}</strong>: {artifact.errorMessage}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eef1f4' }}>
                    <Link
                      href={`/admin/artifacts?jobId=${encodeURIComponent(
                        artifact.jobId,
                      )}&artifactPath=${encodeURIComponent(artifact.artifactPath)}`}
                    >
                      {artifact.artifactPath}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
