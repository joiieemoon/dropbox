import { getNestedValue } from "./searchData";

/**
 * Filter an array of objects by conditions.
 * Supports single value, array of values, and custom predicate functions.
 * Immutable — returns a new array.
 */
export function filterData<T extends Record<string, unknown>>(
  data: T[],
  conditions: Record<string, string | string[] | ((value: unknown) => boolean)>,
): T[] {
  return data.filter((item) =>
    Object.entries(conditions).every(([key, condition]) => {
      const value = getNestedValue(item, key);

      if (typeof condition === "function") {
        return condition(value);
      }

      if (Array.isArray(condition)) {
        return condition.includes(String(value));
      }

      return String(value).toLowerCase() === condition.toLowerCase();
    }),
  );
}

export default filterData;