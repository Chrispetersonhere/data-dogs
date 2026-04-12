from __future__ import annotations

from typing import Any


def _list_field(payload: dict[str, Any], key: str) -> list[Any]:
    value = payload.get(key, [])
    if isinstance(value, list):
        return value
    return []


def parse_submission_headers(*, cik: str, submission_json: dict[str, Any], raw_checksum: str) -> list[dict[str, str]]:
    """Extract filing header staging rows from SEC submissions JSON."""

    filings = submission_json.get("filings")
    filings_recent = filings.get("recent", {}) if isinstance(filings, dict) else {}

    accession_numbers = _list_field(filings_recent, "accessionNumber")
    filing_dates = _list_field(filings_recent, "filingDate")
    forms = _list_field(filings_recent, "form")
    primary_documents = _list_field(filings_recent, "primaryDocument")
    primary_doc_descriptions = _list_field(filings_recent, "primaryDocDescription")

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
