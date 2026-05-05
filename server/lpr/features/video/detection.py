from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any, Literal

import cv2
import numpy as np

from app.utils.carmel_key import camelize_keys
from app.utils.crop_by_bbox import crop_by_bbox
from app.utils.provinces import match_province_from_ocr_texts
from lpr.ocr.detection import detect_text
from lpr.yolo.car.detection import detect_cars
from lpr.yolo.license_plate.detection import detect_license_plates

LineOrientation = Literal["horizontal", "vertical"]


@dataclass
class ResolvedLine:
    orientation: LineOrientation
    normalized_value: float
    pixel_value: float


def _resolve_line_value(point: float | None) -> float:
    if point is None:
        return 0.5
    return point


def _resolve_line(
    *,
    frame_width: int,
    frame_height: int,
    orientation: LineOrientation,
    point: float | None,
) -> ResolvedLine:
    line_value = _resolve_line_value(point=point)
    axis_size = frame_width if orientation == "vertical" else frame_height
    return ResolvedLine(
        orientation=orientation,
        normalized_value=float(line_value),
        pixel_value=float(line_value * axis_size),
    )


def _axis_value(
    center: tuple[float, float],
    orientation: LineOrientation,
) -> float:
    return center[0] if orientation == "vertical" else center[1]


def _crossing_direction(
    *,
    previous_axis: float,
    current_axis: float,
    line_axis: float,
) -> int | None:
    crossed_forward = previous_axis < line_axis <= current_axis
    crossed_backward = previous_axis > line_axis >= current_axis
    if crossed_forward:
        return 1
    if crossed_backward:
        return 2
    return None


def _build_regions(frame: np.ndarray, detect_car: bool) -> list[dict[str, Any]]:
    if not detect_car:
        return [
            {
                "car_index": None,
                "car": None,
                "region_image": frame,
                "offset": (0.0, 0.0),
            }
        ]

    car_detections = detect_cars(frame)
    regions: list[dict[str, Any]] = []
    for index, car_detection in enumerate(car_detections):
        car_crop = crop_by_bbox(frame, car_detection["bbox"])
        if car_crop is None or car_crop.size == 0:
            continue
        regions.append(
            {
                "car_index": index,
                "car": car_detection,
                "region_image": car_crop,
                "offset": (
                    float(car_detection["bbox"]["x1"]),
                    float(car_detection["bbox"]["y1"]),
                ),
            }
        )
    return regions


def _build_candidates(
    *,
    frame: np.ndarray,
    detect_car: bool,
    detect_plate: bool,
) -> list[dict[str, Any]]:
    regions = _build_regions(frame, detect_car=detect_car)
    candidates: list[dict[str, Any]] = []

    for region in regions:
        ocr_input = region["region_image"]
        plate_info: dict[str, Any] | None = None
        center_local: tuple[float, float] = (
            ocr_input.shape[1] / 2.0,
            ocr_input.shape[0] / 2.0,
        )

        if detect_plate:
            plate_detections = detect_license_plates(ocr_input)
            if not plate_detections:
                continue

            best_plate = max(plate_detections, key=lambda item: item["confidence"])
            plate_crop = crop_by_bbox(ocr_input, best_plate["bbox"])
            if plate_crop is None or plate_crop.size == 0:
                continue

            plate_info = best_plate
            ocr_input = plate_crop
            center_local = (
                (float(best_plate["bbox"]["x1"]) + float(best_plate["bbox"]["x2"]))
                / 2.0,
                (float(best_plate["bbox"]["y1"]) + float(best_plate["bbox"]["y2"]))
                / 2.0,
            )

        offset_x, offset_y = region["offset"]
        center_global = (center_local[0] + offset_x, center_local[1] + offset_y)

        candidates.append(
            {
                "car_index": region["car_index"],
                "car": region["car"],
                "plate": plate_info,
                "ocr_input": ocr_input,
                "center": center_global,
            }
        )

    return candidates


def _euclidean_distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return float(np.hypot(a[0] - b[0], a[1] - b[1]))


def detect_video_cross_events(
    *,
    video_bytes: bytes,
    line_orientation: LineOrientation = "horizontal",
    point: float | None = None,
    detect_car: bool = True,
    detect_plate: bool = True,
    preprocess_ocr: bool = True,
) -> dict[str, Any]:
    if not video_bytes:
        raise ValueError("Input video is empty.")

    temp_path: Path | None = None
    capture: cv2.VideoCapture | None = None
    try:
        with NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            temp_file.write(video_bytes)
            temp_path = Path(temp_file.name)

        capture = cv2.VideoCapture(str(temp_path))
        if not capture.isOpened():
            raise ValueError("Input video is invalid.")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        if fps <= 0.0:
            fps = 30.0

        frame_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        frame_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if frame_width <= 0 or frame_height <= 0:
            raise ValueError("Input video is invalid.")

        line = _resolve_line(
            frame_width=frame_width,
            frame_height=frame_height,
            orientation=line_orientation,
            point=point,
        )

        tracks: dict[int, dict[str, Any]] = {}
        next_track_id = 1
        match_threshold = max(frame_width, frame_height) * 0.08
        results: list[dict[str, Any]] = []
        frame_index = 0

        while True:
            ok, frame = capture.read()
            if not ok:
                break

            candidates = _build_candidates(
                frame=frame,
                detect_car=detect_car,
                detect_plate=detect_plate,
            )
            if not candidates:
                frame_index += 1
                continue

            available_track_ids = set(tracks.keys())
            for candidate in candidates:
                center = candidate["center"]
                assigned_track_id: int | None = None
                best_distance = float("inf")
                for track_id in available_track_ids:
                    track = tracks[track_id]
                    distance = _euclidean_distance(center, track["center"])
                    if distance < best_distance and distance <= match_threshold:
                        best_distance = distance
                        assigned_track_id = track_id

                if assigned_track_id is None:
                    assigned_track_id = next_track_id
                    next_track_id += 1
                    tracks[assigned_track_id] = {
                        "center": center,
                        "axis": _axis_value(center, line.orientation),
                    }
                    continue

                available_track_ids.discard(assigned_track_id)
                track = tracks[assigned_track_id]
                previous_axis = float(track["axis"])
                current_axis = _axis_value(center, line.orientation)
                direction = _crossing_direction(
                    previous_axis=previous_axis,
                    current_axis=current_axis,
                    line_axis=line.pixel_value,
                )

                if direction is not None:
                    ocr_result = detect_text(
                        candidate["ocr_input"],
                        preprocess=preprocess_ocr,
                    )
                    if ocr_result["texts"]:
                        results.append(
                            {
                                "trackId": assigned_track_id,
                                "frameIndex": frame_index,
                                "timestampSec": frame_index / fps,
                                "direction": direction,
                                "carIndex": candidate["car_index"],
                                "car": camelize_keys(candidate["car"]),
                                "plate": camelize_keys(candidate["plate"]),
                                "ocr": ocr_result,
                                "province": match_province_from_ocr_texts(
                                    ocr_result["texts"]
                                ),
                            }
                        )

                track["center"] = center
                track["axis"] = current_axis

            frame_index += 1

        return {
            "line": {
                "orientation": line.orientation,
                "normalizedValue": line.normalized_value,
                "pixelValue": line.pixel_value,
            },
            "count": len(results),
            "results": results,
        }
    finally:
        if capture is not None:
            capture.release()
        if temp_path is not None and temp_path.exists():
            temp_path.unlink(missing_ok=True)
