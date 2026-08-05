import type { FC } from "react";
import { ConfirmationModal } from "./ConfirmationModal";
import type { ConfirmationModalProps } from "./ConfirmationModal.types";

export interface DeleteConfirmationModalProps
  extends Omit<ConfirmationModalProps, "variant" | "confirmText" | "cancelText"> {
  /** Text for the delete button (default: "Delete") */
  confirmText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelText?: string;
}

/**
 * Preconfigured ConfirmationModal with danger styling, delete icon,
 * and sensible defaults for delete/remove operations.
 */
export const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({
  title = "Delete Record",
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  ...props
}) => {
  return (
    <ConfirmationModal
      variant="danger"
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      {...props}
    />
  );
};