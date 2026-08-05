import type { FC } from "react";
import { Spinner } from "../spinner/Spinner";

export interface LoaderProps {
  /** Fullscreen mode — covers the entire viewport */
  fullscreen?: boolean;
  /** Overlay mode — covers the parent with a semi-transparent backdrop */
  overlay?: boolean;
  /** Loading text displayed below the spinner */
  text?: string;
  /** Spinner size (default: "md") */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Spinner color (Tailwind border class) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable Loader component.
 * Supports fullscreen, overlay, and inline modes.
 * Integrates with the Spinner component.
 */
export const Loader: FC<LoaderProps> = ({
  fullscreen = false,
  overlay = false,
  text,
  size = "md",
  color,
  className = "",
}) => {
  // Inline loader
  if (!fullscreen && !overlay) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 ${className}`}
        role="status"
        aria-label="loading"
      >
        <Spinner size={size} color={color} />
        {text && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Overlay loader
  if (overlay) {
    return (
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm ${className}`}
        role="status"
        aria-label="loading"
      >
        <Spinner size={size} color={color} />
        {text && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Fullscreen loader
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900 ${className}`}
      role="status"
      aria-label="loading"
    >
      <Spinner size={size} color={color} />
      {text && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;