from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.utils import db


router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
async def get_logs(
    keyword: str | None = Query(default=None),
    event_type: Literal["IN", "OUT", "in", "out"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1),
):
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

    try:
        async with db.pool.acquire() as connection:
            total_logs = await connection.fetchval(count_query, *filter_params)
            result = await connection.fetch(query, *params)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Server could not read logs because of database connection",
        )

    logs = [
        {
            "logId": row["log_id"],
            "detectedPlate": row["detected_plate"],
            "eventType": row["event_type"],
            "fullName": row["full_name"],
            "slotId": row["slot_id"],
            "slotCode": row["slot_code"],
            "confidence": row["confidence"],
            "detectedAt": row["detected_at"],
        }
        for row in result
    ]

    total_pages = (total_logs + limit - 1) // limit if total_logs else 0

    return JSONResponse(
        status_code=200,
        content=jsonable_encoder(
            {
                "totalLogs": total_logs,
                "totalPages": total_pages,
                "currentPage": page,
                "limit": limit,
                "logs": logs,
            }
        ),
    )
