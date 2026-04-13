from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from security_master import SecurityMaster


def test_multiple_securities_can_exist_for_single_issuer() -> None:
    master = SecurityMaster()

    common = master.upsert_security(
        issuer_id="issuer-000001",
        security_key="cusip-037833100",
        security_type="common_stock",
        observed_at="2024-01-01T00:00:00+00:00",
    )
    preferred = master.upsert_security(
        issuer_id="issuer-000001",
        security_key="cusip-037833209",
        security_type="preferred_stock",
        observed_at="2024-01-01T00:00:00+00:00",
    )

    assert common.security_id != preferred.security_id
    assert common.issuer_id == preferred.issuer_id

    securities = master.get_securities_for_issuer("issuer-000001")
    assert len(securities) == 2


def test_effective_dated_listing_relationships_are_preserved() -> None:
    master = SecurityMaster()

    security = master.upsert_security(
        issuer_id="issuer-000002",
        security_key="isin-us5949181045",
        security_type="common_stock",
    )

    master.add_listing(
        security_id=security.security_id,
        venue_code="NASDAQ",
        listing_symbol="MSFT",
        effective_from="1986-03-13T00:00:00+00:00",
        effective_to="2000-01-01T00:00:00+00:00",
    )
    master.add_listing(
        security_id=security.security_id,
        venue_code="NASDAQ",
        listing_symbol="MSFT",
        effective_from="2000-01-01T00:00:00+00:00",
        effective_to=None,
    )

    listings = master.get_listings(security.security_id)

    assert len(listings) == 2
    assert listings[0].effective_to == "2000-01-01T00:00:00+00:00"
    assert listings[1].effective_to is None


def test_security_records_are_separate_from_issuer_identity() -> None:
    master = SecurityMaster()

    security = master.upsert_security(
        issuer_id="issuer-000003",
        security_key="cusip-02079k305",
        security_type="common_stock",
    )

    assert security.security_id.startswith("security-")
    assert security.issuer_id == "issuer-000003"

    with pytest.raises(KeyError):
        master.add_listing(
            security_id="security-999999",
            venue_code="NASDAQ",
            listing_symbol="GOOG",
            effective_from="2004-08-19T00:00:00+00:00",
        )
