'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '../../../../packages/ui/src/styles/tokens';
import {
  METRICS,
  buildInsights,
  buildRadarData,
  formatMetric,
  median,
} from '../../lib/api/peer-benchmark-metrics';
import type {
  CompanyRecord,
  MetricKey,
  RadarPoint,
} from '../../lib/api/peer-benchmark-metrics';
import type { PeerBenchmarkResult } from '../../lib/api/peer-benchmark';

import { PeerSearchForm } from './PeerSearchForm';

type Props = {
  result: PeerBenchmarkResult;
  initialTicker: string;
};

const PEER_COLORS = ['#667085', '#98A2B3', '#7C8BA8', '#475467', '#344054', '#0A7F6B'];
const TARGET_COLOR = colorTokens.semantic.success;
const MEDIAN_COLOR = colorTokens.signal.down;

export function PeerBenchmarkClient({ result, initialTicker }: Props) {
  const { target, peers, peerUniverseSize } = result;

  const [excludedPeers, setExcludedPeers] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<MetricKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const activePeers = useMemo(
    () => peers.filter((p) => !excludedPeers.has(p.ticker)),
    [peers, excludedPeers],
  );

  const radar = useMemo(() => buildRadarData(target, activePeers), [target, activePeers]);
  const insights = useMemo(() => buildInsights(target, activePeers), [target, activePeers]);

  const sortedPeers = useMemo(() => {
    const rows = [...peers];
    if (!sortKey) return rows;
    rows.sort((a, b) => {
      const av = a.metrics[sortKey];
      const bv = b.metrics[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [peers, sortKey, sortDir]);

  const togglePeer = (ticker: string) => {
    setExcludedPeers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const toggleSort = (key: MetricKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------

  const container: CSSProperties = {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'grid',
    gap: spacingTokens['5'],
  };

  const card: CSSProperties = {
    border: `1px solid ${colorTokens.border.subtle}`,
    borderRadius: radiusTokens.lg,
    background: colorTokens.surface.card,
    padding: spacingTokens['5'],
  };

  const sectionLabel: CSSProperties = {
    fontSize: typographyTokens.fontSize.xs,
    fontWeight: typographyTokens.fontWeight.semibold,
    color: colorTokens.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typographyTokens.letterSpacing.wider,
  };

  const subLabel: CSSProperties = {
    fontSize: typographyTokens.fontSize.xs,
    color: colorTokens.text.muted,
    marginTop: spacingTokens['1'],
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <section style={container}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacingTokens['4'],
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ margin: 0, ...sectionLabel }}>Peer benchmarking</p>
          <h1
            style={{
              margin: `${spacingTokens['1']} 0 0`,
              fontSize: typographyTokens.fontSize['2xl'],
              letterSpacing: typographyTokens.letterSpacing.tight,
            }}
          >
            SIC-matched peer comparison
          </h1>
          <p style={{ margin: `${spacingTokens['1']} 0 0`, ...subLabel }}>
            Metrics derived live from SEC XBRL companyfacts · percentile-normalized
          </p>
        </div>
        <PeerSearchForm initialValue={initialTicker} />
      </header>

      {/* TARGET CARD */}
      <div style={card}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacingTokens['5'],
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: spacingTokens['3'] }}>
              <span
                style={{
                  fontFamily: typographyTokens.fontFamily.mono,
                  fontSize: typographyTokens.fontSize['2xl'],
                  fontWeight: typographyTokens.fontWeight.bold,
                  color: TARGET_COLOR,
                  letterSpacing: typographyTokens.letterSpacing.tight,
                }}
              >
                {target.ticker}
              </span>
              <span style={{ fontSize: typographyTokens.fontSize.lg, color: colorTokens.text.primary }}>
                {target.name}
              </span>
            </div>
            <div
              style={{
                marginTop: spacingTokens['2'],
                display: 'flex',
                alignItems: 'center',
                gap: spacingTokens['2'],
                flexWrap: 'wrap',
                fontSize: typographyTokens.fontSize.sm,
                color: colorTokens.text.muted,
              }}
            >
              <span style={{ fontFamily: typographyTokens.fontFamily.mono }}>
                CIK {target.cik}
              </span>
              {target.sic && (
                <>
                  <span>·</span>
                  <span style={{ fontFamily: typographyTokens.fontFamily.mono }}>SIC {target.sic}</span>
                </>
              )}
              {target.sicDescription && (
                <>
                  <span>·</span>
                  <span>{target.sicDescription}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacingTokens['6'], flexWrap: 'wrap' }}>
            {METRICS.map((m) => (
              <div key={m.key} style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: typographyTokens.fontSize.xs,
                    color: colorTokens.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: typographyTokens.letterSpacing.wider,
                  }}
                >
                  {m.shortLabel}
                </div>
                <div
                  style={{
                    marginTop: spacingTokens['1'],
                    fontFamily: typographyTokens.fontFamily.mono,
                    fontSize: typographyTokens.fontSize.md,
                    fontWeight: typographyTokens.fontWeight.semibold,
                    color: colorTokens.text.primary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatMetric(target.metrics[m.key], m.format)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RADAR + TABLE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: spacingTokens['5'],
        }}
      >
        {/* RADAR */}
        <div style={card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacingTokens['4'],
              flexWrap: 'wrap',
              gap: spacingTokens['3'],
            }}
          >
            <div>
              <div style={sectionLabel}>Relative positioning</div>
              <div style={subLabel}>Percentile rank within peer group · higher = better</div>
            </div>
            <RadarLegend />
          </div>

          {activePeers.length === 0 ? (
            <EmptyPeersNote peerUniverseSize={peerUniverseSize} sic={target.sic} />
          ) : (
            <RadarChart points={radar} target={target} peers={activePeers} />
          )}
        </div>

        {/* PEER TABLE */}
        <div style={card}>
          <div style={{ marginBottom: spacingTokens['4'] }}>
            <div style={sectionLabel}>Peer group</div>
            <div style={subLabel}>
              {activePeers.length} of {peers.length} active · SIC {target.sic ?? '—'} · universe {peerUniverseSize}
            </div>
          </div>

          <PeerTable
            target={target}
            peers={peers}
            sortedPeers={sortedPeers}
            activePeers={activePeers}
            excludedPeers={excludedPeers}
            onTogglePeer={togglePeer}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </div>
      </div>

      {/* INSIGHTS */}
      <div style={card}>
        <div style={{ marginBottom: spacingTokens['3'] }}>
          <div style={sectionLabel}>Quick take</div>
        </div>
        {insights.length === 0 ? (
          <div style={{ fontSize: typographyTokens.fontSize.sm, color: colorTokens.text.muted }}>
            {peers.length === 0
              ? `No peer data available for SIC ${target.sic ?? '—'} in the bundled universe.`
              : `${target.ticker} tracks roughly in line with its peer group across all measured metrics.`}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: spacingTokens['3'],
            }}
          >
            {insights.map((ins, i) => {
              const color =
                ins.tone === 'pos'
                  ? colorTokens.semantic.success
                  : ins.tone === 'neg'
                    ? colorTokens.semantic.danger
                    : colorTokens.semantic.warning;
              return (
                <div
                  key={i}
                  style={{
                    padding: `${spacingTokens['3']} ${spacingTokens['4']}`,
                    borderRadius: radiusTokens.md,
                    background: colorTokens.accent.soft,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: typographyTokens.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: typographyTokens.letterSpacing.wider,
                      color,
                      marginBottom: spacingTokens['1'],
                    }}
                  >
                    {ins.metric}
                  </div>
                  <div
                    style={{
                      fontSize: typographyTokens.fontSize.sm,
                      lineHeight: typographyTokens.lineHeight.default,
                      color: colorTokens.text.secondary,
                    }}
                  >
                    {ins.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: spacingTokens['4'],
          fontSize: typographyTokens.fontSize.xs,
          color: colorTokens.text.muted,
          textAlign: 'center',
        }}
      >
        Data: SEC EDGAR XBRL companyfacts · Peers: SIC-matched within bundled universe · Metrics: latest-FY annual filings
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RadarLegend() {
  const item: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingTokens['2'],
    fontSize: typographyTokens.fontSize.xs,
    color: colorTokens.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typographyTokens.letterSpacing.wider,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacingTokens['5'], flexWrap: 'wrap' }}>
      <span style={item}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: TARGET_COLOR }} aria-hidden />
        Target
      </span>
      <span style={item}>
        <span
          style={{ width: 14, height: 2, background: MEDIAN_COLOR, display: 'inline-block' }}
          aria-hidden
        />
        Median
      </span>
      <span style={item}>
        <span style={{ width: 14, height: 2, background: PEER_COLORS[0] }} aria-hidden />
        Peers
      </span>
    </div>
  );
}

function EmptyPeersNote({
  peerUniverseSize,
  sic,
}: {
  peerUniverseSize: number;
  sic: string | null;
}) {
  return (
    <div
      style={{
        height: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colorTokens.text.muted,
        fontSize: typographyTokens.fontSize.sm,
        textAlign: 'center',
      }}
    >
      {peerUniverseSize === 0
        ? `No bundled peers for SIC ${sic ?? '—'}. Extend peer-universe.json to broaden coverage.`
        : 'All peers excluded. Re-enable peers in the table to re-render the radar.'}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radar chart (pure SVG)
// ---------------------------------------------------------------------------

type RadarChartProps = {
  points: RadarPoint[];
  target: CompanyRecord;
  peers: CompanyRecord[];
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function RadarChart({ points, target, peers }: RadarChartProps) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - 52;

  const n = points.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const ringLevels = [25, 50, 75, 100];

  const buildPolygon = (valueFor: (p: RadarPoint) => number): string =>
    points
      .map((p, i) => {
        const r = (Math.max(0, Math.min(100, valueFor(p))) / 100) * rMax;
        const [x, y] = polarToCartesian(cx, cy, r, angleFor(i));
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ') + ' Z';

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg
        width="100%"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Peer percentile radar chart"
        style={{ maxWidth: size }}
      >
        {/* grid rings */}
        {ringLevels.map((lvl) => (
          <circle
            key={lvl}
            cx={cx}
            cy={cy}
            r={(lvl / 100) * rMax}
            fill="none"
            stroke={colorTokens.border.subtle}
            strokeDasharray="2 4"
          />
        ))}

        {/* axes */}
        {points.map((p, i) => {
          const [x, y] = polarToCartesian(cx, cy, rMax, angleFor(i));
          return (
            <line
              key={p.metricKey}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={colorTokens.border.subtle}
            />
          );
        })}

        {/* peer polygons */}
        {peers.map((p, idx) => (
          <path
            key={p.ticker}
            d={buildPolygon((pt) => pt.peers[p.ticker] ?? 0)}
            fill={PEER_COLORS[idx % PEER_COLORS.length]}
            fillOpacity={0.05}
            stroke={PEER_COLORS[idx % PEER_COLORS.length]}
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        ))}

        {/* median polygon */}
        <path
          d={buildPolygon((pt) => pt.median)}
          fill="none"
          stroke={MEDIAN_COLOR}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* target polygon */}
        <path
          d={buildPolygon((pt) => pt.target)}
          fill={TARGET_COLOR}
          fillOpacity={0.18}
          stroke={TARGET_COLOR}
          strokeWidth={2.5}
        />

        {/* target vertex dots */}
        {points.map((p, i) => {
          const r = (Math.max(0, Math.min(100, p.target)) / 100) * rMax;
          const [x, y] = polarToCartesian(cx, cy, r, angleFor(i));
          return <circle key={p.metricKey} cx={x} cy={y} r={3.5} fill={TARGET_COLOR} />;
        })}

        {/* axis labels */}
        {points.map((p, i) => {
          const [x, y] = polarToCartesian(cx, cy, rMax + 22, angleFor(i));
          const metric = METRICS.find((m) => m.key === p.metricKey);
          const targetVal = metric ? formatMetric(target.metrics[metric.key], metric.format) : '';
          return (
            <g key={p.metricKey}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: typographyTokens.fontFamily.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  fill: colorTokens.text.secondary,
                }}
              >
                {p.metric}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily: typographyTokens.fontFamily.mono,
                  fontSize: 10,
                  fill: colorTokens.text.muted,
                }}
              >
                {targetVal}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peer table
// ---------------------------------------------------------------------------

type PeerTableProps = {
  target: CompanyRecord;
  peers: CompanyRecord[];
  sortedPeers: CompanyRecord[];
  activePeers: CompanyRecord[];
  excludedPeers: Set<string>;
  onTogglePeer: (ticker: string) => void;
  sortKey: MetricKey | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: MetricKey) => void;
};

function PeerTable({
  target,
  peers,
  sortedPeers,
  activePeers,
  excludedPeers,
  onTogglePeer,
  sortKey,
  sortDir,
  onSort,
}: PeerTableProps) {
  const th: CSSProperties = {
    padding: `${spacingTokens['2']} ${spacingTokens['2']}`,
    textAlign: 'right',
    fontSize: typographyTokens.fontSize.xs,
    fontWeight: typographyTokens.fontWeight.medium,
    color: colorTokens.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typographyTokens.letterSpacing.wider,
    borderBottom: `1px solid ${colorTokens.border.subtle}`,
    whiteSpace: 'nowrap',
  };

  const td: CSSProperties = {
    padding: `${spacingTokens['2']} ${spacingTokens['2']}`,
    borderBottom: `1px solid ${colorTokens.border.subtle}`,
    fontFamily: typographyTokens.fontFamily.mono,
    fontSize: typographyTokens.fontSize.sm,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  };

  const medianByKey = useMemoMedian(activePeers);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 24, textAlign: 'left' }} aria-label="Include peer" />
            <th style={{ ...th, textAlign: 'left' }}>Ticker</th>
            {METRICS.map((m) => (
              <th key={m.key} style={th}>
                <button
                  type="button"
                  onClick={() => onSort(m.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                    textTransform: 'inherit',
                    letterSpacing: 'inherit',
                    padding: 0,
                  }}
                >
                  {m.shortLabel}
                  {sortKey === m.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: colorTokens.accent.soft }}>
            <td style={{ ...td, textAlign: 'left' }} aria-hidden />
            <td
              style={{
                ...td,
                textAlign: 'left',
                color: TARGET_COLOR,
                fontWeight: typographyTokens.fontWeight.semibold,
              }}
            >
              {target.ticker}
            </td>
            {METRICS.map((m) => (
              <td key={m.key} style={td}>
                {formatMetric(target.metrics[m.key], m.format)}
              </td>
            ))}
          </tr>

          {sortedPeers.map((p, idx) => {
            const excluded = excludedPeers.has(p.ticker);
            const colorIdx = peers.findIndex((x) => x.ticker === p.ticker);
            return (
              <tr key={p.ticker} style={{ opacity: excluded ? 0.45 : 1 }}>
                <td style={{ ...td, textAlign: 'left' }}>
                  <input
                    type="checkbox"
                    checked={!excluded}
                    onChange={() => onTogglePeer(p.ticker)}
                    aria-label={`Include ${p.ticker} in peer set`}
                    style={{ cursor: 'pointer', accentColor: TARGET_COLOR }}
                  />
                </td>
                <td style={{ ...td, textAlign: 'left' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacingTokens['2'] }}>
                    <span
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: excluded
                          ? colorTokens.border.subtle
                          : PEER_COLORS[colorIdx % PEER_COLORS.length],
                      }}
                    />
                    <span style={{ color: colorTokens.text.secondary }}>{p.ticker}</span>
                  </span>
                </td>
                {METRICS.map((m) => (
                  <td key={m.key} style={td}>
                    {formatMetric(p.metrics[m.key], m.format)}
                  </td>
                ))}
                {idx === sortedPeers.length - 1 && activePeers.length > 0 ? null : null}
              </tr>
            );
          })}

          {activePeers.length > 0 && (
            <tr style={{ borderTop: `2px solid ${colorTokens.border.default}` }}>
              <td style={{ ...td, textAlign: 'left' }} aria-hidden />
              <td
                style={{
                  ...td,
                  textAlign: 'left',
                  color: MEDIAN_COLOR,
                  textTransform: 'uppercase',
                  letterSpacing: typographyTokens.letterSpacing.wider,
                  fontSize: typographyTokens.fontSize.xs,
                  fontWeight: typographyTokens.fontWeight.semibold,
                }}
              >
                Median
              </td>
              {METRICS.map((m) => (
                <td key={m.key} style={{ ...td, color: MEDIAN_COLOR }}>
                  {formatMetric(medianByKey[m.key], m.format)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function useMemoMedian(peers: CompanyRecord[]): Record<MetricKey, number | null> {
  return useMemo(() => {
    const out = {} as Record<MetricKey, number | null>;
    for (const m of METRICS) {
      const vals = peers
        .map((p) => p.metrics[m.key])
        .filter((v): v is number => v != null);
      out[m.key] = median(vals);
    }
    return out;
  }, [peers]);
}
