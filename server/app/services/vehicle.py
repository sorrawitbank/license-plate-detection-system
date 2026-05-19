from __future__ import annotations

from typing import TypedDict

import asyncpg
from rapidfuzz import fuzz

from app.utils.plates import (
    build_ocr_plate_candidates,
    normalize_plate_text,
)


_PLATE_MATCH_MIN_SCORE = 70


class VehiclePlateMatch(TypedDict):
    vehicleId: str | None
    matchScore: float | None
    detectedPlate: str
    plateTextIndices: list[int]


async def fetch_vehicles_for_plate_match(
    connection: asyncpg.Connection,
    province_id: int | None = None,
) -> list[asyncpg.Record]:
    if province_id is not None:
        return await connection.fetch(
            """
            SELECT vehicle_id, plate_prefix, plate_number
            FROM vehicles
            WHERE province_id = $1
            """,
            province_id,
        )
    return await connection.fetch(
        """
        SELECT vehicle_id, plate_prefix, plate_number
        FROM vehicles
        """
    )


def fuzzy_match_vehicle_plate(
    *,
    candidates: list[str],
    detected_plate: str,
    used_indices: list[int],
    vehicles: list[asyncpg.Record],
) -> VehiclePlateMatch:
    if not candidates:
        return {
            "vehicleId": None,
            "matchScore": None,
            "detectedPlate": detected_plate,
            "plateTextIndices": used_indices,
        }

    best_vehicle_id: str | None = None
    best_score = 0.0
    best_candidate = detected_plate or candidates[0]

    for row in vehicles:
        canonical = normalize_plate_text(f"{row['plate_prefix']}{row['plate_number']}")
        if not canonical:
            continue
        for candidate in candidates:
            score = float(fuzz.WRatio(candidate, canonical))
            if score > best_score:
                best_score = score
                best_vehicle_id = str(row["vehicle_id"])
                best_candidate = candidate

    if best_score < _PLATE_MATCH_MIN_SCORE or best_vehicle_id is None:
        return {
            "vehicleId": None,
            "matchScore": best_score if best_score > 0 else None,
            "detectedPlate": best_candidate,
            "plateTextIndices": used_indices,
        }

    return {
        "vehicleId": best_vehicle_id,
        "matchScore": best_score,
        "detectedPlate": best_candidate,
        "plateTextIndices": used_indices,
    }


async def match_vehicle_from_ocr(
    connection: asyncpg.Connection,
    ocr_texts: list[str],
    province_id: int | None = None,
    province_index: int | None = None,
) -> VehiclePlateMatch:
    """Fuzzy-match OCR plate candidates against registered vehicles."""
    candidates, used_indices = build_ocr_plate_candidates(ocr_texts, province_index)
    detected_plate = (
        "".join(normalize_plate_text(ocr_texts[i]) for i in used_indices)
        if used_indices
        else ""
    )

    if not candidates:
        return {
            "vehicleId": None,
            "matchScore": None,
            "detectedPlate": detected_plate,
            "plateTextIndices": used_indices,
        }

    vehicles = await fetch_vehicles_for_plate_match(connection, province_id)
    return fuzzy_match_vehicle_plate(
        candidates=candidates,
        detected_plate=detected_plate,
        used_indices=used_indices,
        vehicles=vehicles,
    )
