import type { FC } from "react";

export interface TableLoaderProps {
  /** Number of skeleton rows (default: 5) */
  rows?: number;
  /** Number of skeleton columns (default: 5) */
  columns?: number;
  /** Show avatar skeleton in first column */
  avatar?: boolean;
  /** Show actions skeleton in last column */
  actions?: boolean;
}

/**
 * Reusable table skeleton loader.
 * Visually matches the existing table layout with pulse animation.
 */
export const TableLoader: FC<TableLoaderProps> = ({
  rows = 5,
  columns = 5,
  avatar = false,
  actions = false,
}) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center border-b border-gray-100 dark:border-white/[0.05] px-5 py-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => {
            const isFirst = colIndex === 0;
            const isLast = colIndex === columns - 1;

            return (
              <div
                key={colIndex}
                className={`flex-1 px-2 ${
                  isFirst ? "flex items-center gap-3" : ""
                } ${isLast && actions ? "flex justify-end" : ""}`}
              >
                {isFirst && avatar ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-2">
                      <div className="h-3 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
                      <div className="h-2.5 w-20 rounded-md bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ) : isLast && actions ? (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                ) : (
                  <div className="h-3 w-full max-w-[120px] rounded-md bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TableLoader;