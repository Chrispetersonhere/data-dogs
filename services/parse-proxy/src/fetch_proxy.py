from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
from typing import Callable
from urllib.request import Request, urlopen

PARSER_VERSION = "parse-proxy.fetch_proxy.v1"


@dataclass(frozen=True)
class ProxyFilingRaw:
    accession: str
    source_url: str
    fetched_at_utc: str
    source_checksum_sha256: str
    parser_version: str
    job_id: str
    body_text: str


def _default_fetcher(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "data-dogs-parse-proxy/1.0 (+https://example.local)",
            "Accept": "text/plain,text/html;q=0.9,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_proxy_filing(
    source_url: str,
    accession: str,
    job_id: str,
    fetcher: Callable[[str], str] | None = None,
) -> ProxyFilingRaw:
    """Fetch proxy filing body and attach provenance metadata."""
    fetch_impl = fetcher or _default_fetcher
    body_text = fetch_impl(source_url)
    checksum = hashlib.sha256(body_text.encode("utf-8")).hexdigest()

    return ProxyFilingRaw(
        accession=accession,
        source_url=source_url,
        fetched_at_utc=_utc_now_iso(),
        source_checksum_sha256=checksum,
        parser_version=PARSER_VERSION,
        job_id=job_id,
        body_text=body_text,
    )
