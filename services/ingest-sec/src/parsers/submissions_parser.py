from __future__ import annotations

from typing import Any


def parse_submission_headers(*, cik: str, submission_json: dict[str, Any], raw_checksum: str) -> list[dict[str, str]]:
    """Extract filing header staging rows from SEC submissions JSON."""

    filings_recent = submission_json.get("filings", {}).get("recent", {})
    accession_numbers = filings_recent.get("accessionNumber", []) or []
    filing_dates = filings_recent.get("filingDate", []) or []
    forms = filings_recent.get("form", []) or []
    primary_documents = filings_recent.get("primaryDocument", []) or []
    primary_doc_descriptions = filings_recent.get("primaryDocDescription", []) or []

    rows: list[dict[str, str]] = []
    for idx, accession in enumerate(accession_numbers):
        rows.append(
            {
                "cik": cik,
                "accession_number": str(accession),
                "filing_date": str(filing_dates[idx]) if idx < len(filing_dates) else "",
                "form": str(forms[idx]) if idx < len(forms) else "",
                "primary_document": str(primary_documents[idx]) if idx < len(primary_documents) else "",
                "primary_doc_description": str(primary_doc_descriptions[idx])
                if idx < len(primary_doc_descriptions)
                else "",
                "raw_checksum_sha256": raw_checksum,
            }
        )
    return rows
