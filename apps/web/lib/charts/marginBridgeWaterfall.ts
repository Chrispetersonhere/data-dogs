/**
 * Data-preparation layer for the Margin Bridge Waterfall chart.
 *
 * Transforms income-statement line items into the segment shape required
 * by <MarginBridgeWaterfall />.  Segments are either absolute (the
 * starting/ending totals) or delta (additive/subtractive steps).
 *
 * Data below is sourced from Apple Inc. (AAPL) FY 2024 10-K filing.
 * Source: SEC EDGAR, CIK 0000320193, Accession 0000320193-24-000123.
 * All figures in USD millions.
 */

/** A single segment in the waterfall. */
export type WaterfallSegment = {
  /** Display label for this bar. */
  label: string;
  /** Numeric value in USD millions. */
  value: number;
  /** "absolute" = full bar from zero; "delta" = bridge step. */
  kind: 'absolute' | 'delta';
};

/**
 * Apple Inc. FY 2024 income-statement waterfall.
 *
 * Revenue   → minus COGS    → Gross Profit
 *           → minus R&D     → minus SG&A
 *           → Operating Income → minus Tax & Other → Net Income
 *
 * Source: SEC EDGAR CIK 0000320193, FY 2024 10-K.
 */
export const APPLE_MARGIN_BRIDGE: WaterfallSegment[] = [
  { label: 'Revenue', value: 391_035, kind: 'absolute' },
  { label: 'COGS', value: -210_296, kind: 'delta' },
  { label: 'Gross Profit', value: 180_739, kind: 'absolute' },
  { label: 'R&D', value: -31_370, kind: 'delta' },
  { label: 'SG&A', value: -26_146, kind: 'delta' },
  { label: 'Operating Income', value: 123_223, kind: 'absolute' },
  { label: 'Other / Tax', value: -29_487, kind: 'delta' },
  { label: 'Net Income', value: 93_736, kind: 'absolute' },
];

/**
 * Compute the running total at each step for layout purposes.
 * Returns an array of { start, end } positions (in value-space) for each segment.
 */
export type WaterfallPosition = {
  label: string;
  value: number;
  start: number;
  end: number;
  kind: 'absolute' | 'delta';
};

export function computeWaterfallPositions(segments: WaterfallSegment[]): WaterfallPosition[] {
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
    return {
      label: seg.label,
      value: seg.value,
      start,
      end: running,
      kind: seg.kind,
    };
  });
}

/** Validate that waterfall segments are well-formed. */
export function validateWaterfallSegments(segments: WaterfallSegment[]): boolean {
  if (segments.length < 2) return false;
  if (segments[0].kind !== 'absolute') return false;
  if (segments[segments.length - 1].kind !== 'absolute') return false;
  return segments.every((s) => s.label.length > 0);
}
