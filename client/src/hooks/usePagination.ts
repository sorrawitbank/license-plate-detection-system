import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Params {
  initialPage?: number;
  initialLimit?: number;
}

interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

function usePagination(params: Params) {
  const [_, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(params.initialPage ?? 1);
  const [limit, setLimit] = useState(params.initialLimit ?? 10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const updateFromResponse = useCallback((meta: PaginationMeta) => {
    setTotalCount(meta.totalCount);
    setTotalPages(meta.totalPages);
    setPage(meta.currentPage);
    setLimit(meta.limit);
  }, []);

  const resetPageState = useCallback(() => {
    setPage(1);
  }, []);

  const deletePageParam = useCallback((params: URLSearchParams) => {
    params.delete("page");
    return params;
  }, []);

  const goToPage = useCallback(
    (nextPage: number) => {
      const clampedPage =
        totalPages > 0
          ? Math.min(Math.max(1, nextPage), totalPages)
          : Math.max(1, nextPage);

      setPage(clampedPage);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (clampedPage > 1) {
            params.set("page", String(clampedPage));
          } else {
            params.delete("page");
          }
          return params;
        },
        { replace: true }
      );
    },
    [totalPages, setSearchParams]
  );

  const goToNextPage = useCallback(() => {
    goToPage(page + 1);
  }, [goToPage, page]);

  const goToPrevPage = useCallback(() => {
    goToPage(page - 1);
  }, [goToPage, page]);

  const resetPage = useCallback(() => {
    setPage(1);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("page");
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const changeLimit = useCallback(
    (nextLimit: number) => {
      setLimit(Math.max(1, nextLimit));
      setPage(1);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete("page");
          if (nextLimit === 10) {
            params.delete("limit");
          } else {
            params.set("limit", String(nextLimit));
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const canGoNext = totalPages > 0 && page < totalPages;
  const canGoPrev = page > 1;

  return {
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
    resetPageState,
    deletePageParam,
    updateFromResponse,
  };
}

export default usePagination;
