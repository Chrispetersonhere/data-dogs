export type RawFactRow = {
  sourceConcept: string;
  unit: string;
  periodEnd: string;
  value: number;
  accession?: string;
};

export type NormalizedCandidate = {
  candidateId: string;
  sourceConcept: string;
  normalizedConcept: string;
  normalizationStatus: 'candidate' | 'ambiguous';
  rationale: string;
};

export type FactDiscrepancy = {
  sourceConcept: string;
  periodEnd: string;
  issue: string;
  details: string;
};

export type QaFactView = {
  cik: string;
  rawFactRows: RawFactRow[];
  normalizedCandidates: NormalizedCandidate[];
  discrepancies: FactDiscrepancy[];
};

type CompanyFactsPayload = {
  facts?: Record<string, Record<string, { units?: Record<string, Array<{ val?: number; end?: string; accn?: string }> }>>>;
};

function normalizeCik(cik: string): string {
  const digits = cik.replace(/\D/g, '');
  if (!digits) {
    throw new Error('cik is required');
  }
  return digits.padStart(10, '0');
}

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function localConceptName(sourceConcept: string): string {
  const separator = sourceConcept.indexOf(':');
  return separator >= 0 ? sourceConcept.slice(separator + 1) : sourceConcept;
}

function buildNormalizedConcept(sourceConcept: string): string {
  const local = localConceptName(sourceConcept);
  return local
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
}

export async function getQaFactView(cikInput: string): Promise<QaFactView> {
  const cik = normalizeCik(cikInput);
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SEC companyfacts request failed (${response.status}) for CIK ${cik}`);
  }

  const payload = (await response.json()) as CompanyFactsPayload;
  const facts = payload.facts ?? {};

  const rawFactRows: RawFactRow[] = [];
  const normalizedCandidates: NormalizedCandidate[] = [];
  const discrepancies: FactDiscrepancy[] = [];

  for (const [taxonomy, conceptMap] of Object.entries(facts)) {
    for (const [concept, detail] of Object.entries(conceptMap)) {
      const sourceConcept = `${taxonomy}:${concept}`;
      const units = detail.units ?? {};
      const unitNames = Object.keys(units);

      const normalizedConcept = buildNormalizedConcept(sourceConcept);
      const ambiguousUnitSet = unitNames.length > 1;
      normalizedCandidates.push({
        candidateId: `${sourceConcept}:${normalizedConcept}`,
        sourceConcept,
        normalizedConcept,
        normalizationStatus: ambiguousUnitSet ? 'ambiguous' : 'candidate',
        rationale: ambiguousUnitSet
          ? `Multiple units observed (${unitNames.join(', ')})`
          : 'Single-unit candidate from source concept',
      });

      if (ambiguousUnitSet) {
        discrepancies.push({
          sourceConcept,
          periodEnd: 'mixed',
          issue: 'unit_conflict',
          details: `Concept appears with multiple units: ${unitNames.join(', ')}`,
        });
      }

      for (const [unit, points] of Object.entries(units)) {
        for (const point of points.slice(0, 2)) {
          if (typeof point.val !== 'number') {
            continue;
          }
          rawFactRows.push({
            sourceConcept,
            unit,
            periodEnd: point.end ?? 'unknown',
            value: point.val,
            accession: point.accn,
          });
        }
      }
    }
  }

  rawFactRows.sort((a, b) => a.sourceConcept.localeCompare(b.sourceConcept));
  normalizedCandidates.sort((a, b) => a.sourceConcept.localeCompare(b.sourceConcept));

  return {
    cik,
    rawFactRows: rawFactRows.slice(0, 120),
    normalizedCandidates: normalizedCandidates.slice(0, 120),
    discrepancies,
  };
}
