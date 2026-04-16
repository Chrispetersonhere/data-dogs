import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WaterfallSegment = {
  label: string;
  value: number;
  kind: 'absolute' | 'delta';
};

export type WaterfallPosition = {
  label: string;
  value: number;
  start: number;
  end: number;
  kind: 'absolute' | 'delta';
};

type MarginBridgeWaterfallProps = {
  /** Segments describing the waterfall from revenue to net income. */
  segments: WaterfallSegment[];
  /** Optional chart title. */
  title?: string;
};

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const CHART_W = 720;
const CHART_H = 340;
const PAD_TOP = 40;
const PAD_BOTTOM = 60;
const PAD_LEFT = 64;
const PAD_RIGHT = 24;
const PLOT_W = CHART_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;
const BAR_GAP = 8;

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const wrapperStyle: CSSProperties = {
  backgroundColor: colorTokens.surface.card,
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  boxShadow: shadowTokens.sm,
  padding: spacingTokens['5'],
  overflowX: 'auto',
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

function computePositions(segments: WaterfallSegment[]): WaterfallPosition[] {
  let running = 0;
  return segments.map((seg) => {
    if (seg.kind === 'absolute') {
      const pos: WaterfallPosition = {
        label: seg.label,
        value: seg.value,
        start: 0,
        end: seg.value,
        kind: seg.kind,
      };
      running = seg.value;
      return pos;
    }
    const start = running;
    running = running + seg.value;
    return { label: seg.label, value: seg.value, start, end: running, kind: seg.kind };
  });
}

function formatM(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}B`;
  return `$${v.toFixed(0)}M`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MarginBridgeWaterfall({ segments, title }: MarginBridgeWaterfallProps) {
  if (segments.length === 0) return null;

  const positions = computePositions(segments);

  // Determine Y scale from all start/end values
  const allVals = positions.flatMap((p) => [p.start, p.end]);
  const yMin = Math.min(0, ...allVals);
  const yMax = Math.max(...allVals);
  const yRange = yMax - yMin || 1;

  const barCount = positions.length;
  const barWidth = Math.max(1, (PLOT_W - (barCount - 1) * BAR_GAP) / barCount);

  const toY = (v: number) => PAD_TOP + PLOT_H * (1 - (v - yMin) / yRange);

  // Y-axis gridlines
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const frac = i / gridSteps;
    const val = yMin + frac * yRange;
    return { val, y: toY(val) };
  });

  return (
    <section style={wrapperStyle} data-testid="margin-bridge-waterfall" aria-label="Margin bridge waterfall">
      {title ? <h3 style={titleStyle}>{title}</h3> : null}
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        width="100%"
        role="img"
        aria-label="Margin bridge waterfall chart"
        style={{ display: 'block', maxWidth: CHART_W }}
      >
        <title>Margin Bridge Waterfall</title>

        {/* Y-axis gridlines */}
        {gridLines.map((g) => (
          <g key={g.val}>
            <line
              x1={PAD_LEFT}
              x2={PAD_LEFT + PLOT_W}
              y1={g.y}
              y2={g.y}
              stroke={colorTokens.border.subtle}
              strokeWidth={0.5}
            />
            <text
              x={PAD_LEFT - 6}
              y={g.y + 3}
              fill={colorTokens.text.muted}
              fontSize={10}
              textAnchor="end"
              fontFamily={typographyTokens.fontFamily.mono}
            >
              {formatM(g.val)}
            </text>
          </g>
        ))}

        {/* Bars + connectors */}
        {positions.map((pos, i) => {
          const x = PAD_LEFT + i * (barWidth + BAR_GAP);
          const top = toY(Math.max(pos.start, pos.end));
          const bottom = toY(Math.min(pos.start, pos.end));
          const barH = Math.max(1, bottom - top);

          const isNegativeDelta = pos.kind === 'delta' && pos.value < 0;
          const isAbsolute = pos.kind === 'absolute';

          let fill: string;
          if (isAbsolute) {
            fill = colorTokens.accent.muted;
          } else if (isNegativeDelta) {
            fill = colorTokens.semantic.danger;
          } else {
            fill = colorTokens.semantic.success;
          }

          // Connector line from previous bar
          const prevPos = i > 0 ? positions[i - 1] : null;

          return (
            <g key={pos.label}>
              {/* Connector from previous segment */}
              {prevPos && pos.kind === 'delta' ? (
                <line
                  x1={PAD_LEFT + (i - 1) * (barWidth + BAR_GAP) + barWidth}
                  x2={x}
                  y1={toY(pos.start)}
                  y2={toY(pos.start)}
                  stroke={colorTokens.border.default}
                  strokeWidth={1}
                  strokeDasharray="3,2"
                />
              ) : null}

              {/* Bar */}
              <rect
                x={x}
                y={top}
                width={barWidth}
                height={barH}
                fill={fill}
                rx={2}
              />

              {/* Value label above/below bar */}
              <text
                x={x + barWidth / 2}
                y={isNegativeDelta ? bottom + 14 : top - 6}
                fill={colorTokens.text.secondary}
                fontSize={10}
                fontWeight={typographyTokens.fontWeight.medium}
                textAnchor="middle"
                fontFamily={typographyTokens.fontFamily.mono}
              >
                {formatM(pos.value)}
              </text>

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={CHART_H - PAD_BOTTOM + 16}
                fill={colorTokens.text.secondary}
                fontSize={10}
                fontWeight={typographyTokens.fontWeight.medium}
                textAnchor="middle"
                fontFamily={typographyTokens.fontFamily.sans}
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
