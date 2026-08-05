import { useRef, useEffect, useCallback } from "react";
import type { ModalProps } from "./Modal.types";

const sizeClasses: Record<string, string> = {
  sm: "max-w-[480px]",
  md: "max-w-[700px]",
  lg: "max-w-[960px]",
  full: "w-full h-full",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
  size = "md",
  footer,
  loading = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  keepMounted = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  // Escape key handling
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, handleClose]);

  // Body scroll lock + restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = "hidden";
    } else if (!keepMounted) {
      document.body.style.overflow = "";
    }

    return () => {
      if (!keepMounted) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, keepMounted]);

  // If not open and not keeping mounted, render nothing
  if (!isOpen && !keepMounted) return null;

  const effectiveFullscreen = isFullscreen || size === "full";
  const maxWidthClass = effectiveFullscreen
    ? ""
    : (sizeClasses[size] ?? sizeClasses.md);

  const contentClasses = effectiveFullscreen
    ? "w-full h-full"
    : `relative w-full rounded-3xl bg-white dark:bg-gray-900 ${maxWidthClass} m-4`;

  // Base wrapper classes: always present to keep DOM mounted
  const wrapperClasses = keepMounted && !isOpen
    ? "fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999 invisible pointer-events-none opacity-0"
    : "fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999";

  // Backdrop visibility
  const backdropClasses = keepMounted && !isOpen
    ? "fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] invisible opacity-0"
    : "fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]";

  return (
    <div
      className={wrapperClasses}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      {!effectiveFullscreen && (
        <div
          className={backdropClasses}
          onClick={closeOnOutsideClick && isOpen ? handleClose : undefined}
        />
      )}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && !effectiveFullscreen && (
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            disabled={loading}
            className="absolute right-3 top-3 z-999 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
        <div>{children}</div>
        {footer && (
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-brand-500 mr-2"
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
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
