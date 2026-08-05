export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  currentData: T[];
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterCondition {
  [key: string]: string | string[] | ((value: unknown) => boolean);
}

export interface TableLoaderProps {
  rows?: number;
  columns?: number;
  avatar?: boolean;
  actions?: boolean;
}