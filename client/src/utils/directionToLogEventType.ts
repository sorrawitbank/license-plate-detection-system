import type { LogEventType } from "../types/log";

function directionToLogEventType(
  direction: 1 | 2,
  primaryDirectionEventType: LogEventType
): LogEventType {
  if (direction === 1) {
    return primaryDirectionEventType;
  }

  return primaryDirectionEventType === "IN" ? "OUT" : "IN";
}

export default directionToLogEventType;
