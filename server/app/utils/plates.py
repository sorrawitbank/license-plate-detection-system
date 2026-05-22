from __future__ import annotations

import re

from app.services.province import _plate_like


_THAI_PLATE_RE = re.compile(r"(\d+[ก-ฮ]+)(\d+)")
_PHONE_RE = re.compile(r"^\d{2,}-\d+")
_THAI_LETTER_RE = re.compile(r"[ก-ฮ]")


def normalize_plate_text(text: str) -> str:
    """Strip separators so OCR and DB plates compare consistently."""
    return re.sub(r"[\s\-\.]", "", text.strip())


def _looks_like_phone(text: str) -> bool:
    return bool(_PHONE_RE.match(text.strip()))


def _is_plate_fragment(text: str) -> bool:
    """Keep OCR fragments that may be part of a license plate."""
    stripped = text.strip()
    if len(stripped) < 1 or _looks_like_phone(stripped):
        return False
    if _plate_like(stripped):
        return True
    has_digit = any(ch.isdigit() for ch in stripped)
    has_thai = bool(_THAI_LETTER_RE.search(stripped))
    if has_digit and has_thai:
        return True
    if has_digit and len(stripped) <= 8:
        return True
    return False


def build_ocr_plate_candidates(
    ocr_texts: list[str],
    province_index: int | None = None,
) -> tuple[list[str], list[int]]:
    """Build plate strings to fuzzy-match and indices used from OCR."""
    exclude: set[int] = set()
    if province_index is not None:
        exclude.add(province_index)

    fragments: list[tuple[int, str]] = []
    for index, raw in enumerate(ocr_texts):
        if index in exclude:
            continue
        text = raw.strip()
        if not _is_plate_fragment(text):
            continue
        normalized = normalize_plate_text(text)
        if normalized:
            fragments.append((index, normalized))

    used_indices = [index for index, _ in fragments]
    candidates: set[str] = set()

    for _, fragment in fragments:
        candidates.add(fragment)

    if fragments:
        combined = "".join(fragment for _, fragment in fragments)
        if combined:
            candidates.add(combined)
            match = _THAI_PLATE_RE.fullmatch(combined)
            if match:
                candidates.add(match.group(1) + match.group(2))

    for _, fragment in fragments:
        match = _THAI_PLATE_RE.fullmatch(fragment)
        if match:
            candidates.add(match.group(1) + match.group(2))

    return list(candidates), used_indices


def plate_confidence_from_ocr(
    ocr_confidences: list[float] | None,
    plate_indices: list[int],
    plate_detection_confidence: float | None,
) -> float:
    """Use the highest OCR confidence among plate fragments, with YOLO fallback."""
    if ocr_confidences and plate_indices:
        values = [
            ocr_confidences[i] for i in plate_indices if 0 <= i < len(ocr_confidences)
        ]
        if values:
            return float(max(values))
    if plate_detection_confidence is not None:
        return float(plate_detection_confidence)
    return 0.0
