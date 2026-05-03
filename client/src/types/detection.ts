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

export interface DetectionResultItem {
  carIndex: number | null;
  car: DetectionObject | null;
  plate: DetectionObject | null;
  ocr: OcrResult;
  province: ProvinceResult | null;
}

export interface DetectImageResponse {
  count: number;
  results: DetectionResultItem[];
}

export interface DetectImagePayload {
  image: File;
  detectCar?: boolean;
  detectPlate?: boolean;
  preprocessOcr?: boolean;
}
