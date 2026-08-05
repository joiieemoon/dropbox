/**
 * Search an array of objects by keyword across specified keys.
 * Supports nested keys via dot notation (e.g. "user.name").
 * Case-insensitive, trims input, partial match.
 */
export function searchData<T extends Record<string, unknown>>(
  data: T[],
  keyword: string,
  keys: string[],
): T[] {
  const trimmed = keyword.trim();
  if (!trimmed) return data;

  const lowerKeyword = trimmed.toLowerCase();

  return data.filter((item) =>
    keys.some((key) => {
      const value = getNestedValue(item, key);
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerKeyword);
    }),
  );
}

/**
 * Get a nested value from an object using dot notation.
 * e.g. getNestedValue({ user: { name: "John" } }, "user.name") => "John"
 */
export function getNestedValue<T extends Record<string, unknown>>(
  obj: T,
  path: string,
): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, obj as unknown);
}

export default searchData;