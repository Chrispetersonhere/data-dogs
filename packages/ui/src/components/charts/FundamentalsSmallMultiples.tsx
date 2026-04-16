import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SmallMultiplesPoint = {
  period: string;
  value: number;
};

export type SmallMultiplesSeries = {
  metric: string;
  unit: string;
  data: SmallMultiplesPoint[];
};

type FundamentalsSmallMultiplesProps = {
  /** Array of metric series to render as small-multiples panels. */
  series: SmallMultiplesSeries[];
  /** Optional chart title displayed above the grid. */
  title?: string;
};

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const PANEL_W = 260;
const PANEL_H = 160;
const PAD_TOP = 28;
const PAD_BOTTOM = 28;
const PAD_LEFT = 48;
const PAD_RIGHT = 16;
const PLOT_W = PANEL_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = PANEL_H - PAD_TOP - PAD_BOTTOM;
const BAR_GAP = 4;

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: spacingTokens['4'],
};

const panelStyle: CSSProperties = {
  backgroundColor: colorTokens.surface.card,
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.md,
  boxShadow: shadowTokens.sm,
  padding: spacingTokens['3'],
};

const titleStyle: CSSProperties = {
  margin: `0 0 ${spacingTokens['4']} 0`,
  fontSize: typographyTokens.fontSize.lg,
  fontWeight: typographyTokens.fontWeight.semibold,
  color: colorTokens.text.primary,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatValue(v: number, unit: string): string {
  if (unit === '$M') {
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}B`;
    return `$${v.toFixed(0)}M`;
  }
  if (unit === '$/share') return `$${v.toFixed(2)}`;
  if (unit === '%') return `${v.toFixed(1)}%`;
  return String(v);
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / magnitude) * magnitude;
}

/* ------------------------------------------------------------------ */
/*  Single panel                                                       */
/* ------------------------------------------------------------------ */

function SmallMultiplesPanel({ metric, unit, data }: SmallMultiplesSeries) {
  const maxVal = niceMax(Math.max(...data.map((d) => d.value)));
  const barCount = data.length;
  const barWidth = Math.max(1, (PLOT_W - (barCount - 1) * BAR_GAP) / barCount);

  return (
    <div style={panelStyle} data-testid={`chart-panel-${metric.toLowerCase().replace(/\s+/g, '-')}`}>
      <svg
        viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
        width="100%"
        role="img"
        aria-label={`${metric} chart`}
        style={{ display: 'block' }}
      >
        <title>{metric} ({unit})</title>

        {/* Metric label */}
        <text
          x={PAD_LEFT}
          y={16}
          fill={colorTokens.text.primary}
          fontSize={12}
          fontWeight={typographyTokens.fontWeight.semibold}
          fontFamily={typographyTokens.fontFamily.sans}
        >
          {metric}
        </text>

        {/* Unit label */}
        <text
          x={PANEL_W - PAD_RIGHT}
          y={16}
          fill={colorTokens.text.muted}
          fontSize={10}
          textAnchor="end"
          fontFamily={typographyTokens.fontFamily.sans}
        >
          {unit}
        </text>

        {/* Y-axis gridlines & labels */}
        {[0, 0.5, 1].map((frac) => {
          const yPos = PAD_TOP + PLOT_H * (1 - frac);
          const labelVal = maxVal * frac;
          return (
            <g key={frac}>
              <line
                x1={PAD_LEFT}
                x2={PAD_LEFT + PLOT_W}
                y1={yPos}
                y2={yPos}
                stroke={colorTokens.border.subtle}
                strokeWidth={0.5}
              />
              <text
                x={PAD_LEFT - 4}
                y={yPos + 3}
                fill={colorTokens.text.muted}
                fontSize={9}
                textAnchor="end"
                fontFamily={typographyTokens.fontFamily.mono}
              >
                {formatValue(labelVal, unit)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = maxVal > 0 ? (d.value / maxVal) * PLOT_H : 0;
          const x = PAD_LEFT + i * (barWidth + BAR_GAP);
          const y = PAD_TOP + PLOT_H - barHeight;
          return (
            <g key={d.period}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={colorTokens.accent.muted}
                rx={2}
              />
              {/* Period label */}
              <text
                x={x + barWidth / 2}
                y={PANEL_H - 6}
                fill={colorTokens.text.muted}
                fontSize={8}
                textAnchor="middle"
                fontFamily={typographyTokens.fontFamily.sans}
              >
                {d.period.replace('FY ', "'")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FundamentalsSmallMultiples({ series, title }: FundamentalsSmallMultiplesProps) {
  if (series.length === 0) return null;

  return (
    <section data-testid="fundamentals-small-multiples" aria-label="Fundamentals small multiples">
      {title ? <h3 style={titleStyle}>{title}</h3> : null}
      <div style={containerStyle}>
        {series.map((s) => (
          <SmallMultiplesPanel key={s.metric} {...s} />
        ))}
      </div>
    </section>
  );
}
