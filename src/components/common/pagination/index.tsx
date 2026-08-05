import { useMemo } from "react";

// import { ChevronDownIcon } from "../../../icons";
import Select from "../../form/input/components/select/Select";

export interface Option {
  value: string;
  label: string;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems?: number;
  pageSizeOptions?: number[];

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pages = useMemo(() => {
    const result: (number | "...")[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    result.push(1);

    if (page > 3) {
      result.push("...");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (page < totalPages - 2) {
      result.push("...");
    }

    result.push(totalPages);

    return result;
  }, [page, totalPages]);

  const options: Option[] = useMemo(
    () =>
      pageSizeOptions.map((item) => ({
        value: String(item),
        label: String(item),
      })),
    [pageSizeOptions],
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;

    onPageChange(newPage);
  };

  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left */}

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Rows per page</span>

        <div className="w-20">
          <Select
            options={options}
            defaultValue={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
          />
        </div>

        {totalItems !== undefined && (
          <span className="text-sm text-gray-500">{totalItems} records</span>
        )}
      </div>

      {/* Center */}

      <p className="text-sm text-gray-500">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </p>

      {/* Right */}

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous Page"
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Prev
        </button>

        {pages.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-10 items-center justify-center text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              aria-current={item === page ? "page" : undefined}
              onClick={() => handlePageChange(item)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
                item === page
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next Page"
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
