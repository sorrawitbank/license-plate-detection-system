export interface OverlayBox {
  key: string;
  bbox: BoundingBox;
  rectClass: string;
  textClass: string;
  label: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionObject {
  classId: number;
  className: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OcrResult {
  texts: string[];
  confidences: number[];
}

export interface ProvinceResult {
  provinceId: number;
  name: string;
}

// Image
export interface DetectImagePayload {
  image: File;
  detectCar?: boolean;
  detectPlate?: boolean;
  preprocessOcr?: boolean;
}

export interface DetectionImageResultItem {
  carIndex: number | null;
  car: DetectionObject | null;
  plate: DetectionObject | null;
  ocr: OcrResult;
  province: ProvinceResult | null;
}

export interface DetectImageResponse {
  count: number;
  results: DetectionImageResultItem[];
}

// Video
export type LineOrientation = "horizontal" | "vertical";

export interface DetectVideoPayload {
  video: File;
  lineOrientation?: LineOrientation;
  point?: number;
  detectCar?: boolean;
  preprocessOcr?: boolean;
}

export interface LineOrientationResult {
  orientation: LineOrientation;
  normalizedValue: number;
  pixelValue: number;
}

export interface DetectionVideoResultItem {
  trackId: number;
  frameIndex: number;
  timestampSec: number;
  direction: 1 | 2;
  carIndex: number | null;
  car: DetectionObject | null;
  plate: DetectionObject;
  ocr: OcrResult;
  province: ProvinceResult | null;
}

export interface DetectVideoResponse {
  line: LineOrientationResult;
  count: number;
  results: DetectionVideoResultItem[];
}
