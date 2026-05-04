/**
 * Curated ticker → CIK mapping for the public `/company/[companyId]` route.
 *
 * The route accepts either a CIK (digits-only or zero-padded) or one of the
 * tickers below, so `/company/AAPL` and `/company/0000320193` resolve to the
 * same SEC submissions feed.
 *
 * Why a hand-curated set rather than the full SEC ticker file?
 *   - The full file is ~10k entries and changes weekly. A small curated set
 *     keeps URLs predictable, lets us featureflag which issuers we actively
 *     promote, and avoids unbounded crawling of issuer detail pages by bots.
 *   - When we want the long tail, we'll pull SEC's `company_tickers.json`
 *     into a lookup at runtime — that's a separate change.
 *
 * Adding a new entry: pick the issuer, find the CIK on EDGAR
 * (https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=...), pad
 * to 10 digits, add to FEATURED_ISSUERS.
 */

export type FeaturedIssuer = {
  ticker: string;
  cik: string;
  name: string;
};

export const FEATURED_ISSUERS: ReadonlyArray<FeaturedIssuer> = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp.' },
  { ticker: 'GOOGL', cik: '0001652044', name: 'Alphabet Inc.' },
  { ticker: 'NVDA', cik: '0001045810', name: 'NVIDIA Corp.' },
  { ticker: 'META', cik: '0001326801', name: 'Meta Platforms Inc.' },
];

const BY_TICKER: ReadonlyMap<string, FeaturedIssuer> = new Map(
  FEATURED_ISSUERS.map((issuer) => [issuer.ticker.toUpperCase(), issuer]),
);

const BY_CIK: ReadonlyMap<string, FeaturedIssuer> = new Map(
  FEATURED_ISSUERS.map((issuer) => [issuer.cik, issuer]),
);

export function findIssuerByTicker(ticker: string): FeaturedIssuer | null {
  return BY_TICKER.get(ticker.trim().toUpperCase()) ?? null;
}

export function findIssuerByCik(cik: string): FeaturedIssuer | null {
  const digits = cik.replace(/\D/g, '');
  if (digits.length === 0) {
    return null;
  }
  // Normalize via parseInt so any padding (under or over 10 chars) collapses
  // to a canonical 10-digit form before lookup.
  const padded = String(parseInt(digits, 10)).padStart(10, '0');
  return BY_CIK.get(padded) ?? null;
}

/**
 * Resolve a route segment (`/company/[companyId]`) to a canonical CIK.
 *
 * - All-digit input (`'320193'`, `'0000320193'`) → returned as-is, untouched.
 *   The downstream `padCik` in `lib/api/company.ts` handles padding.
 * - Alphanumeric input → looked up in the curated ticker map. Case-insensitive.
 * - Unknown ticker → returns null so the page can render a helpful 404
 *   instead of forwarding garbage to SEC.
 */
export function resolveCompanyIdToCik(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  const entry = findIssuerByTicker(trimmed);
  return entry ? entry.cik : null;
}

export function isLikelyTicker(input: string): boolean {
  return !/^\d+$/.test(input.trim()) && /^[A-Za-z][A-Za-z0-9.-]{0,9}$/.test(input.trim());
}
