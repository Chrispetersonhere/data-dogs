'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
} from '../../../../packages/ui/src/styles/tokens';
import { PEER_UNIVERSE } from '../../lib/api/peer-benchmark';

type Props = {
  initialValue: string;
};

/**
 * Ticker search input with typeahead over the bundled peer universe.
 * Submits as a GET form to /peers?ticker=<value> so deep-linking works.
 * Tickers outside the bundle still submit — they resolve server-side via
 * SEC's full company_tickers.json.
 */
export function PeerSearchForm({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = value.trim().toUpperCase();
    if (!q) return PEER_UNIVERSE.slice(0, 8);
    return PEER_UNIVERSE.filter(
      (c) => c.ticker.toUpperCase().startsWith(q) || c.name.toUpperCase().includes(q),
    ).slice(0, 8);
  }, [value]);

  const containerStyle: CSSProperties = { position: 'relative', width: 360 };

  const inputStyle: CSSProperties = {
    width: '100%',
    background: colorTokens.surface.card,
    border: `1px solid ${colorTokens.border.subtle}`,
    borderRadius: radiusTokens.md,
    padding: `${spacingTokens['2']} ${spacingTokens['3']}`,
    fontSize: typographyTokens.fontSize.sm,
    fontFamily: typographyTokens.fontFamily.mono,
    color: colorTokens.text.primary,
    outline: 'none',
  };

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: spacingTokens['1'],
    width: '100%',
    background: colorTokens.surface.card,
    border: `1px solid ${colorTokens.border.subtle}`,
    borderRadius: radiusTokens.md,
    boxShadow: shadowTokens.lg,
    overflow: 'hidden',
    zIndex: 50,
    maxHeight: 320,
    overflowY: 'auto',
  };

  return (
    <div ref={rootRef} style={containerStyle}>
      <form method="GET" action="/peers" role="search" aria-label="Ticker lookup">
        <input
          type="text"
          name="ticker"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search ticker or company..."
          autoComplete="off"
          style={inputStyle}
          aria-label="Ticker"
        />
      </form>

      {open && suggestions.length > 0 && (
        <div style={dropdownStyle} role="listbox">
          {suggestions.map((c) => (
            <a
              key={c.ticker}
              href={`/peers?ticker=${encodeURIComponent(c.ticker)}`}
              role="option"
              aria-selected={false}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacingTokens['2']} ${spacingTokens['3']}`,
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: `1px solid ${colorTokens.border.subtle}`,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacingTokens['3'] }}>
                <span
                  style={{
                    fontFamily: typographyTokens.fontFamily.mono,
                    fontSize: typographyTokens.fontSize.sm,
                    fontWeight: typographyTokens.fontWeight.semibold,
                    color: colorTokens.semantic.success,
                    minWidth: 56,
                  }}
                >
                  {c.ticker}
                </span>
                <span style={{ fontSize: typographyTokens.fontSize.sm, color: colorTokens.text.secondary }}>
                  {c.name}
                </span>
              </span>
              <span
                style={{
                  fontSize: typographyTokens.fontSize.xs,
                  color: colorTokens.text.muted,
                  fontFamily: typographyTokens.fontFamily.mono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                SIC {c.sic}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
