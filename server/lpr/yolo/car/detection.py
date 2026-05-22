from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from ultralytics import YOLO


CAR_CLASS_ID = 2  # COCO class id for "car"
MODEL_PATH = Path(__file__).resolve().parent / "model" / "baseline_model.pt"

_model: YOLO | None = None


def _get_model() -> YOLO:
    """Load YOLO model once and reuse it."""
    global _model
    if _model is None:
        _model = YOLO(str(MODEL_PATH))
    return _model


def detect_cars(
    image: np.ndarray,
    *,
    conf: float = 0.25,
    iou: float = 0.45,
) -> list[dict[str, Any]]:
    """Detect only cars from an image.

    Args:
        image: Input image in numpy format (BGR/RGB).
        conf: Confidence threshold.
        iou: IoU threshold for NMS.

    Returns:
        List of car detections with bbox, confidence, and class metadata.
    """
    if image is None or image.size == 0:
        raise ValueError("Input image is empty or invalid.")

    model = _get_model()

    # classes=[2] forces YOLO to keep only the "car" class.
    results = model.predict(
        source=image,
        conf=conf,
        iou=iou,
        classes=[CAR_CLASS_ID],
        verbose=False,
    )

    detections: list[dict[str, Any]] = []
    if not results:
        return detections

    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        score = float(box.conf[0].item())
        cls_id = int(box.cls[0].item())

        detections.append(
            {
                "class_id": cls_id,
                "class_name": "car",
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
