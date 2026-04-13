from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from listing_history import ListingHistory


def test_effective_dated_listing_records_are_preserved() -> None:
    history = ListingHistory()

    history.add_record(
        security_id="security-000001",
        venue_code="NASDAQ",
        listing_symbol="ABCD",
        effective_from="2010-01-01T00:00:00+00:00",
        effective_to="2018-01-01T00:00:00+00:00",
    )
    history.add_record(
        security_id="security-000001",
        venue_code="NASDAQ",
        listing_symbol="ABCD",
        effective_from="2018-01-01T00:00:00+00:00",
        effective_to=None,
    )

    rows = history.get_history("security-000001")

    assert len(rows) == 2
    assert rows[0].effective_to == "2018-01-01T00:00:00+00:00"
    assert rows[1].effective_to is None


def test_listing_move_between_exchanges_is_preserved_as_transition() -> None:
    history = ListingHistory()

    history.add_record(
        security_id="security-000002",
        venue_code="NYSE",
        listing_symbol="MOVE",
        effective_from="2015-01-01T00:00:00+00:00",
    )
    history.transition_listing(
        security_id="security-000002",
        new_venue_code="NASDAQ",
        new_listing_symbol="MOVE",
        transition_at="2020-07-01T00:00:00+00:00",
    )

    rows = history.get_history("security-000002")

    assert len(rows) == 2
    assert rows[0].venue_code == "NYSE"
    assert rows[0].effective_to == "2020-07-01T00:00:00+00:00"
    assert rows[1].venue_code == "NASDAQ"
    assert rows[1].effective_from == "2020-07-01T00:00:00+00:00"
    assert rows[1].effective_to is None


def test_listing_symbol_change_is_preserved_without_overwrite() -> None:
    history = ListingHistory()

    history.add_record(
        security_id="security-000003",
        venue_code="NASDAQ",
        listing_symbol="OLD",
        effective_from="2017-01-01T00:00:00+00:00",
    )
    history.transition_listing(
        security_id="security-000003",
        new_venue_code="NASDAQ",
        new_listing_symbol="NEW",
        transition_at="2021-03-15T00:00:00+00:00",
    )

    rows = history.get_history("security-000003")

    assert len(rows) == 2
    assert rows[0].listing_symbol == "OLD"
    assert rows[0].effective_to == "2021-03-15T00:00:00+00:00"
    assert rows[1].listing_symbol == "NEW"
    assert rows[1].effective_to is None
