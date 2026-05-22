from __future__ import annotations

import cv2
import numpy as np


def _auto_orient(image: np.ndarray) -> np.ndarray:
    """Apply a simple orientation rule to keep frames landscape-first."""
    if image is None or image.size == 0:
        raise ValueError("Input image is empty or invalid.")

    # Keep orientation consistent for detection inputs.
    if image.ndim >= 2 and image.shape[0] > image.shape[1]:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    return image


def _contrast_stretch(image: np.ndarray) -> np.ndarray:
    """Stretch intensity to full 0-255 range."""
    if image.ndim == 2:
        min_val = int(np.min(image))
        max_val = int(np.max(image))
        if max_val == min_val:
            return image.copy()
        return cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)

    channels = cv2.split(image)
    stretched_channels = []
    for channel in channels:
        min_val = int(np.min(channel))
        max_val = int(np.max(channel))
        if max_val == min_val:
            stretched_channels.append(channel)
            continue
        stretched_channels.append(cv2.normalize(channel, None, 0, 255, cv2.NORM_MINMAX))

    return cv2.merge(stretched_channels)


def _letterbox_resize(
    image: np.ndarray,
    target_size: tuple[int, int] = (640, 640),
) -> np.ndarray:
    """Resize with black padding to fit target size."""
    target_w, target_h = target_size
    src_h, src_w = image.shape[:2]
    if src_h == 0 or src_w == 0:
        raise ValueError("Input image has invalid dimensions.")

    scale = min(target_w / src_w, target_h / src_h)
    new_w = max(1, int(round(src_w * scale)))
    new_h = max(1, int(round(src_h * scale)))

    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    y_offset = (target_h - new_h) // 2
    x_offset = (target_w - new_w) // 2
    canvas[y_offset : y_offset + new_h, x_offset : x_offset + new_w] = resized
    return canvas


def preprocess_for_license_plate_detection(
    image: np.ndarray,
    *,
    target_size: tuple[int, int] = (640, 640),
) -> np.ndarray:
    """Run preprocessing before license-plate detection.

    Steps:
    1) Auto-Orient
    2) Resize to fit with black edges in 640x640
    3) Auto-adjust contrast using contrast stretching
    """
    oriented = _auto_orient(image)
    resized = _letterbox_resize(oriented, target_size=target_size)
    enhanced = _contrast_stretch(resized)
    return enhanced


def map_bbox_from_canvas_to_original(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    *,
    orig_shape: tuple[int, int],
    target_size: tuple[int, int] = (640, 640),
) -> tuple[float, float, float, float]:
    """Map xyxy bbox from letterboxed canvas coords back to the original image.

    Must use the same ``orig_shape`` (H, W) as the image passed into
    ``preprocess_for_license_plate_detection`` (before auto-orient).
    """
    orig_h, orig_w = orig_shape
    if orig_h <= 0 or orig_w <= 0:
        raise ValueError("Invalid orig_shape.")

    rotated = orig_h > orig_w
    oriented_h = orig_w if rotated else orig_h
    oriented_w = orig_h if rotated else orig_w

    target_w, target_h = target_size
    scale = min(target_w / oriented_w, target_h / oriented_h)
    new_w = max(1, int(round(oriented_w * scale)))
    new_h = max(1, int(round(oriented_h * scale)))
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2

    def _inv_letterbox(
        ax1: float, ay1: float, ax2: float, ay2: float
    ) -> tuple[float, float, float, float]:
        return (
            (ax1 - x_offset) / scale,
            (ay1 - y_offset) / scale,
            (ax2 - x_offset) / scale,
            (ay2 - y_offset) / scale,
        )

    ox1, oy1, ox2, oy2 = _inv_letterbox(x1, y1, x2, y2)

    if not rotated:
        ox1, ox2 = sorted(
            (float(np.clip(ox1, 0, orig_w)), float(np.clip(ox2, 0, orig_w)))
        )
        oy1, oy2 = sorted(
            (float(np.clip(oy1, 0, orig_h)), float(np.clip(oy2, 0, orig_h)))
        )
        return ox1, oy1, ox2, oy2

    corners = ((ox1, oy1), (ox2, oy1), (ox2, oy2), (ox1, oy2))
    mapped_x: list[float] = []
    mapped_y: list[float] = []
    for x, y in corners:
        xo = y
        yo = orig_h - 1.0 - x
        mapped_x.append(xo)
        mapped_y.append(yo)

    bx1 = float(np.clip(min(mapped_x), 0, orig_w))
    bx2 = float(np.clip(max(mapped_x), 0, orig_w))
    by1 = float(np.clip(min(mapped_y), 0, orig_h))
    by2 = float(np.clip(max(mapped_y), 0, orig_h))
    return bx1, by1, bx2, by2
