import client from "../client";
import type {
  CreateLogFromImagePayload,
  CreateLogFromImageResponse,
  CreateLogFromVideoPayload,
  CreateLogFromVideoResponse,
  GetLogsQuery,
  GetLogsResponse,
} from "../../types/log";

const LOG_ROUTE_PREFIX = "/logs";

export async function getLogs({
  keyword,
  eventType,
  page = 1,
  limit = 10,
  controller,
}: GetLogsQuery & { controller?: AbortController }): Promise<GetLogsResponse> {
  const { data } = await client.get<GetLogsResponse>(LOG_ROUTE_PREFIX, {
    params: {
      keyword,
      event_type: eventType,
      page,
      limit,
    },
    signal: controller?.signal,
  });
  return data;
}

export async function createLogFromImage(
  payload: CreateLogFromImagePayload
): Promise<CreateLogFromImageResponse> {
  const { data } = await client.post<CreateLogFromImageResponse>(
    `${LOG_ROUTE_PREFIX}/image`,
    payload
  );
  return data;
}

export async function createLogFromVideo(
  payload: CreateLogFromVideoPayload
): Promise<CreateLogFromVideoResponse> {
  const { data } = await client.post<CreateLogFromVideoResponse>(
    `${LOG_ROUTE_PREFIX}/video`,
    payload
  );
  return data;
}
