/**
 * Peer benchmarking — I/O layer.
 *
 * Resolves any US-listed ticker against SEC EDGAR, derives a small set of
 * headline financial metrics from XBRL companyfacts, and finds SIC-matched
 * peers inside a bundled universe so the tool works for any company without
 * the monorepo's Postgres being populated.
 *
 * Why a bundled universe: finding peers by SIC requires a reverse index from
 * SIC → CIK-list. `company_tickers.json` gives ticker → CIK but not SIC;
 * deriving SIC would mean one submissions call per ticker, 13k calls. The
 * bundle trades peer universe breadth for startup latency; extend the file
 * as more issuers are needed.
 */

import peerUniverseData from '../../app/peers/peer-universe.json';

import { deriveMetricsFromFacts } from './peer-benchmark-metrics';
import type { CompanyFactsShape, CompanyRecord } from './peer-benchmark-metrics';

// ---------------------------------------------------------------------------
// Bundled peer universe
// ---------------------------------------------------------------------------

export type UniverseEntry = {
  ticker: string;
  cik: string;
  name: string;
  sic: string;
  sicDescription: string;
};

export const PEER_UNIVERSE: readonly UniverseEntry[] = peerUniverseData as UniverseEntry[];

const BY_TICKER = new Map<string, UniverseEntry>(PEER_UNIVERSE.map((e) => [e.ticker.toUpperCase(), e]));
const BY_CIK = new Map<string, UniverseEntry>(PEER_UNIVERSE.map((e) => [normalizeCik(e.cik), e]));

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function normalizeCik(cik: string): string {
  const digits = String(cik).replace(/\D/g, '');
  return digits.padStart(10, '0');
}

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

async function secFetchJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new Error(`SEC request failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Ticker → CIK resolution
// ---------------------------------------------------------------------------

type SecTickerMap = Record<
  string,
  { cik_str: number; ticker: string; title: string }
>;

let cachedTickerMap: Promise<Map<string, { cik: string; name: string }>> | null = null;

/**
 * SEC publishes the full ticker→CIK map at /files/company_tickers.json. We
 * lazy-fetch and cache it per process so arbitrary tickers outside the
 * bundled universe still resolve. Submissions JSON is hit per-ticker to get
 * name/SIC/description since ticker_map does not carry them.
 */
async function getSecTickerMap(): Promise<Map<string, { cik: string; name: string }>> {
  if (!cachedTickerMap) {
    cachedTickerMap = (async () => {
      const raw = await secFetchJson<SecTickerMap>(
        'https://www.sec.gov/files/company_tickers.json',
        86_400,
      );
      const out = new Map<string, { cik: string; name: string }>();
      for (const row of Object.values(raw)) {
        out.set(row.ticker.toUpperCase(), {
          cik: normalizeCik(String(row.cik_str)),
          name: row.title,
        });
      }
      return out;
    })().catch((err) => {
      cachedTickerMap = null;
      throw err;
    });
  }
  return cachedTickerMap;
}

type SubmissionsShape = {
  cik: string;
  name: string;
  sic?: string;
  sicDescription?: string;
  tickers?: string[];
};

async function fetchSubmissions(cik: string): Promise<SubmissionsShape> {
  const padded = normalizeCik(cik);
  return secFetchJson<SubmissionsShape>(
    `https://data.sec.gov/submissions/CIK${padded}.json`,
    300,
  );
}

async function fetchCompanyFacts(cik: string): Promise<CompanyFactsShape> {
  const padded = normalizeCik(cik);
  return secFetchJson<CompanyFactsShape>(
    `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`,
    300,
  );
}

export type ResolvedTicker = {
  ticker: string;
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
};

/**
 * Resolve a user-supplied ticker to a CIK and classification. First hits the
 * bundled universe (fast, no network); falls back to live SEC lookups for
 * arbitrary tickers.
 */
