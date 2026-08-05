import type { ReactNode } from "react";

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called when modal should close (Escape, outside click, close button) */
  onClose: () => void;
  /** Additional classes for the modal content wrapper */
  className?: string;
  /** Modal content */
  children: ReactNode;
  /** Show/hide the close button (default: true) */
  showCloseButton?: boolean;
  /** Fullscreen mode (default: false) */
  isFullscreen?: boolean;
  /** Modal size variant (default: "md") */
  size?: "sm" | "md" | "lg" | "full";
  /** Optional footer content rendered below children */
  footer?: ReactNode;
  /** Loading state — disables interactions when true */
  loading?: boolean;
  /** Close on Escape key press (default: true) */
  closeOnEscape?: boolean;
  /** Close on outside click (default: true) */
  closeOnOutsideClick?: boolean;
  /** Keep modal mounted in DOM when closed (default: false).
   *  When true, modal is hidden via CSS but children retain their state. */
  keepMounted?: boolean;
}
