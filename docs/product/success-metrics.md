# v1 Success Metrics (Day 1 Baseline)

## 90-Day Metrics
- **Data coverage:** >= 95% of targeted U.S. issuers have filing coverage in v1 datasets.
- **Lineage completeness:** 100% of exposed v1 facts carry full provenance fields.
- **Point-in-time correctness:** 0 accepted look-ahead leakage defects.
- **Pipeline reliability:** >= 99% successful scheduled ingestion job rate over trailing 30 days by Day 90.
- **Extraction quality:** <= 2% correction rate in sampled QA facts.
- **Workflow efficiency:** <= 10-minute median completion time across the 5 core workflows.

## Measurement Notes
- Metrics are measured with environment-tagged daily snapshots and retained logs.
- Any denominator or definition change must be documented before metric comparison.
- Failures are investigated with job-level and parser-level identifiers for auditability.
