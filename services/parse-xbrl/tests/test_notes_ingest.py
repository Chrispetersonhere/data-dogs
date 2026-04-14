from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.notes_ingest import InMemoryNotesArtifactStore, ingest_note_artifacts


def _sample_artifacts() -> list[dict[str, object]]:
    return [
        {
            "note_type": "revenue-recognition",
            "source_uri": "sec://filing/0000320193-24-000123/note-1",
            "title": "Revenue Recognition",
            "text": "The Company recognizes revenue when control transfers.",
        },
        {
            "note_type": "inventory",
            "source_uri": "sec://filing/0000320193-24-000123/note-2",
            "title": "Inventories",
            "text": "Inventories are stated at the lower of cost and net realizable value.",
        },
    ]


def test_ingest_stores_artifacts_and_links_to_filing_and_issuer() -> None:
    store = InMemoryNotesArtifactStore()

    result = ingest_note_artifacts(
        filing_accession="0000320193-24-000123",
        issuer_cik="0000320193",
        artifacts=_sample_artifacts(),
        store=store,
    )

    assert result["stored_count"] == 2
    assert result["filing_accession"] == "0000320193-24-000123"
    assert result["issuer_cik"] == "0000320193"
    assert len(store.artifacts_by_checksum) == 2
    assert len(store.artifact_links) == 2

    for checksum in result["artifact_checksums"]:
        artifact = store.artifacts_by_checksum[checksum]
        assert artifact.filing_accession == "0000320193-24-000123"
        assert artifact.issuer_cik == "0000320193"
        assert artifact.parser_version == "day24-notes-v1"
        assert artifact.discovered_at

    for link in store.artifact_links:
        assert link["filing_accession"] == "0000320193-24-000123"
        assert link["issuer_cik"] == "0000320193"
        assert link["linked_at"]


def test_ingest_rerun_deduplicates_artifacts_and_links() -> None:
    store = InMemoryNotesArtifactStore()
    artifacts = _sample_artifacts()

    first = ingest_note_artifacts(
        filing_accession="0000789019-24-000045",
        issuer_cik="0000789019",
        artifacts=artifacts,
        store=store,
    )
    second = ingest_note_artifacts(
        filing_accession="0000789019-24-000045",
        issuer_cik="0000789019",
        artifacts=artifacts,
        store=store,
    )

    assert first["stored_count"] == 2
    assert second["stored_count"] == 2
    assert len(store.artifacts_by_checksum) == 2
    assert len(store.artifact_links) == 2


def test_missing_filing_or_issuer_linkage_is_rejected() -> None:
    store = InMemoryNotesArtifactStore()

    with pytest.raises(ValueError, match="filing_accession"):
        ingest_note_artifacts(
            filing_accession="",
            issuer_cik="0001652044",
            artifacts=_sample_artifacts(),
            store=store,
        )

    with pytest.raises(ValueError, match="issuer_cik"):
        ingest_note_artifacts(
            filing_accession="0001652044-24-000010",
            issuer_cik=" ",
            artifacts=_sample_artifacts(),
            store=store,
        )

    assert len(store.artifacts_by_checksum) == 0
    assert len(store.artifact_links) == 0
