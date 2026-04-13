from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from issuer_master import IssuerMaster


def test_issuer_identity_is_stable_across_display_name_changes() -> None:
    master = IssuerMaster()

    initial = master.upsert_issuer(
        issuer_key="0000320193",
        display_name="Apple Computer, Inc.",
        observed_at="2023-01-01T00:00:00+00:00",
    )
    renamed = master.upsert_issuer(
        issuer_key="0000320193",
        display_name="Apple Inc.",
        observed_at="2024-01-01T00:00:00+00:00",
    )

    assert renamed.issuer_id == initial.issuer_id
    assert renamed.issuer_key == "0000320193"
    assert renamed.current_name == "Apple Inc."


def test_historical_names_are_preserved_when_display_name_changes() -> None:
    master = IssuerMaster()

    issuer = master.upsert_issuer(
        issuer_key="0000789019",
        display_name="MICROSOFT CORP",
        observed_at="2022-01-01T00:00:00+00:00",
    )
    master.upsert_issuer(
        issuer_key="0000789019",
        display_name="Microsoft Corporation",
        observed_at="2023-06-01T00:00:00+00:00",
    )

    history = master.get_name_history(issuer.issuer_id)

    assert len(history) == 2
    assert history[0].name == "MICROSOFT CORP"
    assert history[0].valid_from == "2022-01-01T00:00:00+00:00"
    assert history[0].valid_to == "2023-06-01T00:00:00+00:00"

    assert history[1].name == "Microsoft Corporation"
    assert history[1].valid_from == "2023-06-01T00:00:00+00:00"
    assert history[1].valid_to is None


def test_reinserting_same_name_does_not_create_new_history_entry() -> None:
    master = IssuerMaster()

    issuer = master.upsert_issuer(
        issuer_key="0001652044",
        display_name="Alphabet Inc.",
        observed_at="2024-03-01T00:00:00+00:00",
    )
    second = master.upsert_issuer(
        issuer_key="0001652044",
        display_name="Alphabet Inc.",
        observed_at="2024-04-01T00:00:00+00:00",
    )

    assert second.issuer_id == issuer.issuer_id
    history = master.get_name_history(issuer.issuer_id)
    assert len(history) == 1
    assert history[0].name == "Alphabet Inc."
