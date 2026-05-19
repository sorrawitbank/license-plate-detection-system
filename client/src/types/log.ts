export type LogEventType = "IN" | "OUT";

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
