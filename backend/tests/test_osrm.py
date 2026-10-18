from __future__ import annotations

from backend.services.osrm import _merge_leg_geometries


def test_merge_leg_geometries_deduplicates_shared_endpoint() -> None:
    leg_a = [(52.0, 19.0), (52.01, 19.01), (52.02, 19.02)]
    leg_b = [(52.02, 19.02), (52.03, 19.03)]
    merged = _merge_leg_geometries([leg_a, leg_b])
    assert merged == [
        (52.0, 19.0),
        (52.01, 19.01),
        (52.02, 19.02),
        (52.03, 19.03),
    ]
