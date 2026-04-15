from __future__ import annotations

from typing import Any, TypedDict

import easyocr
import numpy as np

from .preprocessing import preprocess_for_ocr

# Thai license plate character set (digits, space, Thai consonants).
TH_PLATE_CHARS = "0123456789 กขคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ"

_reader: easyocr.Reader | None = None


class PlateOcrResult(TypedDict):
    """EasyOCR output: parallel lists of detected strings and scores."""

    texts: list[str]
    confidences: list[float]


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["th"])
    return _reader


def detect_text(
    image: np.ndarray,
    *,
    preprocess: bool = True,
    preprocess_kwargs: dict[str, Any] | None = None,
    allowlist: str | None = TH_PLATE_CHARS,
    **readtext_kwargs: Any,
) -> PlateOcrResult:
    """Run OCR on a plate crop.

    When ``preprocess`` is True (default), runs ``preprocess_for_ocr`` and feeds
    the ``processed`` stage to EasyOCR.
    Set ``preprocess=False`` if the image is already prepared for OCR.
    """
    if image is None or image.size == 0:
        raise ValueError("Input image is empty or invalid.")

    if preprocess:
        stages = preprocess_for_ocr(image, **(preprocess_kwargs or {}))
        ocr_input = stages["processed"]
    else:
        ocr_input = image

    reader = _get_reader()
    call_kwargs: dict[str, Any] = dict(readtext_kwargs)
    if allowlist is not None and "allowlist" not in call_kwargs:
        call_kwargs["allowlist"] = allowlist

    raw = reader.readtext(ocr_input, **call_kwargs)

    texts: list[str] = []
    confidences: list[float] = []
    for _bbox, text, prob in raw:
        texts.append(str(text))
        confidences.append(float(prob))

    return {"texts": texts, "confidences": confidences}
