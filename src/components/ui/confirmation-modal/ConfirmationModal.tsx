import type { FC, ReactElement } from "react";
import { useCallback } from "react";
import { Modal } from "../../common/modal/Modal";
import type {
  ConfirmationModalProps,
  ConfirmVariant,
} from "./ConfirmationModal.types";

interface VariantConfig {
  icon: (className: string) => ReactElement;
  confirmButtonClass: string;
  iconBgClass: string;
}

function CheckIcon(className: string) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon(className: string) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon(className: string) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon(className: string) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const variantConfig: Record<ConfirmVariant, VariantConfig> = {
  confirm: {
    icon: (cn: string) => CheckIcon(cn),
    confirmButtonClass:
      "bg-brand-500 text-white hover:bg-brand-600 shadow-theme-xs",
    iconBgClass: "bg-brand-50 dark:bg-brand-500/10 text-brand-500",
  },
  warning: {
    icon: (cn: string) => WarningIcon(cn),
    confirmButtonClass:
      "bg-orange-500 text-white hover:bg-orange-600 shadow-theme-xs",
    iconBgClass: "bg-orange-50 dark:bg-orange-500/10 text-orange-500",
  },
  info: {
    icon: (cn: string) => InfoIcon(cn),
    confirmButtonClass:
      "bg-blue-500 text-white hover:bg-blue-600 shadow-theme-xs",
    iconBgClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
  },
  success: {
    icon: (cn: string) => CheckIcon(cn),
    confirmButtonClass:
      "bg-success-500 text-white hover:bg-success-600 shadow-theme-xs",
    iconBgClass: "bg-success-50 dark:bg-success-500/10 text-success-500",
  },
  danger: {
    icon: (cn: string) => DeleteIcon(cn),
    confirmButtonClass:
      "bg-error-500 text-white hover:bg-error-600 shadow-theme-xs",
    iconBgClass: "bg-error-50 dark:bg-error-500/10 text-error-500",
  },
};

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  variant = "confirm",
  title,
  message,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
  disabled = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className = "",
}) => {
  const config = variantConfig[variant];

  const handleConfirm = useCallback(async () => {
    if (loading || disabled) return;
    try {
      await onConfirm?.();
    } catch {
      // Allow the modal to stay open on error
    }
  }, [loading, disabled, onConfirm]);

  const isSubmitting = loading || disabled;

  const modalFooter = (
    <div className="flex items-center gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-theme-xs disabled:opacity-50 disabled:cursor-not-allowed flex-1 ${config.confirmButtonClass}`}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading ? "Processing..." : confirmText}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnEscape={closeOnEscape}
      closeOnOutsideClick={closeOnOutsideClick}
      loading={loading}
      className={`text-center ${className}`}
    >
      <div className="flex flex-col items-center px-6 py-8">
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-full mb-5 ${config.iconBgClass}`}
        >
          {config.icon("w-8 h-8")}
        </div>

        {/* Title */}
        {title && (
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
        )}

        {/* Message */}
        {message && (
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        )}

        {/* Custom content */}
        {children && <div className="w-full mb-6">{children}</div>}

        {/* Footer actions */}
        {modalFooter}
      </div>
    </Modal>
  );
};
