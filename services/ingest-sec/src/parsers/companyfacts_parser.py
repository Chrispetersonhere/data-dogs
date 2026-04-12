from __future__ import annotations

from typing import Any


def parse_companyfacts_metadata(*, cik: str, payload: dict[str, Any], raw_checksum: str) -> dict[str, Any]:
    """Extract lightweight metadata needed for later fact normalization steps."""

    facts = payload.get("facts", {}) or {}

    taxonomy_count = len(facts)
    concept_count = 0
    unit_count = 0
    concept_keys: list[str] = []

    for taxonomy_name, concepts in facts.items():
        if not isinstance(concepts, dict):
            continue
        for concept_name, concept_payload in concepts.items():
            concept_count += 1
            concept_keys.append(f"{taxonomy_name}:{concept_name}")
            units = concept_payload.get("units", {}) if isinstance(concept_payload, dict) else {}
            if isinstance(units, dict):
                unit_count += len(units)

    return {
        "cik": cik,
        "entity_name": str(payload.get("entityName", "")),
        "taxonomy_count": taxonomy_count,
        "concept_count": concept_count,
        "unit_count": unit_count,
        "concept_keys": sorted(concept_keys),
        "raw_checksum_sha256": raw_checksum,
    }
