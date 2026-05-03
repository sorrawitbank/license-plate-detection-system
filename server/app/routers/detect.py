from __future__ import annotations

from typing import Any

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.utils.carmel_key import camelize_keys
from app.utils.provinces import match_province_from_ocr_texts
from lpr.ocr.detection import detect_text
from lpr.yolo.car.detection import detect_cars
from lpr.yolo.license_plate.detection import detect_license_plates


router = APIRouter(prefix="/detect", tags=["detect"])


def _crop_by_bbox(image: np.ndarray, bbox: dict[str, Any]) -> np.ndarray | None:
    x1 = max(int(float(bbox["x1"])), 0)
    y1 = max(int(float(bbox["y1"])), 0)
    x2 = min(int(float(bbox["x2"])), image.shape[1])
    y2 = min(int(float(bbox["y2"])), image.shape[0])

    if x2 <= x1 or y2 <= y1:
        return None
    return image[y1:y2, x1:x2]


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

    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if frame is None or frame.size == 0:
        raise HTTPException(status_code=400, detail="Input image is invalid.")

    regions: list[dict[str, Any]]
    if detectCar:
        car_detections = detect_cars(frame)
        if not car_detections:
            raise HTTPException(
                status_code=404, detail="Car detection could not find any car."
            )

        regions = []
        for index, car_detection in enumerate(car_detections):
            car_crop = _crop_by_bbox(frame, car_detection["bbox"])
            if car_crop is None or car_crop.size == 0:
                continue
            regions.append(
                {
                    "carIndex": index,
                    "car": car_detection,
                    "regionImage": car_crop,
                }
            )

        if not regions:
            raise HTTPException(
                status_code=404, detail="Car detection found no valid car regions."
            )
    else:
        regions = [
            {
                "carIndex": None,
                "car": None,
                "regionImage": frame,
            }
        ]

    results: list[dict[str, Any]] = []
    for region in regions:
        ocr_input = region["regionImage"]
        plate_info: dict[str, Any] | None = None

        if detectPlate:
            plate_detections = detect_license_plates(ocr_input)
            if not plate_detections:
                continue

            best_plate = max(plate_detections, key=lambda item: item["confidence"])
            plate_crop = _crop_by_bbox(ocr_input, best_plate["bbox"])
            if plate_crop is None or plate_crop.size == 0:
                continue

            plate_info = best_plate
            ocr_input = plate_crop

        ocr_result = detect_text(ocr_input, preprocess=preprocessOcr)
        if not ocr_result["texts"]:
            continue

        results.append(
            {
                "carIndex": region["carIndex"],
                "car": camelize_keys(region["car"]),
                "plate": camelize_keys(plate_info),
                "ocr": ocr_result,
                "province": match_province_from_ocr_texts(ocr_result["texts"]),
            }
        )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No valid detections were found for OCR.",
        )

    return {"count": len(results), "results": results}
