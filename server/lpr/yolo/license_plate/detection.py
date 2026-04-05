from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from ultralytics import YOLO

from .preprocessing import (
    map_bbox_from_canvas_to_original,
    preprocess_for_license_plate_detection,
)


LICENSE_PLATE_CLASS_ID = 0
MODEL_PATH = Path(__file__).resolve().parent / "model" / "license_plate.pt"

_model: YOLO | None = None


def _apply_bbox_padding(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    image_width: int,
    image_height: int,
    pad_x_ratio: float,
    pad_y_ratio: float,
) -> tuple[float, float, float, float]:
    """Expand bbox by axis-specific ratios and clamp to image bounds."""
    width = max(x2 - x1, 1.0)
    height = max(y2 - y1, 1.0)

    pad_x = width * max(pad_x_ratio, 0.0)
    pad_y = height * max(pad_y_ratio, 0.0)

    px1 = float(np.clip(x1 - pad_x, 0, image_width))
    py1 = float(np.clip(y1 - pad_y, 0, image_height))
    px2 = float(np.clip(x2 + pad_x, 0, image_width))
    py2 = float(np.clip(y2 + pad_y, 0, image_height))
    return px1, py1, px2, py2


def _get_model() -> YOLO:
    """Load the model once and reuse it."""
    global _model
    if _model is None:
        _model = YOLO(str(MODEL_PATH))
    return _model


def detect_license_plates(
    image: np.ndarray,
    *,
    conf: float = 0.25,
    iou: float = 0.45,
    pad_x_ratio: float = 0.06,
    pad_y_ratio: float = 0.12,
) -> list[dict[str, Any]]:
    """Detect license plates after preprocessing step."""
    if image is None or image.size == 0:
        raise ValueError("Input image is empty or invalid.")

    orig_h, orig_w = image.shape[:2]
    preprocessed = preprocess_for_license_plate_detection(image)
    model = _get_model()

    results = model.predict(
        source=preprocessed,
        conf=conf,
        iou=iou,
        classes=[LICENSE_PLATE_CLASS_ID],
        verbose=False,
    )

    detections: list[dict[str, Any]] = []
    if not results:
        return detections

    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        score = float(box.conf[0].item())
        cls_id = int(box.cls[0].item())

        x1, y1, x2, y2 = map_bbox_from_canvas_to_original(
            x1,
            y1,
            x2,
            y2,
            orig_shape=(orig_h, orig_w),
        )
        x1, y1, x2, y2 = _apply_bbox_padding(
            x1,
            y1,
            x2,
            y2,
            image_width=orig_w,
            image_height=orig_h,
            pad_x_ratio=pad_x_ratio,
            pad_y_ratio=pad_y_ratio,
        )

        detections.append(
            {
                "class_id": cls_id,
                "class_name": "license_plate",
                "confidence": score,
                "bbox": {
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                },
            }
        )

    return detections
