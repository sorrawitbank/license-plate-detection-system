from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class OcrBlock(BaseModel):
    texts: list[str]
    confidences: list[float] = Field(default_factory=list)

    @model_validator(mode="after")
    def confidences_match_texts(self) -> OcrBlock:
        if self.confidences and len(self.confidences) != len(self.texts):
            raise ValueError("ocr.confidences length must match ocr.texts length")
        return self


class ProvinceBlock(BaseModel):
    index: int
    provinceId: int


class DetectResultItem(BaseModel):
    ocr: OcrBlock
    province: ProvinceBlock | None = None
    plate: dict[str, Any] | None = None


class CreateLogsFromImageRequest(BaseModel):
    eventType: Literal["IN", "OUT", "in", "out"]
    results: list[DetectResultItem]

    @model_validator(mode="after")
    def results_not_empty(self) -> CreateLogsFromImageRequest:
        if not self.results:
            raise ValueError("results must contain at least one detection")
        return self


class DetectVideoResultItem(DetectResultItem):
    trackId: int
    frameIndex: int
    timestampSec: float
    eventType: Literal["IN", "OUT", "in", "out"]


class CreateLogsFromVideoRequest(BaseModel):
    results: list[DetectVideoResultItem]

    @model_validator(mode="after")
    def results_not_empty(self) -> CreateLogsFromVideoRequest:
        if not self.results:
            raise ValueError("results must contain at least one detection")
        return self
