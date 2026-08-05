import type { SortConfig } from "../types/table.types";
import { getNestedValue } from "./searchData";

type SortableType = string | number | Date;

/**
 * Sort an array of objects by a field with direction.
 * Supports nested fields via dot notation.
 * Auto-detects type: string, number, date.
 * Immutable — returns a new array.
 */
export function sortData<T extends Record<string, unknown>>(
  data: T[],
  config: SortConfig,
): T[] {
  const { field, direction } = config;

  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, field) as SortableType | null | undefined;
    const bVal = getNestedValue(b, field) as SortableType | null | undefined;

    const comparison = compareValues(aVal, bVal);
    return direction === "asc" ? comparison : -comparison;
  });
}

function compareValues(
  a: SortableType | null | undefined,
  b: SortableType | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

export default sortData;