import { useState, useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { searchData } from "../utils/searchData";

interface UseSearchOptions<T extends Record<string, unknown>> {
  data: T[];
  searchKeys: string[];
  debounceDelay?: number;
}

interface UseSearchReturn<T> {
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  filteredData: T[];
}

/**
 * Reusable search hook.
 * Manages search keyword, debounces it, and returns filtered data.
 * Generic — works with any object array.
 */
export function useSearch<T extends Record<string, unknown>>(
  options: UseSearchOptions<T>,
): UseSearchReturn<T> {
  const { data, searchKeys, debounceDelay = 300 } = options;
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, debounceDelay);

  const filteredData = useMemo(
    () => searchData(data, debouncedSearch, searchKeys),
    [data, debouncedSearch, searchKeys],
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    filteredData,
  };
}

export default useSearch;