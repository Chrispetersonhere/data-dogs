from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from identifier_map import IdentifierMap


def test_internal_company_issuer_security_ids_can_map_external_identifiers() -> None:
    identifier_map = IdentifierMap()

    company_map = identifier_map.add_mapping(
        subject_type="company",
        subject_id="company-000001",
        identifier_type="cik",
        identifier_value="0000320193",
        valid_from="1980-12-12T00:00:00+00:00",
    )
    issuer_map = identifier_map.add_mapping(
        subject_type="issuer",
        subject_id="issuer-000001",
        identifier_type="cik",
        identifier_value="0000320193",
        valid_from="1980-12-12T00:00:00+00:00",
    )
    security_map = identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000001",
        identifier_type="ticker",
        identifier_value="AAPL",
        valid_from="1980-12-12T00:00:00+00:00",
    )

    assert company_map.subject_type == "company"
    assert issuer_map.subject_type == "issuer"
    assert security_map.subject_type == "security"


def test_identifier_history_is_preserved_for_external_identifier() -> None:
    identifier_map = IdentifierMap()

    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000100",
        identifier_type="ticker",
        identifier_value="META",
        valid_from="2012-05-18T00:00:00+00:00",
        valid_to="2022-06-09T00:00:00+00:00",
    )
    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000100",
        identifier_type="ticker",
        identifier_value="META",
        valid_from="2022-06-09T00:00:00+00:00",
        valid_to=None,
    )

    history = identifier_map.get_by_external_identifier(identifier_type="ticker", identifier_value="META")

    assert len(history) == 2
    assert history[0].valid_to == "2022-06-09T00:00:00+00:00"
    assert history[1].valid_to is None


def test_ticker_does_not_imply_permanent_identity() -> None:
    identifier_map = IdentifierMap()

    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000200",
        identifier_type="ticker",
        identifier_value="ABC",
        valid_from="2001-01-01T00:00:00+00:00",
        valid_to="2010-01-01T00:00:00+00:00",
    )
    identifier_map.add_mapping(
        subject_type="security",
        subject_id="security-000300",
        identifier_type="ticker",
        identifier_value="ABC",
        valid_from="2015-01-01T00:00:00+00:00",
        valid_to=None,
    )

    mappings = identifier_map.get_by_external_identifier(identifier_type="ticker", identifier_value="ABC")
    subject_ids = {row.subject_id for row in mappings}

    assert len(mappings) == 2
    assert subject_ids == {"security-000200", "security-000300"}
