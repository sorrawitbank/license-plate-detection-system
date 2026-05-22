from __future__ import annotations

from typing import Any

import numpy as np


def crop_by_bbox(image: np.ndarray, bbox: dict[str, Any]) -> np.ndarray | None:
    x1 = max(int(float(bbox["x1"])), 0)
    y1 = max(int(float(bbox["y1"])), 0)
    x2 = min(int(float(bbox["x2"])), image.shape[1])
    y2 = min(int(float(bbox["y2"])), image.shape[0])

    if x2 <= x1 or y2 <= y1:
        return None
    return image[y1:y2, x1:x2]
