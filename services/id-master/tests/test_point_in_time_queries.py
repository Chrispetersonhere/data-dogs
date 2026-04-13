from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from identifier_map import IdentifierMap
from listing_history import ListingHistory


def test_external_identifier_resolution_as_of_uses_validity_window() -> None:
    identifier_map = IdentifierMap()

    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000111",
        identifier_type="ticker",
        identifier_value="TWTR",
        valid_from="2013-11-07T00:00:00+00:00",
        valid_to="2022-10-27T00:00:00+00:00",
        observed_at="2013-11-07T00:00:00+00:00",
    )
    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000222",
        identifier_type="ticker",
        identifier_value="X",
        valid_from="2023-07-24T00:00:00+00:00",
        valid_to=None,
        observed_at="2023-07-24T00:00:00+00:00",
    )

    rows = identifier_map.resolve_external_identifier_as_of(
        identifier_type="ticker",
        identifier_value="TWTR",
        as_of="2020-01-01T00:00:00+00:00",
    )

    assert len(rows) == 1
    assert rows[0].subject_id == "security-000111"


def test_identifier_resolution_prevents_lookahead_with_knowledge_cutoff() -> None:
    identifier_map = IdentifierMap()

    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000333",
        identifier_type="ticker",
        identifier_value="XYZ",
        valid_from="2019-01-01T00:00:00+00:00",
        valid_to=None,
        observed_at="2024-01-15T00:00:00+00:00",
    )

    rows_without_lookahead = identifier_map.resolve_external_identifier_as_of(
        identifier_type="ticker",
        identifier_value="XYZ",
        as_of="2020-06-01T00:00:00+00:00",
        knowledge_as_of="2020-06-01T00:00:00+00:00",
    )
    rows_with_late_backfill_known = identifier_map.resolve_external_identifier_as_of(
        identifier_type="ticker",
        identifier_value="XYZ",
        as_of="2020-06-01T00:00:00+00:00",
        knowledge_as_of="2025-01-01T00:00:00+00:00",
    )

    assert rows_without_lookahead == []
    assert len(rows_with_late_backfill_known) == 1


def test_listing_as_of_prevents_lookahead_for_future_recorded_transition() -> None:
    history = ListingHistory()

    history.add_record(
        security_id="security-000444",
        venue_code="NYSE",
        listing_symbol="LOOK",
        effective_from="2018-01-01T00:00:00+00:00",
        effective_to="2021-01-01T00:00:00+00:00",
        recorded_at="2018-01-01T00:00:00+00:00",
    )
    history.add_record(
        security_id="security-000444",
        venue_code="NASDAQ",
        listing_symbol="LOOK",
        effective_from="2021-01-01T00:00:00+00:00",
        effective_to=None,
        recorded_at="2022-02-01T00:00:00+00:00",
    )

    as_known_in_2021 = history.get_listing_as_of(
        security_id="security-000444",
        as_of="2021-06-01T00:00:00+00:00",
        knowledge_as_of="2021-06-01T00:00:00+00:00",
    )
    as_known_in_2023 = history.get_listing_as_of(
        security_id="security-000444",
        as_of="2021-06-01T00:00:00+00:00",
        knowledge_as_of="2023-01-01T00:00:00+00:00",
    )

    assert as_known_in_2021 is None
    assert as_known_in_2023 is not None
    assert as_known_in_2023.venue_code == "NASDAQ"
