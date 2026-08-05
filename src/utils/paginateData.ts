import type { PaginationConfig, PaginationResult } from "../types/table.types";

/**
 * Paginate an array of objects.
 * Immutable — returns a new array slice.
 */
export function paginateData<T>(
  data: T[],
  config: PaginationConfig,
): PaginationResult<T> {
  const { page, pageSize } = config;
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentData: data.slice(startIndex, endIndex),
    totalPages,
    totalItems,
    hasNext: safePage < totalPages,
    hasPrevious: safePage > 1,
  };
}

export default paginateData;