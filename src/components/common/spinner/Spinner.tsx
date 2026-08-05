import type { FC } from "react";

export interface SpinnerProps {
  /** Spinner size (default: "md") */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Custom color (Tailwind class) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

const sizeMap: Record<string, { width: string; height: string; border: string }> = {
  xs: { width: "w-3", height: "h-3", border: "border-2" },
  sm: { width: "w-4", height: "h-4", border: "border-2" },
  md: { width: "w-6", height: "h-6", border: "border-2" },
  lg: { width: "w-8", height: "h-8", border: "border-3" },
  xl: { width: "w-10", height: "h-10", border: "border-3" },
};

/**
 * Reusable Spinner component.
 * Supports sizes from xs to xl, custom colors, and dark mode.
 */
export const Spinner: FC<SpinnerProps> = ({
  size = "md",
  color = "border-t-blue-400",
  className = "",
}) => {
  const { width, height, border } = sizeMap[size];

  return (
    <div
      className={`${width} ${height} ${border} border-2 border-gray-100 dark:border-blue-700 ${color} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;