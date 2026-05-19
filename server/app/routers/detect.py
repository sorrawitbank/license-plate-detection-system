from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from lpr.features.image.detection import detect_image
from lpr.features.video.detection import detect_video_cross_events


router = APIRouter(prefix="/detect", tags=["detect"])


@router.post("/image")
async def detect_from_image(
    image: UploadFile = File(...),
    detectCar: bool = Form(True),
    detectPlate: bool = Form(True),
    preprocessOcr: bool = Form(True),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Input image is empty.")

    try:
        result = detect_image(
            image_bytes=image_bytes,
            detect_car=detectCar,
            detect_plate=detectPlate,
            preprocess_ocr=preprocessOcr,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return JSONResponse(status_code=200, content=jsonable_encoder(result))


@router.post("/video")
async def detect_from_video(
    video: UploadFile = File(...),
    lineOrientation: str = Form("horizontal"),
    point: float | None = Form(None),
    detectCar: bool = Form(True),
    preprocessOcr: bool = Form(True),
):
    orientation = lineOrientation.strip().lower()
    if orientation not in {"horizontal", "vertical"}:
        raise HTTPException(
            status_code=400,
            detail="lineOrientation must be either 'horizontal' or 'vertical'.",
        )

    if point is not None and not (0.0 <= point <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="point must be in the range [0, 1].",
        )

    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Input video is empty.")

    try:
        result = detect_video_cross_events(
            video_bytes=video_bytes,
            line_orientation=orientation,
            point=point,
            detect_car=detectCar,
            preprocess_ocr=preprocessOcr,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if result["count"] == 0:
        raise HTTPException(
            status_code=404,
            detail="No valid detections crossed the configured line for OCR.",
        )

    return JSONResponse(status_code=200, content=jsonable_encoder(result))
