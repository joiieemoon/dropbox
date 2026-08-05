import type { ReactNode } from "react";

export type ConfirmVariant =
  | "confirm"
  | "warning"
  | "info"
  | "success"
  | "danger";

export interface ConfirmationModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called when modal is dismissed (cancel, close button, ESC, backdrop) */
  onClose: () => void;
  /** Visual variant that determines icon and color scheme */
  variant?: ConfirmVariant;
  /** Modal title text */
  title?: string;
  /** Modal body message (plain text) */
  message?: string;
  /** Custom React content rendered below the message */
  children?: ReactNode;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Called when confirm is clicked. Return false or reject to keep modal open */
  onConfirm?: () => void | Promise<void>;
  /** Loading state disables buttons and shows spinner on confirm */
  loading?: boolean;
  /** Disables all interactions */
  disabled?: boolean;
  /** Close on Escape key press */
  closeOnEscape?: boolean;
  /** Close on backdrop click */
  closeOnOutsideClick?: boolean;
  /** Additional classes for the modal content wrapper */
  className?: string;
}