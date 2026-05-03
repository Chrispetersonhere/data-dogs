import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ibis — SEC filings, verified financial facts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(145deg, #101828 0%, #111827 45%, #1E293B 100%)',
          color: '#F8FAFC',
          padding: '72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#10213E',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFC',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            i
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#F8FAFC',
            }}
          >
            Ibis
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 18,
              fontFamily: 'monospace',
              color: '#98A2B3',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.14)',
              padding: '6px 12px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Built on SEC EDGAR
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
              maxWidth: 980,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>SEC filings →</span>
            <span style={{ color: '#B6E1B0' }}>verified financial facts</span>
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: '#CBD5E1',
              maxWidth: 940,
            }}
          >
            Six fields of provenance on every fact. Point-in-time by construction.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            color: '#98A2B3',
            fontSize: 20,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
          }}
        >
          <span>source_url</span>
          <span>·</span>
          <span>accession</span>
          <span>·</span>
          <span>fetched_at</span>
          <span>·</span>
          <span>sha256</span>
          <span>·</span>
          <span>parser</span>
          <span>·</span>
          <span>job_id</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
