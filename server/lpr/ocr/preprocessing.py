from __future__ import annotations

from typing import Dict

import cv2
import numpy as np


def _order_points(points: np.ndarray) -> np.ndarray:
    """Return 4 points ordered as top-left, top-right, bottom-right, bottom-left."""
    if points.shape != (4, 2):
        raise ValueError("Expected points shape (4, 2).")

    rect = np.zeros((4, 2), dtype=np.float32)
    sums = points.sum(axis=1)
    diffs = np.diff(points, axis=1).reshape(-1)

    rect[0] = points[np.argmin(sums)]
    rect[2] = points[np.argmax(sums)]
    rect[1] = points[np.argmin(diffs)]
    rect[3] = points[np.argmax(diffs)]
    return rect


def _find_plate_quad(gray: np.ndarray) -> np.ndarray | None:
    """Try to find the best 4-point contour that represents a plate region."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    image_area = float(gray.shape[0] * gray.shape[1])
    min_area = image_area * 0.08

    best_quad: np.ndarray | None = None
    best_score = -1.0
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:40]:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue

        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue

        x, y, w, h = cv2.boundingRect(approx)
        if h == 0:
            continue
        aspect_ratio = w / float(h)
        if not (1.2 <= aspect_ratio <= 8.0):
            continue

        rectangularity = area / float(max(w * h, 1))
        score = area * rectangularity
        if score > best_score:
            best_score = score
            best_quad = approx.reshape(4, 2).astype(np.float32)

    if best_quad is not None:
        return best_quad

    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    binary = cv2.morphologyEx(
        binary, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    )
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    min_fallback_area = image_area * 0.12
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:15]:
        area = cv2.contourArea(contour)
        if area < min_fallback_area:
            continue

        rect = cv2.minAreaRect(contour)
        (w, h) = rect[1]
        if w <= 1 or h <= 1:
            continue

        aspect_ratio = max(w, h) / max(min(w, h), 1e-6)
        if not (1.2 <= aspect_ratio <= 8.0):
            continue

        box = cv2.boxPoints(rect).astype(np.float32)
        return box

    return None


def _apply_perspective_correction(image: np.ndarray) -> np.ndarray:
    """Warp image to a frontal view when a plate quadrilateral is detected."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    quad = _find_plate_quad(gray)
    if quad is None:
        return image

    rect = _order_points(quad)
    (tl, tr, br, bl) = rect

    width_top = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    max_width = max(int(round(max(width_top, width_bottom))), 1)

    height_left = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    max_height = max(int(round(max(height_left, height_right))), 1)

    if max_width < 8 or max_height < 8:
        return image

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(rect, destination)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def preprocess_for_ocr(
    image: np.ndarray,
    *,
    use_perspective_correction: bool = True,
    use_clahe: bool = True,
    blur_kernel_size: tuple[int, int] = (5, 5),
    morph_kernel_size: tuple[int, int] = (3, 3),
    morph_close_iterations: int = 1,
    morph_open_iterations: int = 1,
) -> Dict[str, np.ndarray]:
    """OCR-oriented preprocessing pipeline.

    Steps:
    1) Perspective correction (optional)
    2) Grayscale
    3) CLAHE (optional)
    4) Gaussian blur
    5) Otsu threshold (binary inverted)
    6) Morphological closing then opening
    """

    if image is None or image.size == 0:
        raise ValueError("Input image is empty or invalid.")

    corrected = (
        _apply_perspective_correction(image)
        if use_perspective_correction
        else image.copy()
    )

    if len(corrected.shape) == 2:
        gray = corrected.copy()
    else:
        gray = cv2.cvtColor(corrected, cv2.COLOR_BGR2GRAY)

    if use_clahe:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
    else:
        enhanced = gray

    blurred = cv2.GaussianBlur(enhanced, blur_kernel_size, 0)

    _, thresholded = cv2.threshold(
        blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, morph_kernel_size)
    closed = cv2.morphologyEx(
        thresholded,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=morph_close_iterations,
    )
    opened = cv2.morphologyEx(
        closed,
        cv2.MORPH_OPEN,
        kernel,
        iterations=morph_open_iterations,
    )

    return {
        "corrected": corrected,
        "gray": gray,
        "enhanced": enhanced,
        "blurred": blurred,
        "thresholded": thresholded,
        "closed": closed,
        "processed": opened,
    }
