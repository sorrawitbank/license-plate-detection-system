import { AxiosError } from "axios";
import debounceFunction from "debounce-fn";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLogs } from "../services/api/log";
import type { LogEventType, ParkingLog } from "../types/log";
import usePagination from "./usePagination";

function isLogEventType(value: string): value is LogEventType {
  return value === "IN" || value === "OUT";
}

function parseEventTypeFromSearchParam(
  param: string | null
): LogEventType | undefined {
  const value = param?.trim().toUpperCase();
  return value && isLogEventType(value) ? value : undefined;
}

function parseKeywordFromSearchParam(param: string | null): string {
  return param?.trim() ?? "";
}

function useGetLogs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = parseKeywordFromSearchParam(
    searchParams.get("keyword")
  );
  const initialEventType = parseEventTypeFromSearchParam(
    searchParams.get("event")
  );

  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [eventType, setEventType] = useState<LogEventType | undefined>(
    initialEventType
  );
  const [logs, setLogs] = useState<ParkingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const {
    page,
    limit,
    totalPages,
    totalCount,
    canGoNext,
    canGoPrev,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeLimit,
    resetPage,
    updateFromResponse,
  } = usePagination({
    initialPage:
      Number.isInteger(Number(searchParams.get("page"))) &&
      Number(searchParams.get("page")) > 0
        ? Number(searchParams.get("page"))
        : undefined,
    initialLimit:
      Number.isInteger(Number(searchParams.get("limit"))) &&
      Number(searchParams.get("limit")) > 0
        ? Number(searchParams.get("limit"))
        : undefined,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchLogs(controller);

    return () => {
      controller.abort();
    };
  }, [keyword, eventType, page, limit, updateFromResponse]);

  const fetchLogs = async (controller?: AbortController) => {
    try {
      setIsLoading(true);
      setLogsError(null);

      const response = await getLogs({
        keyword: keyword.trim() || undefined,
        eventType,
        page,
        limit,
        controller,
      });

      setLogs(response.logs);
      updateFromResponse({
        totalCount: response.totalLogs,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        limit: response.limit,
      });
      setIsLoading(false);
    } catch (error) {
      const fallbackMessage =
        "Unable to load logs right now. Please try again.";

      // Get error message from response data if available
      if (error instanceof Error && error.message !== "canceled") {
        if (error instanceof AxiosError) {
          setLogsError(error.response?.data?.detail || fallbackMessage);
        } else {
          setLogsError(error.message || fallbackMessage);
        }
        setLogs([]);
        setIsLoading(false);
      }
    }
  };

  const debouncedApplyKeyword = useMemo(
    () =>
      debounceFunction(
        (value: string) => {
          setKeyword(value);
          setSearchParams(
            (prev) => {
              const params = new URLSearchParams(prev);
              const next = resetPage(params) ?? params;
              if (value) {
                next.set("keyword", value);
              } else {
                next.delete("keyword");
              }
              return next;
            },
            { replace: true }
          );
        },
        { wait: 600 }
      ),
    [resetPage, setSearchParams]
  );

  const handleKeywordChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedApplyKeyword(value.trim());
  };

  const handleEventTypeChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const value = event.target.value;
    setEventType(value === "ALL" ? undefined : (value as LogEventType));
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        const resetParams = resetPage(params);
        if (resetParams) {
          if (value === "IN") {
            resetParams.set("event", "IN");
          } else if (value === "OUT") {
            resetParams.set("event", "OUT");
          } else {
            resetParams.delete("event");
          }
          return resetParams;
        }
        return params;
      },
      { replace: true }
    );
  };

  return {
    logs,
    eventType,
    page,
    limit,
    totalLogs: totalCount,
    totalPages,
    searchInput,
    isLoading,
    logsError,
    handleKeywordChange,
    handleEventTypeChange,
    canGoNext,
    canGoPrev,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeLimit,
  };
}

export default useGetLogs;
