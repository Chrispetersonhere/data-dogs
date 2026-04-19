import type { CSSProperties } from 'react';

import { colorTokens, typographyTokens } from '../../styles/tokens';

export type TrendSparklinePoint = {
  year: number;
  value: number;
};

export type TrendSparklineProps = {
  label: string;
  points: TrendSparklinePoint[];
  width?: number;
  height?: number;
};

export type SparklineCoord = {
  x: number;
  y: number;
  year: number;
  value: number;
};

export type SparklineGeometry = {
  coords: SparklineCoord[];
  pathD: string;
  direction: 'up' | 'down' | 'flat';
};

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 40;
const PADDING = 4;

/**
 * Pure geometry for the trend sparkline. Separated from the component so
 * it can be unit-tested without rendering React. Coordinate origin is
 * top-left; larger values render higher on screen.
 */
export function buildTrendSparklineGeometry(
  points: TrendSparklinePoint[],
  width: number = DEFAULT_WIDTH,
  height: number = DEFAULT_HEIGHT,
): SparklineGeometry | null {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const plotW = width - PADDING * 2;
  const plotH = height - PADDING * 2;

  const coords: SparklineCoord[] = points.map((p, i) => {
    const x = points.length === 1
      ? PADDING + plotW / 2
      : PADDING + (i / (points.length - 1)) * plotW;
    const y = range === 0
      ? PADDING + plotH / 2
      : PADDING + plotH - ((p.value - min) / range) * plotH;
    return { x, y, year: p.year, value: p.value };
  });

  const pathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const direction: SparklineGeometry['direction'] =
    last > first ? 'up' : last < first ? 'down' : 'flat';

  return { coords, pathD, direction };
}

const unavailableStyle: CSSProperties = {
  fontFamily: typographyTokens.fontFamily.sans,
  fontSize: typographyTokens.fontSize.xs,
  fill: colorTokens.signal.flat,
};

export function TrendSparkline({
  label,
  points,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: TrendSparklineProps) {
  const geometry = buildTrendSparklineGeometry(points, width, height);

  if (!geometry) {
    return (
      <svg
        role="img"
        aria-label={`${label} trend unavailable`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" style={unavailableStyle}>
          No trend
        </text>
      </svg>
    );
  }

  const strokeColor =
    geometry.direction === 'up'
      ? colorTokens.signal.up
      : geometry.direction === 'down'
        ? colorTokens.signal.down
        : colorTokens.signal.flat;

  const firstYear = points[0].year;
  const lastYear = points[points.length - 1].year;
  const ariaLabel = `${label} trend from FY ${firstYear} to FY ${lastYear}, direction ${geometry.direction}`;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      data-trend-direction={geometry.direction}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={geometry.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {geometry.coords.map((c) => (
        <circle key={c.year} cx={c.x} cy={c.y} r={1.75} fill={strokeColor} />
      ))}
    </svg>
  );
}
