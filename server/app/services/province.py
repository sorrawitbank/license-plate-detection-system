from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import TypedDict

import pandas as pd
from rapidfuzz import fuzz, process


class ProvinceMatch(TypedDict):
    index: int
    provinceId: int
    name: str


_PROVINCES_CSV = Path(__file__).resolve().parents[2] / "docs" / "provinces.csv"
# OCR garbling still often shares enough characters with the true province name.
_MIN_WRATIO_SCORE = 50.0


@lru_cache(maxsize=1)
def _provinces_frame() -> pd.DataFrame:
    df = pd.read_csv(_PROVINCES_CSV, dtype={"province_id": int, "name": str})
    return df


def _plate_like(text: str) -> bool:
    """Skip strings that look like a plate number rather than a province label."""
    stripped = text.strip()
    if len(stripped) < 2:
        return True
    digit_count = sum(ch.isdigit() for ch in stripped)
    if digit_count >= 2 and len(stripped) <= 14:
        return True
    return False


def match_province_from_ocr_texts(ocr_texts: list[str]) -> ProvinceMatch | None:
    """Fuzzy-match the best province name against rows in ``provinces.csv``."""
    df = _provinces_frame()
    names: list[str] = df["name"].astype(str).tolist()
    ids: list[int] = df["province_id"].tolist()

    best_id: int | None = None
    best_text_index: int | None = None
    best_name = ""
    best_score = 0.0

    for text_index, raw in enumerate(ocr_texts):
        text = raw.strip()
        if _plate_like(text):
            continue
        hit = process.extractOne(text, names, scorer=fuzz.WRatio)
        if hit is None:
            continue
        matched_name, score, idx = hit
        score_f = float(score)
        if score_f > best_score:
            best_score = score_f
            best_text_index = int(text_index)
            best_id = int(ids[idx])
            best_name = str(matched_name)

    if best_score < _MIN_WRATIO_SCORE or best_id is None or best_text_index is None:
        return None

    return {"index": best_text_index, "provinceId": best_id, "name": best_name}
