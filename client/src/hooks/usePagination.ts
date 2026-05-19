import { useCallback, useState } from "react";

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

function usePagination({ initialPage = 1, initialLimit = 10 }: Params) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const updateFromResponse = useCallback((meta: PaginationMeta) => {
    setTotalCount(meta.totalCount);
    setTotalPages(meta.totalPages);
    setPage(meta.currentPage);
    setLimit(meta.limit);
  }, []);

  const goToPage = useCallback(
    (nextPage: number) => {
      const clampedPage =
        totalPages > 0
          ? Math.min(Math.max(1, nextPage), totalPages)
          : Math.max(1, nextPage);

      setPage(clampedPage);
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    goToPage(page + 1);
  }, [goToPage, page]);

  const goToPrevPage = useCallback(() => {
    goToPage(page - 1);
  }, [goToPage, page]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const changeLimit = useCallback((nextLimit: number) => {
    setLimit(Math.max(1, nextLimit));
    setPage(1);
  }, []);

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
    updateFromResponse,
  };
}

export default usePagination;
