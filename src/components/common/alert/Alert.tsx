import type { FC, ReactNode, ReactElement } from "react";
import { useState } from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  /** Alert variant (default: "info") */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert description */
  description?: string;
  /** Custom icon (overrides variant default) */
  icon?: ReactNode;
  /** Show close button (default: false) */
  closable?: boolean;
  /** Action element (e.g. a button) rendered below the description */
  action?: ReactNode;
  /** Custom children rendered below description */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

interface VariantStyles {
  container: string;
  iconContainer: string;
  iconColor: string;
  titleColor: string;
  descriptionColor: string;
}

const variantStyles: Record<AlertVariant, VariantStyles> = {
  success: {
    container:
      "border-success-200 bg-success-50 dark:border-success-500/20 dark:bg-success-500/10",
    iconContainer: "text-success-500",
    iconColor: "text-success-500",
    titleColor: "text-success-700 dark:text-success-400",
    descriptionColor: "text-success-600 dark:text-success-300",
  },
  error: {
    container:
      "border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10",
    iconContainer: "text-error-500",
    iconColor: "text-error-500",
    titleColor: "text-error-700 dark:text-error-400",
    descriptionColor: "text-error-600 dark:text-error-300",
  },
  warning: {
    container:
      "border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10",
    iconContainer: "text-orange-500",
    iconColor: "text-orange-500",
    titleColor: "text-orange-700 dark:text-orange-400",
    descriptionColor: "text-orange-600 dark:text-orange-300",
  },
  info: {
    container:
      "border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10",
    iconContainer: "text-blue-500",
    iconColor: "text-blue-500",
    titleColor: "text-blue-700 dark:text-blue-400",
    descriptionColor: "text-blue-600 dark:text-blue-300",
  },
};

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M15 9L9 15M9 9L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.33998 18.8268 1.32896 19.8279 1.73218 20.6643C2.1354 21.5007 2.90973 22.0604 3.78 22.16L4 22H20C20.8703 21.9004 21.6446 21.3407 22.0478 20.5043C22.451 19.6679 22.44 18.6668 21.96 17.84L13.71 3.86C13.2687 3.06361 12.4355 2.58659 11.5 2.58659C10.5645 2.58659 9.73126 3.06361 9.29 3.86H10.29Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const variantIcons: Record<AlertVariant, (props: { className?: string }) => ReactElement> = {
  success: (props) => <CheckCircleIcon {...props} />,
  error: (props) => <XCircleIcon {...props} />,
  warning: (props) => <WarningTriangleIcon {...props} />,
  info: (props) => <InfoCircleIcon {...props} />,
};

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Reusable Alert component.
 * Supports success, error, warning, and info variants.
 * Matches TailAdmin design with dark mode support.
 */
export const Alert: FC<AlertProps> = ({
  variant = "info",
  title,
  description,
  icon,
  closable = false,
  action,
  children,
  className = "",
}) => {
  const [visible, setVisible] = useState(true);
  const styles = variantStyles[variant];
  const VariantIcon = variantIcons[variant];

  if (!visible) return null;

  return (
    <div
      className={`relative flex gap-3 rounded-xl border p-4 ${styles.container} ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${styles.iconContainer}`}>
        {icon || <VariantIcon className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold ${styles.titleColor}`}>
            {title}
          </h4>
        )}

        {description && (
          <p className={`mt-1 text-sm ${styles.descriptionColor}`}>
            {description}
          </p>
        )}

        {children && <div className="mt-2">{children}</div>}

        {action && <div className="mt-3">{action}</div>}
      </div>

      {/* Close button */}
      {closable && (
        <button
          type="button"
          onClick={() => setVisible(false)}
          className={`flex-shrink-0 ${styles.iconColor} hover:opacity-70 transition-opacity`}
          aria-label="Close alert"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default Alert;