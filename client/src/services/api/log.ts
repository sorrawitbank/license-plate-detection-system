import client from "../client";
import type { GetLogsQuery, GetLogsResponse } from "../../types/log";

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
