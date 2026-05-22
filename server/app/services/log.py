from __future__ import annotations

from typing import Literal

import asyncpg

from app.schemas.log import DetectResultItem
from app.services.vehicle import match_vehicle_from_ocr
from app.utils.classify_tenant_status import classify_tenant_status
from app.utils.plates import plate_confidence_from_ocr


async def get_slot_id_for_vehicle(
    connection: asyncpg.Connection,
    vehicle_id: str,
) -> int | None:
    row = await connection.fetchrow(
        """
        SELECT slot_id
        FROM parking_slots
        WHERE vehicle_id = $1
        LIMIT 1
        """,
        vehicle_id,
    )
    if row is None:
        return None
    return int(row["slot_id"])


async def insert_parking_log(
    connection: asyncpg.Connection,
    *,
    vehicle_id: str | None,
    slot_id: int | None,
    event_type: str,
    detected_plate: str,
    confidence: float,
    timestamp_sec: float | None = None,
) -> asyncpg.Record:
    offset_sec = float(timestamp_sec) if timestamp_sec is not None else 0.0
    return await connection.fetchrow(
        """
        INSERT INTO parking_logs (
            vehicle_id,
            slot_id,
            event_type,
            detected_plate,
            confidence,
            detected_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW() + $6 * INTERVAL '1 second')
        RETURNING log_id, detected_at
        """,
        vehicle_id,
        slot_id,
        event_type,
        detected_plate,
        round(confidence, 2),
        offset_sec,
    )


async def create_log_entry_for_detection(
    connection: asyncpg.Connection,
    item: DetectResultItem,
    event_type: str,
    timestamp_sec: float | None = None,
) -> dict:
    province_id = item.province.provinceId if item.province else None
    province_index = item.province.index if item.province else None

    plate_match = await match_vehicle_from_ocr(
        connection,
        item.ocr.texts,
        province_id=province_id,
        province_index=province_index,
    )

    plate_detection_confidence: float | None = None
    if item.plate and "confidence" in item.plate:
        plate_detection_confidence = float(item.plate["confidence"])

    confidence = plate_confidence_from_ocr(
        item.ocr.confidences or None,
        plate_match["plateTextIndices"],
        plate_detection_confidence,
    )

    vehicle_id = plate_match["vehicleId"]
    slot_id: int | None = None
    if vehicle_id is not None:
        slot_id = await get_slot_id_for_vehicle(connection, vehicle_id)

    status = classify_tenant_status(vehicle_id, slot_id)

    row = await insert_parking_log(
        connection,
        vehicle_id=vehicle_id,
        slot_id=slot_id,
        event_type=event_type,
        detected_plate=plate_match["detectedPlate"],
        confidence=confidence,
        timestamp_sec=timestamp_sec,
    )

    return {
        "logId": int(row["log_id"]),
        "status": status,
        "detectedPlate": plate_match["detectedPlate"],
        "matchScore": plate_match["matchScore"],
        "detectedAt": row["detected_at"],
    }


async def list_logs(
    connection: asyncpg.Connection,
    *,
    keyword: str | None,
    event_type: Literal["IN", "OUT", "in", "out"] | None,
    page: int,
    limit: int,
) -> tuple[int, list[asyncpg.Record]]:
    conditions: list[str] = []
    params: list = []

    if keyword is not None:
        keyword = keyword.strip()
        if keyword:
            params.append(f"%{keyword}%")
            placeholder = f"${len(params)}"
            conditions.append(
                f"(parking_logs.detected_plate ILIKE {placeholder} "
                f"OR tenants.full_name ILIKE {placeholder} "
                f"OR parking_slots.slot_code ILIKE {placeholder})"
            )

    if event_type is not None:
        params.append(event_type.upper())
        conditions.append(f"parking_logs.event_type = ${len(params)}")

    where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""

    from_clause = """
        FROM parking_logs
            LEFT JOIN vehicles ON vehicles.vehicle_id = parking_logs.vehicle_id
            LEFT JOIN tenants ON tenants.tenant_id = vehicles.tenant_id
            LEFT JOIN parking_slots ON parking_slots.slot_id = parking_logs.slot_id
    """

    count_query = f"""
        SELECT COUNT(*)::int
        {from_clause}
        {where_clause}
    """

    filter_params = list(params)
    params.append(limit)
    limit_placeholder = f"${len(params)}"
    params.append((page - 1) * limit)
    offset_placeholder = f"${len(params)}"

    query = f"""
        SELECT
            parking_logs.log_id,
            parking_logs.detected_plate,
            parking_logs.event_type,
            tenants.full_name,
            parking_logs.slot_id,
            parking_slots.slot_code,
            parking_logs.confidence,
            parking_logs.detected_at
        {from_clause}
        {where_clause}
        ORDER BY parking_logs.detected_at DESC
        LIMIT {limit_placeholder} OFFSET {offset_placeholder}
    """

    total_logs = await connection.fetchval(count_query, *filter_params)
    result = await connection.fetch(query, *params)
    return int(total_logs or 0), result
