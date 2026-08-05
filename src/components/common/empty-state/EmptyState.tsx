import type { FC, ReactNode } from "react";

export interface EmptyStateProps {
  /** Custom icon element */
  icon?: ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Button label */
  buttonText?: string;
  /** Button click handler */
  buttonAction?: () => void;
  /** Image URL (replaces icon) */
  image?: string;
  /** Custom children rendered below description */
  children?: ReactNode;
}

const DefaultSearchIcon = () => (
  <svg
    className="w-16 h-16 text-gray-300 dark:text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Reusable EmptyState component.
 * Matches TailAdmin design system.
 * Supports icon, image, title, description, action button, and custom children.
 */
export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title = "No data found",
  description = "There are no records to display at the moment.",
  buttonText,
  buttonAction,
  image,
  children,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-24 h-24 mb-4 object-contain"
        />
      ) : (
        <div className="mb-4 text-gray-300 dark:text-gray-600">
          {icon || <DefaultSearchIcon />}
        </div>
      )}

      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>

      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {description}
      </p>

      {children}

      {buttonText && buttonAction && (
        <button
          type="button"
          onClick={buttonAction}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;