export async function resolveTicker(tickerRaw: string): Promise<ResolvedTicker> {
  const ticker = tickerRaw.trim().toUpperCase();
  if (!ticker) throw new Error('Ticker must not be empty');

  const bundled = BY_TICKER.get(ticker);
  if (bundled) {
    return {
      ticker: bundled.ticker,
      cik: bundled.cik,
      name: bundled.name,
      sic: bundled.sic,
      sicDescription: bundled.sicDescription,
    };
  }

  const tickerMap = await getSecTickerMap();
  const hit = tickerMap.get(ticker);
  if (!hit) throw new TickerNotFoundError(ticker);

  const submissions = await fetchSubmissions(hit.cik);
  return {
    ticker,
    cik: normalizeCik(hit.cik),
    name: submissions.name || hit.name,
    sic: submissions.sic ?? null,
    sicDescription: submissions.sicDescription ?? null,
  };
}

export class TickerNotFoundError extends Error {
  constructor(public readonly ticker: string) {
    super(`Ticker "${ticker}" not found in SEC EDGAR`);
    this.name = 'TickerNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Peer lookup
// ---------------------------------------------------------------------------

/**
 * Find peers for a given SIC from the bundled universe, excluding the target
 * CIK. Limits to `max` to keep the radar readable and the fetch fan-out low.
 */
export function findPeers(sic: string | null, excludeCik: string, max = 6): UniverseEntry[] {
  if (!sic) return [];
  const excluded = normalizeCik(excludeCik);
  return PEER_UNIVERSE.filter((e) => e.sic === sic && normalizeCik(e.cik) !== excluded).slice(0, max);
}

// ---------------------------------------------------------------------------
// Top-level orchestration
// ---------------------------------------------------------------------------

export type PeerBenchmarkResult = {
  target: CompanyRecord;
  peers: CompanyRecord[];
  peerUniverseSize: number;
  missingPeerCiks: string[];
};

async function toCompanyRecord(entry: {
  ticker: string;
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
}): Promise<CompanyRecord> {
  const facts = await fetchCompanyFacts(entry.cik);
  return {
    ticker: entry.ticker,
    cik: normalizeCik(entry.cik),
    name: entry.name,
    sic: entry.sic,
    sicDescription: entry.sicDescription,
    metrics: deriveMetricsFromFacts(facts),
  };
}

/**
 * Build the full peer benchmark for a ticker: resolves identity, finds
 * peers, fetches companyfacts for target + each peer in parallel, and
 * derives the metric set. Peers that fail companyfacts (e.g. CIK not in
 * XBRL) are dropped and reported back as `missingPeerCiks`.
 */
export async function buildPeerBenchmark(tickerRaw: string): Promise<PeerBenchmarkResult> {
  const resolved = await resolveTicker(tickerRaw);
  const peerEntries = findPeers(resolved.sic, resolved.cik);

  type PeerOutcome = { ok: true; record: CompanyRecord } | { ok: false; cik: string };

  const targetPromise = toCompanyRecord(resolved);
  const peerPromises: Promise<PeerOutcome>[] = peerEntries.map((p) =>
    toCompanyRecord({
      ticker: p.ticker,
      cik: p.cik,
      name: p.name,
      sic: p.sic,
      sicDescription: p.sicDescription,
    })
      .then((record): PeerOutcome => ({ ok: true, record }))
      .catch((): PeerOutcome => ({ ok: false, cik: p.cik })),
  );

  const [targetRecord, peerSettled] = await Promise.all([
    targetPromise,
    Promise.all(peerPromises),
  ]);

  const peers: CompanyRecord[] = [];
  const missing: string[] = [];
  for (const p of peerSettled) {
    if (p.ok) peers.push(p.record);
    else missing.push(p.cik);
  }

  return {
    target: targetRecord,
    peers,
    peerUniverseSize: PEER_UNIVERSE.filter((e) => e.sic === resolved.sic).length,
    missingPeerCiks: missing,
  };
}

// Exposed for tests; kept internal to module surface via named exports above.
export const __test__ = {
  normalizeCik,
  BY_CIK,
};
