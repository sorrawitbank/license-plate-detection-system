import { AxiosError } from "axios";
import debounceFunction from "debounce-fn";
import { useEffect, useMemo, useState } from "react";
import { getLogs } from "../services/api/log";
import type { LogEventType, ParkingLog } from "../types/log";
import usePagination from "./usePagination";

interface Params {
  initialPage?: number;
  initialLimit?: number;
  initialKeyword?: string;
}

function useGetLogs({
  initialPage = 1,
  initialLimit = 10,
  initialKeyword = "",
}: Params) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [eventType, setEventType] = useState<LogEventType | undefined>();
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
    initialPage,
    initialLimit,
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

  const debouncedSetKeyword = useMemo(() => {
    return debounceFunction(setKeyword, { wait: 600 });
  }, []);

  const handleKeywordChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    debouncedSetKeyword(event.target.value.trim());
    resetPage();
  };

  const handleEventTypeChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const value = event.target.value;
    setEventType(value === "ALL" ? undefined : (value as LogEventType));
    resetPage();
  };

  return {
    logs,
    eventType,
    page,
    limit,
    totalLogs: totalCount,
    totalPages,
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
