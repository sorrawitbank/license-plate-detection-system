import type { DetectionObject, OcrResult } from "./detection";

export type LogEventType = "IN" | "OUT";

export type TenantStatus = "External" | "Former Tenant" | "Tenant";

export interface ParkingLog {
  logId: number;
  detectedPlate: string;
  eventType: LogEventType;
  fullName: string | null;
  slotId: number | null;
  slotCode: string | null;
  confidence: number;
  detectedAt: string;
}

export interface GetLogsQuery {
  keyword?: string;
  eventType?: LogEventType;
  page?: number;
  limit?: number;
}

export interface GetLogsResponse {
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  logs: ParkingLog[];
}

export interface CreateLogProvince {
  index: number;
  provinceId: number;
}

export interface CreateLogDetectResultItem {
  ocr: OcrResult;
  province?: CreateLogProvince | null;
  plate?: DetectionObject | null;
}

export interface CreateLogFromImagePayload {
  eventType: LogEventType;
  results: CreateLogDetectResultItem[];
}

export interface CreateLogVideoResultItem extends CreateLogDetectResultItem {
  trackId: number;
  frameIndex: number;
  timestampSec: number;
  eventType: LogEventType;
}

export interface CreateLogFromVideoPayload {
  results: CreateLogVideoResultItem[];
}

export interface CreateLogFromImageEntry {
  logId: number;
  status: TenantStatus;
  detectedPlate: string;
  matchScore: number | null;
  detectedAt: string;
}

export interface CreateLogFromVideoEntry extends CreateLogFromImageEntry {
  trackId: number;
  frameIndex: number;
  timestampSec: number;
  eventType: LogEventType;
}

export interface CreateLogFromImageResponse {
  count: number;
  entries: CreateLogFromImageEntry[];
}

export interface CreateLogFromVideoResponse {
  count: number;
  entries: CreateLogFromVideoEntry[];
}
