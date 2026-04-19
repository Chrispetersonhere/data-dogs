import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTrendSparklineGeometry,
  type TrendSparklinePoint,
} from '../../../packages/ui/src/components/charts/TrendSparkline';

const MULTI_YEAR: TrendSparklinePoint[] = [
  { year: 2021, value: 100 },
  { year: 2022, value: 150 },
  { year: 2023, value: 200 },
  { year: 2024, value: 250 },
];

test('buildTrendSparklineGeometry returns null for empty input', () => {
  const geometry = buildTrendSparklineGeometry([]);
  assert.equal(geometry, null);
});

test('buildTrendSparklineGeometry centers a single point', () => {
  const geometry = buildTrendSparklineGeometry([{ year: 2024, value: 42 }], 100, 40);
  assert.ok(geometry);
  assert.equal(geometry.coords.length, 1);
  assert.equal(geometry.coords[0].x, 50);
  assert.equal(geometry.coords[0].y, 20);
  assert.equal(geometry.direction, 'flat', 'single point has no direction');
});

test('buildTrendSparklineGeometry emits one M and n-1 L commands', () => {
  const geometry = buildTrendSparklineGeometry(MULTI_YEAR, 100, 40);
  assert.ok(geometry);
  assert.equal(geometry.coords.length, 4);
  const mCount = (geometry.pathD.match(/M /g) ?? []).length;
  const lCount = (geometry.pathD.match(/L /g) ?? []).length;
  assert.equal(mCount, 1);
  assert.equal(lCount, 3);
});

test('buildTrendSparklineGeometry spreads x coords evenly across plot width', () => {
  const geometry = buildTrendSparklineGeometry(MULTI_YEAR, 100, 40);
  assert.ok(geometry);
  const xs = geometry.coords.map((c) => c.x);
  const plotWidth = 100 - 4 * 2;
  assert.equal(xs[0], 4);
  assert.equal(xs[xs.length - 1], 4 + plotWidth);
  for (let i = 1; i < xs.length; i += 1) {
    const expectedStep = plotWidth / (MULTI_YEAR.length - 1);
    assert.ok(Math.abs(xs[i] - xs[i - 1] - expectedStep) < 1e-6);
  }
});

test('buildTrendSparklineGeometry inverts y so larger values render higher', () => {
  const geometry = buildTrendSparklineGeometry(MULTI_YEAR, 100, 40);
  assert.ok(geometry);
  const firstY = geometry.coords[0].y;
  const lastY = geometry.coords[geometry.coords.length - 1].y;
  assert.ok(lastY < firstY, 'rising values produce decreasing y (screen-space)');
});

test('buildTrendSparklineGeometry flags direction=up when the last value exceeds the first', () => {
  const geometry = buildTrendSparklineGeometry(MULTI_YEAR);
  assert.ok(geometry);
  assert.equal(geometry.direction, 'up');
});

test('buildTrendSparklineGeometry flags direction=down when the last value is below the first', () => {
  const geometry = buildTrendSparklineGeometry([
    { year: 2021, value: 500 },
    { year: 2022, value: 250 },
  ]);
  assert.ok(geometry);
  assert.equal(geometry.direction, 'down');
});

test('buildTrendSparklineGeometry centers y when all values are equal', () => {
  const geometry = buildTrendSparklineGeometry(
    [
      { year: 2022, value: 100 },
      { year: 2023, value: 100 },
      { year: 2024, value: 100 },
    ],
    100,
    40,
  );
  assert.ok(geometry);
  assert.equal(geometry.direction, 'flat');
  for (const c of geometry.coords) {
    assert.equal(c.y, 20, 'equal values render at vertical midline');
  }
});
