import { useState, useMemo, useCallback } from "react";
import { paginateData } from "../utils/paginateData";
import type { PaginationResult } from "../types/table.types";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn<T> extends PaginationResult<T> {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  next: () => void;
  previous: () => void;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
  reset: () => void;
}

/**
 * Reusable pagination hook.
 * Generic — works with any array.
 * Manages page, pageSize, and returns paginated data slice.
 */
export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {},
): UsePaginationReturn<T> {
  const { initialPage = 1, initialPageSize = 10 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationResult = useMemo(
    () => paginateData(data, { page, pageSize }),
    [data, page, pageSize],
  );

  const next = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const previous = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    setPage(Math.max(1, targetPage));
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    setPage,
    next,
    previous,
    goToPage,
    changePageSize,
    reset,
    ...paginationResult,
  };
}

export default usePagination;