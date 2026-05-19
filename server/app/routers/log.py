from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.schemas.log import CreateLogsFromImageRequest, CreateLogsFromVideoRequest
from app.services import log as log_service
from app.utils import db


router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
async def get_logs(
    keyword: str | None = Query(default=None),
    event_type: Literal["IN", "OUT", "in", "out"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1),
):
    try:
        async with db.pool.acquire() as connection:
            total_logs, rows = await log_service.list_logs(
                connection,
                keyword=keyword,
                event_type=event_type,
                page=page,
                limit=limit,
            )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Server could not read logs because of database connection",
        )

    total_pages = (total_logs + limit - 1) // limit if total_logs else 0

    return JSONResponse(
        status_code=200,
        content=jsonable_encoder(
            {
                "totalLogs": total_logs,
                "totalPages": total_pages,
                "currentPage": page,
                "limit": limit,
                "logs": [
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
                    for row in rows
                ],
            }
        ),
    )


@router.post("/image")
async def create_log_from_image_result(body: CreateLogsFromImageRequest):
    event_type = body.eventType.upper()
    entries: list[dict] = []

    try:
        async with db.pool.acquire() as connection:
            for item in body.results:
                entry = await log_service.create_log_entry_for_detection(
                    connection, item, event_type
                )
                entries.append(entry)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Server could not create logs because of database connection",
        ) from exc

    return JSONResponse(
        status_code=201,
        content=jsonable_encoder({"count": len(entries), "entries": entries}),
    )


@router.post("/video")
async def create_log_from_video_result(body: CreateLogsFromVideoRequest):
    entries: list[dict] = []

    try:
        async with db.pool.acquire() as connection:
            for item in body.results:
                event_type = item.eventType.upper()
                entry = await log_service.create_log_entry_for_detection(
                    connection,
                    item,
                    event_type,
                    timestamp_sec=item.timestampSec,
                )
                entry.update(
                    {
                        "trackId": item.trackId,
                        "frameIndex": item.frameIndex,
                        "timestampSec": item.timestampSec,
                        "eventType": event_type,
                    }
                )
                entries.append(entry)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Server could not create logs because of database connection",
        ) from exc

    return JSONResponse(
        status_code=201,
        content=jsonable_encoder({"count": len(entries), "entries": entries}),
    )
